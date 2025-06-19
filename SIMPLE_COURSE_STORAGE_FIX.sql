-- Simple and immediate fix for course and diet plan storage
-- This approach stores course and diet plan data directly in the members table as JSON

-- 1. Ensure members table has the correct columns for course and diet plan storage
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS course_groups JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diet_plan_groups JSONB DEFAULT '[]'::jsonb;

-- 2. Update existing members to have proper JSON format
UPDATE members 
SET course_groups = '[]'::jsonb 
WHERE course_groups IS NULL OR course_groups = 'null'::jsonb;

UPDATE members 
SET diet_plan_groups = '[]'::jsonb 
WHERE diet_plan_groups IS NULL OR diet_plan_groups = 'null'::jsonb;

-- 3. Create a simple test to verify the fix works
DO $$
DECLARE
    test_member_id TEXT := 'test-member-' || extract(epoch from now())::text;
    test_courses JSONB := '[{"id": "course-1", "title": "Test Course", "courseIds": ["course-1"]}]'::jsonb;
    test_diet_plans JSONB := '[{"id": "diet-1", "title": "Test Diet", "dietPlanIds": ["diet-1"]}]'::jsonb;
BEGIN
    -- Insert test member with courses and diet plans
    INSERT INTO members (
        id, 
        name, 
        phone, 
        age, 
        height, 
        weight, 
        course_groups, 
        diet_plan_groups,
        created_at,
        updated_at
    ) VALUES (
        test_member_id,
        'Test Member for Course Storage',
        '123456789',
        25,
        170,
        70,
        test_courses,
        test_diet_plans,
        NOW(),
        NOW()
    );
    
    -- Verify the data was saved correctly
    IF EXISTS (
        SELECT 1 FROM members 
        WHERE id = test_member_id 
        AND course_groups = test_courses 
        AND diet_plan_groups = test_diet_plans
    ) THEN
        RAISE NOTICE '✅ Course storage test PASSED - courses and diet plans are saving correctly';
    ELSE
        RAISE NOTICE '❌ Course storage test FAILED - there is still an issue';
    END IF;
    
    -- Clean up test data
    DELETE FROM members WHERE id = test_member_id;
END $$;

-- 4. Create a function to safely update member courses and diet plans
CREATE OR REPLACE FUNCTION update_member_courses_and_diet_plans(
    member_id_param TEXT,
    courses_param JSONB DEFAULT '[]'::jsonb,
    diet_plans_param JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE members 
    SET 
        course_groups = courses_param,
        diet_plan_groups = diet_plans_param,
        updated_at = NOW()
    WHERE id = member_id_param;
    
    -- Check if the update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION update_member_courses_and_diet_plans TO anon, authenticated;

-- 6. Final verification query
SELECT 
    id,
    name,
    course_groups,
    diet_plan_groups
FROM members 
WHERE course_groups != '[]'::jsonb OR diet_plan_groups != '[]'::jsonb
LIMIT 5;

-- Success message
SELECT 'Simple course storage fix completed successfully! Members can now save courses and diet plans.' as status;
