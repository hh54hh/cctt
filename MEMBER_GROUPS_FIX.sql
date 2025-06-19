-- Fix Member Groups Storage Issues
-- Run this in Supabase SQL Editor to fix courseGroups and dietPlanGroups storage

-- 1. Ensure members table has correct structure for groups
ALTER TABLE members 
ALTER COLUMN course_groups TYPE JSONB USING course_groups::jsonb,
ALTER COLUMN diet_plan_groups TYPE JSONB USING diet_plan_groups::jsonb;

-- 2. Set default values for group columns
ALTER TABLE members 
ALTER COLUMN course_groups SET DEFAULT '[]'::jsonb,
ALTER COLUMN diet_plan_groups SET DEFAULT '[]'::jsonb;

-- 3. Update existing NULL values to empty arrays
UPDATE members 
SET course_groups = '[]'::jsonb 
WHERE course_groups IS NULL;

UPDATE members 
SET diet_plan_groups = '[]'::jsonb 
WHERE diet_plan_groups IS NULL;

-- 4. Add indexes for better performance on group queries
CREATE INDEX IF NOT EXISTS idx_members_course_groups ON members USING GIN (course_groups);
CREATE INDEX IF NOT EXISTS idx_members_diet_plan_groups ON members USING GIN (diet_plan_groups);

-- 5. Verify the structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name IN ('course_groups', 'diet_plan_groups')
ORDER BY column_name;

-- 6. Test query to check if groups are stored correctly
SELECT 
    id,
    name,
    course_groups,
    diet_plan_groups,
    jsonb_array_length(COALESCE(course_groups, '[]'::jsonb)) as course_groups_count,
    jsonb_array_length(COALESCE(diet_plan_groups, '[]'::jsonb)) as diet_groups_count
FROM members 
WHERE course_groups IS NOT NULL OR diet_plan_groups IS NOT NULL
LIMIT 5;
