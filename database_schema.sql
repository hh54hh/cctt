-- Gym Management System Database Schema with Enhanced Sales System
-- Run this in your Supabase SQL editor to create all necessary tables

-- Enable Row Level Security (RLS) for all tables
-- Note: For demo purposes, we'll disable RLS. In production, implement proper RLS policies.

-- 1. Subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    weight DECIMAL(5,2) DEFAULT 0,
    height DECIMAL(5,2) DEFAULT 0,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Course Points (Exercise Library)
CREATE TABLE IF NOT EXISTS public.course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Diet Items (Nutrition Library)
CREATE TABLE IF NOT EXISTS public.diet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Groups (for subscriber courses and diet plans)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Group Items (individual items within groups)
CREATE TABLE IF NOT EXISTS public.group_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- 6. Products (Warehouse/Store)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sales (Store sales records) - Enhanced Structure
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT UNIQUE,
    customer_name TEXT NOT NULL DEFAULT 'زبون مجهول',
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sale Items (Individual products in each sale)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Inventory Movements (Track stock changes)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return')),
    quantity INTEGER NOT NULL,
    reference_id UUID, -- Can reference sale_id for sales
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for demo purposes (enable in production with proper policies)
ALTER TABLE public.subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_id ON public.groups(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON public.group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_name ON public.sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_subscriber_id ON public.sales(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);

-- Create functions for automatic invoice numbering
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    current_date TEXT;
BEGIN
    current_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(
        LPAD(
            (EXTRACT(DAY FROM NOW()) * 1000 + 
             EXTRACT(HOUR FROM NOW()) * 60 + 
             EXTRACT(MINUTE FROM NOW()) + 
             RANDOM() * 100)::INTEGER::TEXT, 
            6, '0'
        ), 
        '000001'
    ) INTO new_number;
    
    RETURN 'INV-' || current_date || '-' || new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_invoice_number
    BEFORE INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invoice_number();

-- Create function to update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock quantity
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Record inventory movement
    INSERT INTO public.inventory_movements (
        product_id, 
        movement_type, 
        quantity, 
        reference_id, 
        notes
    ) VALUES (
        NEW.product_id, 
        'sale', 
        -NEW.quantity, 
        NEW.sale_id, 
        'Sale transaction'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_sale
    AFTER INSERT ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_sale();

-- Insert sample data for testing

-- Sample course points
INSERT INTO public.course_points (name, description) VALUES
('بنج أمامي', 'تمرين لعضلات الصدر الأمامية'),
('سكوات', 'تمرين للأرجل والأرداف'),
('ظهر', 'تمرين لعضلات الظهر'),
('أكتاف', 'تمرين لعضلات الأكتاف'),
('بايسيبس', 'تمرين للعضلة ذات الرأسين'),
('ترايسيبس', 'تمرين للعضلة ثلاثية الرؤوس'),
('تمرين القلب', 'تمارين الكارديو'),
('عضلات البطن', 'تمرين لعضلات البطن'),
('سحب علوي', 'تمرين لعضلات الظهر العلوية'),
('دفع جانبي', 'تمرين للأكتاف الجانبية')
ON CONFLICT (name) DO NOTHING;

-- Sample diet items
INSERT INTO public.diet_items (name, description) VALUES
('بيض مسلوق', 'بروتين عالي - 2 حبة'),
('شوفان', 'كربوهيدرات صحية - كوب واحد'),
('تمر', 'سكريات طبيعية - 3 حبات'),
('لوز', 'دهون صحية - حفنة'),
('دجاج مشوي', 'بروتين خالي من الدهون - 150 جرام'),
('أرز أسمر', 'كربوهيدرات مرك��ة - كوب'),
('سلطة خضراء', 'فيتامينات ومعادن'),
('تونة', 'بروتين من الأسماك - علبة واحدة'),
('موز', 'فاكهة غنية بالبوتاسيوم'),
('زبدة الفول السوداني', 'دهون صحية وبروتين - ملعقة كبيرة'),
('حليب قليل الدسم', 'كالسيوم وبروتين - كوب'),
('جبنة قريش', 'بروتين قليل الدهون - 100 جرام')
ON CONFLICT (name) DO NOTHING;

-- Sample products for store
INSERT INTO public.products (name, description, price, cost_price, stock_quantity, min_stock_level, category) VALUES
('بروتين واي', 'مكمل بروتين للعضلات - 2 كيلو', 150.00, 100.00, 50, 10, 'مكملات غذائية'),
('كرياتين', 'مكمل لزيادة القوة والأداء - 300 جرام', 80.00, 50.00, 30, 5, 'مكملات غذائية'),
('فيتامينات متعددة', 'مكمل الفيتامينات اليومية - 60 قرص', 60.00, 35.00, 25, 5, 'فيتامينات'),
('شاكر بروتين', 'زجاجة خلط البروتين - 700 مل', 25.00, 15.00, 40, 10, 'إكسسوارات'),
('حزام تمرين', 'حزام دعم الظهر أثناء التمرين', 120.00, 80.00, 15, 3, 'معدات'),
('قفازات تمرين', 'قفازات حماية اليدين', 45.00, 25.00, 20, 5, 'إكسسوارات'),
('BCAA', 'أحماض أمينية متفرعة السلسلة', 90.00, 60.00, 35, 8, 'مكملات غذائية'),
('بروتين كازين', 'بروتين بطيء الامتصاص', 180.00, 120.00, 25, 6, 'مكملات غذائية'),
('جينر', 'مكمل زيادة الوزن', 200.00, 140.00, 20, 4, 'مكملات غذائية'),
('زجاجة مياه رياضية', 'زجاجة مياه 1 لتر', 15.00, 8.00, 60, 15, 'إكسسوارات'),
('منشفة رياضية', 'منشفة قطنية للتمرين', 30.00, 18.00, 45, 12, 'إكسسوارات'),
('حذاء رياضي', 'حذاء تمرين احترافي', 250.00, 180.00, 12, 3, 'ملابس وأحذية')
ON CONFLICT DO NOTHING;

-- Create a view for sales with details
CREATE OR REPLACE VIEW sales_with_details AS
SELECT 
    s.*,
    sub.name as subscriber_name,
    sub.phone as subscriber_phone,
    COUNT(si.id) as items_count,
    STRING_AGG(p.name, ', ') as products_names
FROM public.sales s
LEFT JOIN public.subscribers sub ON s.subscriber_id = sub.id
LEFT JOIN public.sale_items si ON s.id = si.sale_id
LEFT JOIN public.products p ON si.product_id = p.id
GROUP BY s.id, sub.name, sub.phone;

-- Create a view for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT *
FROM public.products
WHERE stock_quantity <= min_stock_level
ORDER BY (stock_quantity::DECIMAL / NULLIF(min_stock_level, 0)) ASC;

-- Create a view for daily sales summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(sale_date) as sale_date,
    COUNT(*) as sales_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_sale
FROM public.sales
WHERE status = 'completed'
GROUP BY DATE(sale_date)
ORDER BY sale_date DESC;

-- Display success message
SELECT 'تم إنشاء قاعدة البيانات المتقدمة بنجاح!' as status,
       'جميع الجداول والوظائف والمشاهد تم إنشاؤها بنجاح' as details;
