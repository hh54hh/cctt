-- صالة حسام جم - Supabase Database Schema
-- Execute this script in your Supabase SQL editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscribers table (جدول المشتركين)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table (جدول المجموعات)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group items table (جدول عناصر المجموعات)
CREATE TABLE IF NOT EXISTS public.group_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course points table (جدول نقاط التدريب)
CREATE TABLE IF NOT EXISTS public.course_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diet items table (جدول عناصر النظام الغذائي)
CREATE TABLE IF NOT EXISTS public.diet_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    calories INTEGER,
    protein DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (جدول المنتجات)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 5,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table (جدول المبيعات)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON public.subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_id ON public.groups(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups(type);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON public.group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_course_points_category ON public.course_points(category);
CREATE INDEX IF NOT EXISTS idx_diet_items_category ON public.diet_items(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER handle_subscribers_updated_at
    BEFORE UPDATE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_group_items_updated_at
    BEFORE UPDATE ON public.group_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_course_points_updated_at
    BEFORE UPDATE ON public.course_points
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_diet_items_updated_at
    BEFORE UPDATE ON public.diet_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can modify these for better security)
CREATE POLICY "Allow all operations on subscribers" ON public.subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on group_items" ON public.group_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on course_points" ON public.course_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on diet_items" ON public.diet_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- Insert some initial course points (نقاط التدريب الأساسية)
INSERT INTO public.course_points (name, description, category) VALUES
('تمرين الضغط', 'تمرين لتقوية عضلات الصدر والذراعين', 'الصدر'),
('تمرين العقلة', 'تمرين لتقوية عضلات الظهر والذراعين', 'الظهر'),
('تمرين الجري', 'تمرين لتحسين اللياقة القلبية', 'الكارديو'),
('تمرين القرفصاء', 'تمرين لتقوية عضلات الأرجل', 'الأرجل'),
('تمرين البطن', 'تمرين لتقوية عضلات البطن', 'البطن'),
('تمرين الدمبل', 'تمرين بالأوزان لتقوية العضلات', 'الأوزان'),
('تمرين المشي السريع', 'تمرين خفيف لتحسين اللياقة', 'الكارديو'),
('تمرين الضغط المائل', 'تمرين متقدم لعضلات الصدر', 'الصدر');

-- Insert some initial diet items (عناصر النظام الغذائي الأساسية)
INSERT INTO public.diet_items (name, description, category, calories, protein) VALUES
('دجاج مشوي', 'صدر دجاج مشوي منزوع الجلد', 'البروتين', 165, 31.0),
('أرز بني', 'أرز بني مطبوخ', 'الكربوهيدرات', 112, 2.6),
('سلطة خضراء', 'سلطة مشكلة من الخضار الورقية', 'الخضار', 20, 1.5),
('تفاح', 'تفاحة متوسطة الحجم', 'الفواكه', 95, 0.5),
('لوز', 'حفنة من اللوز الطبيعي', 'المكسرات', 160, 6.0),
('سمك السلمون', 'قطعة سلمون مشوية', 'البروتين', 206, 22.0),
('بروكلي', 'كوب من البروكلي المطبوخ', 'الخضار', 55, 4.0),
('موز', 'موزة متوسطة الحجم', 'الفواكه', 105, 1.3),
('بيض مسلوق', 'بيضة مسلوقة', 'البروتين', 70, 6.0),
('شوفان', 'كوب من الشوفان المطبوخ', 'الكربوهيدرات', 150, 5.0);

-- Insert some initial products (منتجات أساسية للمتجر)
INSERT INTO public.products (name, type, price, quantity, min_quantity, description) VALUES
('بروتين واي', 'مكملات غذائية', 250.00, 20, 5, 'بروتين واي عالي الجودة لبناء العضلات'),
('كرياتين', 'مكملات غذائية', 80.00, 15, 3, 'كرياتين مونوهيدرات لزيادة القوة'),
('فيتامينات', 'مكملات غذائية', 45.00, 30, 10, 'مجموعة فيتامينات متكاملة'),
('شنطة رياضية', 'معدات رياضية', 120.00, 8, 2, 'شنطة رياضية عملية وقوية'),
('قفازات رياضية', 'معدات رياضية', 35.00, 25, 5, 'قفازات لحماية اليدين أثناء التمرين'),
('حزام رياضي', 'معدات رياضية', 90.00, 12, 3, 'حزام لدعم الظهر أثناء رفع الأوزان'),
('ماء بروتين', 'مشروبات رياضية', 8.00, 50, 20, 'مشروب بروتين جاهز للشرب'),
('مشروب طاقة', 'مشروبات رياضية', 12.00, 40, 15, 'مشروب طاقة طبيعي'),
('بار بروتين', 'وجبات خفيفة', 15.00, 35, 10, 'بار بروتين صحي ومغذي'),
('تيشيرت رياضي', 'ملابس رياضية', 65.00, 18, 5, 'تيشيرت رياضي مريح وقابل للتنفس');

-- Success message
COMMENT ON SCHEMA public IS 'Schema created successfully for صالة حسام جم - Hussam Gym Management System';
