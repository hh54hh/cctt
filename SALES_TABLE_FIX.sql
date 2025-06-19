-- Fix for sales table missing updated_at column
-- Execute this in Supabase SQL Editor to fix the sync error

-- Add updated_at column to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updating updated_at timestamp
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at value
UPDATE sales 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- Confirmation message
SELECT 'Sales table updated_at column added successfully!' as status;
