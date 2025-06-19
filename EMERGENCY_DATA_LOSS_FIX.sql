-- EMERGENCY DATA LOSS FIX
-- Run this immediately in Supabase SQL Editor to prevent data loss

-- 1. First, backup existing data
CREATE TABLE IF NOT EXISTS members_backup AS SELECT * FROM members;

-- 2. Fix column types and defaults
-- Ensure course_groups is JSONB with proper default
ALTER TABLE members 
ALTER COLUMN course_groups TYPE JSONB USING course_groups::jsonb,
ALTER COLUMN course_groups SET DEFAULT '[]'::jsonb;

-- Ensure diet_plan_groups is JSONB with proper default  
ALTER TABLE members
ALTER COLUMN diet_plan_groups TYPE JSONB USING diet_plan_groups::jsonb,
ALTER COLUMN diet_plan_groups SET DEFAULT '[]'::jsonb;

-- Ensure courses is TEXT[] with proper default
ALTER TABLE members
ALTER COLUMN courses TYPE TEXT[] USING courses::text[],
ALTER COLUMN courses SET DEFAULT '{}'::text[];

-- Ensure diet_plans is TEXT[] with proper default
ALTER TABLE members
ALTER COLUMN diet_plans TYPE TEXT[] USING diet_plans::text[],
ALTER COLUMN diet_plans SET DEFAULT '{}'::text[];

-- 3. Fix NULL values (this is likely the main cause of data loss)
UPDATE members 
SET course_groups = '[]'::jsonb 
WHERE course_groups IS NULL OR course_groups::text = '';

UPDATE members 
SET diet_plan_groups = '[]'::jsonb 
WHERE diet_plan_groups IS NULL OR diet_plan_groups::text = '';

UPDATE members 
SET courses = '{}'::text[] 
WHERE courses IS NULL;

UPDATE members 
SET diet_plans = '{}'::text[] 
WHERE diet_plans IS NULL;

-- 4. Fix malformed JSON data
UPDATE members 
SET course_groups = '[]'::jsonb 
WHERE course_groups::text = '{}' OR course_groups::text = 'null';

UPDATE members 
SET diet_plan_groups = '[]'::jsonb 
WHERE diet_plan_groups::text = '{}' OR diet_plan_groups::text = 'null';

-- 5. Ensure NOT NULL constraints where appropriate
ALTER TABLE members 
ALTER COLUMN course_groups SET NOT NULL,
ALTER COLUMN diet_plan_groups SET NOT NULL,
ALTER COLUMN courses SET NOT NULL,
ALTER COLUMN diet_plans SET NOT NULL;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_course_groups ON members USING GIN (course_groups);
CREATE INDEX IF NOT EXISTS idx_members_diet_plan_groups ON members USING GIN (diet_plan_groups);
CREATE INDEX IF NOT EXISTS idx_members_courses ON members USING GIN (courses);
CREATE INDEX IF NOT EXISTS idx_members_diet_plans ON members USING GIN (diet_plans);

-- 7. Create function to prevent data loss in future
CREATE OR REPLACE FUNCTION prevent_data_loss()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure arrays and objects are never NULL
    IF NEW.courses IS NULL THEN
        NEW.courses := '{}'::text[];
    END IF;
    
    IF NEW.diet_plans IS NULL THEN
        NEW.diet_plans := '{}'::text[];
    END IF;
    
    IF NEW.course_groups IS NULL THEN
        NEW.course_groups := '[]'::jsonb;
    END IF;
    
    IF NEW.diet_plan_groups IS NULL THEN
        NEW.diet_plan_groups := '[]'::jsonb;
    END IF;
    
    -- Convert empty strings to proper defaults
    IF NEW.course_groups::text = '' OR NEW.course_groups::text = '{}' THEN
        NEW.course_groups := '[]'::jsonb;
    END IF;
    
    IF NEW.diet_plan_groups::text = '' OR NEW.diet_plan_groups::text = '{}' THEN
        NEW.diet_plan_groups := '[]'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply the trigger to prevent future data loss
DROP TRIGGER IF EXISTS prevent_data_loss_trigger ON members;
CREATE TRIGGER prevent_data_loss_trigger
    BEFORE INSERT OR UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_data_loss();

-- 9. Verify the fix
SELECT 
    id,
    name,
    array_length(courses, 1) as courses_count,
    array_length(diet_plans, 1) as diet_plans_count,
    jsonb_array_length(course_groups) as course_groups_count,
    jsonb_array_length(diet_plan_groups) as diet_plan_groups_count,
    courses,
    diet_plans,
    course_groups,
    diet_plan_groups
FROM members 
WHERE courses IS NOT NULL OR diet_plans IS NOT NULL 
   OR course_groups IS NOT NULL OR diet_plan_groups IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 10. Show members with potential issues
SELECT 
    id,
    name,
    CASE 
        WHEN courses IS NULL THEN 'courses_null'
        WHEN diet_plans IS NULL THEN 'diet_plans_null'
        WHEN course_groups IS NULL THEN 'course_groups_null'
        WHEN diet_plan_groups IS NULL THEN 'diet_plan_groups_null'
        ELSE 'ok'
    END as issue_type
FROM members
WHERE courses IS NULL 
   OR diet_plans IS NULL 
   OR course_groups IS NULL 
   OR diet_plan_groups IS NULL;

-- Success message
SELECT 'SUCCESS: Emergency data loss fix applied! Check the verification queries above.' as status;
