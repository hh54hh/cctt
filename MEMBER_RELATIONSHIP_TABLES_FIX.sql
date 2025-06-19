-- Critical Fix: Create Proper Relationship Tables for Member Courses and Diet Plans
-- This SQL will create the missing relationship tables needed for storing member courses and diet plans

-- 1. Create member_courses junction table
CREATE TABLE IF NOT EXISTS member_courses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    member_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(member_id, course_id) -- Prevent duplicate assignments
);

-- 2. Create member_diet_plans junction table
CREATE TABLE IF NOT EXISTS member_diet_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    member_id TEXT NOT NULL,
    diet_plan_id TEXT NOT NULL,
    diet_plan_name TEXT NOT NULL,
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE,
    UNIQUE(member_id, diet_plan_id) -- Prevent duplicate assignments
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_courses_member_id ON member_courses(member_id);
CREATE INDEX IF NOT EXISTS idx_member_courses_course_id ON member_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_member_diet_plans_member_id ON member_diet_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_member_diet_plans_diet_plan_id ON member_diet_plans(diet_plan_id);

-- 4. Update members table to ensure proper structure
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS course_groups JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diet_plan_groups JSONB DEFAULT '[]'::jsonb;

-- 5. Safe function to migrate existing data from arrays to relationship tables
CREATE OR REPLACE FUNCTION migrate_member_relationships()
RETURNS void AS $$
DECLARE
    member_record RECORD;
    course_id TEXT;
    diet_plan_id TEXT;
BEGIN
    -- Migrate courses
    FOR member_record IN 
        SELECT id, courses, course_groups 
        FROM members 
        WHERE courses IS NOT NULL AND array_length(courses, 1) > 0
    LOOP
        -- Process array courses
        IF member_record.courses IS NOT NULL THEN
            FOREACH course_id IN ARRAY member_record.courses
            LOOP
                INSERT INTO member_courses (member_id, course_id, course_name)
                SELECT member_record.id, course_id, COALESCE(c.name, course_id)
                FROM courses c WHERE c.id = course_id
                ON CONFLICT (member_id, course_id) DO NOTHING;
            END LOOP;
        END IF;
        
        -- Process JSON course groups
        IF member_record.course_groups IS NOT NULL THEN
            INSERT INTO member_courses (member_id, course_id, course_name)
            SELECT 
                member_record.id,
                (course_item->>'id')::text,
                COALESCE((course_item->>'name')::text, (course_item->>'id')::text)
            FROM jsonb_array_elements(member_record.course_groups) AS course_item
            WHERE course_item->>'id' IS NOT NULL
            ON CONFLICT (member_id, course_id) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Migrate diet plans
    FOR member_record IN 
        SELECT id, diet_plans, diet_plan_groups 
        FROM members 
        WHERE diet_plans IS NOT NULL AND array_length(diet_plans, 1) > 0
    LOOP
        -- Process array diet plans
        IF member_record.diet_plans IS NOT NULL THEN
            FOREACH diet_plan_id IN ARRAY member_record.diet_plans
            LOOP
                INSERT INTO member_diet_plans (member_id, diet_plan_id, diet_plan_name)
                SELECT member_record.id, diet_plan_id, COALESCE(d.name, diet_plan_id)
                FROM diet_plans d WHERE d.id = diet_plan_id
                ON CONFLICT (member_id, diet_plan_id) DO NOTHING;
            END LOOP;
        END IF;
        
        -- Process JSON diet plan groups
        IF member_record.diet_plan_groups IS NOT NULL THEN
            INSERT INTO member_diet_plans (member_id, diet_plan_id, diet_plan_name)
            SELECT 
                member_record.id,
                (diet_item->>'id')::text,
                COALESCE((diet_item->>'name')::text, (diet_item->>'id')::text)
            FROM jsonb_array_elements(member_record.diet_plan_groups) AS diet_item
            WHERE diet_item->>'id' IS NOT NULL
            ON CONFLICT (member_id, diet_plan_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get member with all courses and diet plans
CREATE OR REPLACE FUNCTION get_member_with_relationships(member_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'member', row_to_json(m),
        'courses', COALESCE(courses_json.courses, '[]'::json),
        'diet_plans', COALESCE(diet_plans_json.diet_plans, '[]'::json)
    ) INTO result
    FROM members m
    LEFT JOIN (
        SELECT 
            mc.member_id,
            json_agg(json_build_object(
                'id', mc.course_id,
                'name', mc.course_name,
                'assigned_date', mc.assigned_date
            )) as courses
        FROM member_courses mc
        WHERE mc.member_id = member_id_param
        GROUP BY mc.member_id
    ) courses_json ON courses_json.member_id = m.id
    LEFT JOIN (
        SELECT 
            mdp.member_id,
            json_agg(json_build_object(
                'id', mdp.diet_plan_id,
                'name', mdp.diet_plan_name,
                'assigned_date', mdp.assigned_date
            )) as diet_plans
        FROM member_diet_plans mdp
        WHERE mdp.member_id = member_id_param
        GROUP BY mdp.member_id
    ) diet_plans_json ON diet_plans_json.member_id = m.id
    WHERE m.id = member_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to assign course to member
CREATE OR REPLACE FUNCTION assign_course_to_member(member_id_param TEXT, course_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    course_name_var TEXT;
BEGIN
    -- Get course name
    SELECT name INTO course_name_var FROM courses WHERE id = course_id_param;
    
    IF course_name_var IS NULL THEN
        RAISE EXCEPTION 'Course with ID % not found', course_id_param;
    END IF;
    
    -- Insert into relationship table
    INSERT INTO member_courses (member_id, course_id, course_name)
    VALUES (member_id_param, course_id_param, course_name_var)
    ON CONFLICT (member_id, course_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to assign diet plan to member
CREATE OR REPLACE FUNCTION assign_diet_plan_to_member(member_id_param TEXT, diet_plan_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    diet_plan_name_var TEXT;
BEGIN
    -- Get diet plan name
    SELECT name INTO diet_plan_name_var FROM diet_plans WHERE id = diet_plan_id_param;
    
    IF diet_plan_name_var IS NULL THEN
        RAISE EXCEPTION 'Diet plan with ID % not found', diet_plan_id_param;
    END IF;
    
    -- Insert into relationship table
    INSERT INTO member_diet_plans (member_id, diet_plan_id, diet_plan_name)
    VALUES (member_id_param, diet_plan_id_param, diet_plan_name_var)
    ON CONFLICT (member_id, diet_plan_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions
GRANT ALL ON member_courses TO anon, authenticated;
GRANT ALL ON member_diet_plans TO anon, authenticated;

-- 10. Run migration (uncomment if you want to migrate existing data)
-- SELECT migrate_member_relationships();

-- Verification queries to check if tables were created successfully
SELECT 
    'member_courses' as table_name,
    count(*) as record_count
FROM member_courses
UNION ALL
SELECT 
    'member_diet_plans' as table_name,
    count(*) as record_count
FROM member_diet_plans;

-- Final confirmation
SELECT 'Relationship tables created successfully! Run migrate_member_relationships() to migrate existing data.' as status;
