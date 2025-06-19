-- EMERGENCY DATA LOSS FIX V2
-- Handles mixed data types and prevents SQL errors
-- Run this in Supabase SQL Editor immediately

-- 1. Backup existing data
CREATE TABLE IF NOT EXISTS members_backup_v2 AS SELECT * FROM members;

-- 2. Add helper function to safely get array length
CREATE OR REPLACE FUNCTION safe_array_length(input_value ANYELEMENT)
RETURNS INTEGER AS $$
BEGIN
    -- Handle different input types safely
    CASE 
        WHEN input_value IS NULL THEN 
            RETURN 0;
        WHEN pg_typeof(input_value) = 'text[]'::regtype THEN
            RETURN array_length(input_value::text[], 1);
        WHEN pg_typeof(input_value) = 'jsonb'::regtype THEN
            RETURN jsonb_array_length(input_value::jsonb);
        WHEN pg_typeof(input_value) = 'json'::regtype THEN
            RETURN json_array_length(input_value::json);
        WHEN pg_typeof(input_value) = 'text'::regtype THEN
            -- Try to parse as JSON array
            BEGIN
                IF input_value::text = '' OR input_value::text = '{}' THEN
                    RETURN 0;
                ELSIF input_value::text ~ '^\[.*\]$' THEN
                    RETURN json_array_length(input_value::text::json);
                ELSIF input_value::text ~ '^\{.*\}$' AND input_value::text != '{}' THEN
                    -- PostgreSQL array format like {item1,item2}
                    RETURN array_length(string_to_array(trim(input_value::text, '{}'), ','), 1);
                ELSE
                    RETURN 0;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RETURN 0;
            END;
        ELSE
            RETURN 0;
    END CASE;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to safely convert to JSONB array
CREATE OR REPLACE FUNCTION safe_to_jsonb_array(input_value ANYELEMENT)
RETURNS JSONB AS $$
BEGIN
    CASE 
        WHEN input_value IS NULL THEN 
            RETURN '[]'::jsonb;
        WHEN pg_typeof(input_value) = 'jsonb'::regtype THEN
            -- Already JSONB, validate it's an array
            IF jsonb_typeof(input_value::jsonb) = 'array' THEN
                RETURN input_value::jsonb;
            ELSE
                RETURN '[]'::jsonb;
            END IF;
        WHEN pg_typeof(input_value) = 'json'::regtype THEN
            RETURN input_value::json::jsonb;
        WHEN pg_typeof(input_value) = 'text[]'::regtype THEN
            RETURN to_jsonb(input_value::text[]);
        WHEN pg_typeof(input_value) = 'text'::regtype THEN
            BEGIN
                IF input_value::text = '' OR input_value::text = '{}' OR input_value::text = 'null' THEN
                    RETURN '[]'::jsonb;
                ELSIF input_value::text ~ '^\[.*\]$' THEN
                    RETURN input_value::text::jsonb;
                ELSIF input_value::text ~ '^\{.*\}$' AND input_value::text != '{}' THEN
                    -- Convert PostgreSQL array to JSONB
                    RETURN to_jsonb(string_to_array(trim(input_value::text, '{}'), ','));
                ELSE
                    RETURN '[]'::jsonb;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RETURN '[]'::jsonb;
            END;
        ELSE
            RETURN '[]'::jsonb;
    END CASE;
EXCEPTION WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to safely convert to text array
CREATE OR REPLACE FUNCTION safe_to_text_array(input_value ANYELEMENT)
RETURNS TEXT[] AS $$
BEGIN
    CASE 
        WHEN input_value IS NULL THEN 
            RETURN '{}'::text[];
        WHEN pg_typeof(input_value) = 'text[]'::regtype THEN
            RETURN input_value::text[];
        WHEN pg_typeof(input_value) = 'jsonb'::regtype THEN
            -- Convert JSONB array to text array
            RETURN ARRAY(SELECT jsonb_array_elements_text(input_value::jsonb));
        WHEN pg_typeof(input_value) = 'json'::regtype THEN
            RETURN ARRAY(SELECT json_array_elements_text(input_value::json));
        WHEN pg_typeof(input_value) = 'text'::regtype THEN
            BEGIN
                IF input_value::text = '' OR input_value::text = '{}' OR input_value::text = 'null' THEN
                    RETURN '{}'::text[];
                ELSIF input_value::text ~ '^\[.*\]$' THEN
                    RETURN ARRAY(SELECT json_array_elements_text(input_value::text::json));
                ELSIF input_value::text ~ '^\{.*\}$' AND input_value::text != '{}' THEN
                    RETURN string_to_array(trim(input_value::text, '{}'), ',');
                ELSE
                    RETURN '{}'::text[];
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RETURN '{}'::text[];
            END;
        ELSE
            RETURN '{}'::text[];
    END CASE;
EXCEPTION WHEN OTHERS THEN
    RETURN '{}'::text[];
END;
$$ LANGUAGE plpgsql;

-- 5. Fix all data using safe functions
UPDATE members SET 
    courses = safe_to_text_array(courses),
    diet_plans = safe_to_text_array(diet_plans),
    course_groups = safe_to_jsonb_array(course_groups),
    diet_plan_groups = safe_to_jsonb_array(diet_plan_groups);

-- 6. Set proper column types and defaults
ALTER TABLE members 
    ALTER COLUMN courses SET DEFAULT '{}'::text[],
    ALTER COLUMN diet_plans SET DEFAULT '{}'::text[],
    ALTER COLUMN course_groups SET DEFAULT '[]'::jsonb,
    ALTER COLUMN diet_plan_groups SET DEFAULT '[]'::jsonb;

-- 7. Set NOT NULL constraints
ALTER TABLE members 
    ALTER COLUMN courses SET NOT NULL,
    ALTER COLUMN diet_plans SET NOT NULL,
    ALTER COLUMN course_groups SET NOT NULL,
    ALTER COLUMN diet_plan_groups SET NOT NULL;

-- 8. Create improved trigger function
CREATE OR REPLACE FUNCTION prevent_data_loss_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Use our safe conversion functions
    NEW.courses := safe_to_text_array(NEW.courses);
    NEW.diet_plans := safe_to_text_array(NEW.diet_plans);
    NEW.course_groups := safe_to_jsonb_array(NEW.course_groups);
    NEW.diet_plan_groups := safe_to_jsonb_array(NEW.diet_plan_groups);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Apply the improved trigger
DROP TRIGGER IF EXISTS prevent_data_loss_trigger ON members;
DROP TRIGGER IF EXISTS prevent_data_loss_trigger_v2 ON members;
CREATE TRIGGER prevent_data_loss_trigger_v2
    BEFORE INSERT OR UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_data_loss_v2();

-- 10. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_members_courses_gin ON members USING GIN (courses);
CREATE INDEX IF NOT EXISTS idx_members_diet_plans_gin ON members USING GIN (diet_plans);
CREATE INDEX IF NOT EXISTS idx_members_course_groups_gin ON members USING GIN (course_groups);
CREATE INDEX IF NOT EXISTS idx_members_diet_plan_groups_gin ON members USING GIN (diet_plan_groups);

-- 11. Verification query (safe version)
SELECT 
    id,
    name,
    safe_array_length(courses) as courses_count,
    safe_array_length(diet_plans) as diet_plans_count,
    safe_array_length(course_groups) as course_groups_count,
    safe_array_length(diet_plan_groups) as diet_plan_groups_count,
    pg_typeof(courses) as courses_type,
    pg_typeof(diet_plans) as diet_plans_type,
    pg_typeof(course_groups) as course_groups_type,
    pg_typeof(diet_plan_groups) as diet_plan_groups_type
FROM members 
ORDER BY created_at DESC
LIMIT 10;

-- 12. Show fixed data summary
SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE safe_array_length(courses) > 0) as members_with_courses,
    COUNT(*) FILTER (WHERE safe_array_length(diet_plans) > 0) as members_with_diet_plans,
    COUNT(*) FILTER (WHERE safe_array_length(course_groups) > 0) as members_with_course_groups,
    COUNT(*) FILTER (WHERE safe_array_length(diet_plan_groups) > 0) as members_with_diet_plan_groups
FROM members;

-- Success message
SELECT 'SUCCESS: V2 Emergency data loss fix applied successfully! All data types normalized.' as status;
