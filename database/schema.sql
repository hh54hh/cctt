-- نظام إدارة صالة حسام جم لكمال الأجسام
-- Hussam Gym Management System Database Schema
-- Created for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول المشتركين / Subscribers Table
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    weight DECIMAL(5,2) DEFAULT 0,
    height DECIMAL(5,2) DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للبحث السريع بالاسم والهاتف
CREATE INDEX idx_subscribers_name ON subscribers USING gin(to_tsvector('arabic', name));
CREATE INDEX idx_subscribers_phone ON subscribers(phone);

-- جدول نقاط التمارين / Course Points Table
CREATE TABLE course_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للبحث في التمارين
CREATE INDEX idx_course_points_name ON course_points USING gin(to_tsvector('arabic', name));

-- جدول العناصر الغذائية / Diet Items Table
CREATE TABLE diet_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للبحث في العناصر الغذائية
CREATE INDEX idx_diet_items_name ON diet_items USING gin(to_tsvector('arabic', name));

-- جدول المجموعات / Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للمجموعات
CREATE INDEX idx_groups_subscriber_id ON groups(subscriber_id);
CREATE INDEX idx_groups_type ON groups(type);

-- جدول عناصر المجموعات / Group Items Table
CREATE TABLE group_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لعناصر المجموعات
CREATE INDEX idx_group_items_group_id ON group_items(group_id);
CREATE INDEX idx_group_items_item_id ON group_items(item_id);

-- جدول المنتجات / Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للمنتجات
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('arabic', name));
CREATE INDEX idx_products_quantity ON products(quantity);

-- جدول المبيعات / Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للمبيعات
CREATE INDEX idx_sales_subscriber_id ON sales(subscriber_id);
CREATE INDEX idx_sales_date ON sales(date);

-- جدول عناصر المبيعات / Sale Items Table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لعناصر المبيعات
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- جدول أكواد الدخول / Access Keys Table
CREATE TABLE access_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_device TEXT DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لأكواد الدخول
CREATE INDEX idx_access_keys_code ON access_keys(code);
CREATE INDEX idx_access_keys_expires_at ON access_keys(expires_at);

-- إنشاء triggers لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers للجداول المطلوبة
CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء views مفيدة للتقارير

-- عرض لإحصائيات المشتركين
CREATE VIEW subscriber_stats AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_subscribers_month,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_subscribers_week,
    AVG(age) FILTER (WHERE age > 0) as average_age,
    AVG(weight) FILTER (WHERE weight > 0) as average_weight
FROM subscribers;

-- عرض لإحصائيات المنتجات
CREATE VIEW product_stats AS
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE quantity = 0) as out_of_stock,
    COUNT(*) FILTER (WHERE quantity < 5 AND quantity > 0) as low_stock,
    SUM(price * quantity) as total_inventory_value
FROM products;

-- عرض للمبيعات اليومية
CREATE VIEW daily_sales AS
SELECT 
    DATE(date) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_price) as total_revenue,
    COUNT(DISTINCT subscriber_id) as unique_customers
FROM sales
GROUP BY DATE(date)
ORDER BY sale_date DESC;

-- عرض للمنتجات الأكثر مبيعاً
CREATE VIEW top_selling_products AS
SELECT 
    p.id,
    p.name,
    p.price,
    SUM(si.quantity) as total_sold,
    SUM(si.quantity * si.unit_price) as total_revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
GROUP BY p.id, p.name, p.price
ORDER BY total_sold DESC;

-- إدراج بيانات تجريبية
-- أكواد دخول صالحة
INSERT INTO access_keys (code, expires_at, user_device) VALUES
('GYM2024', NOW() + INTERVAL '1 month', 'web'),
('HUSSAM2024', NOW() + INTERVAL '3 months', 'web'),
('ADMIN2024', NOW() + INTERVAL '1 year', 'web');

-- تمارين تجريبية
INSERT INTO course_points (name, description) VALUES
('ضغط صدر', '3 مجموعات × 12 تكرار'),
('سحب علوي', '3 مجموعات × 10 تكرار'),
('اسكوات', '4 مجموعات × 15 تكرار'),
('ديدليفت', '3 مجموعات × 8 تكرار'),
('ضغط كتف', '3 مجموعات × 12 تكرار'),
('عقلة', '3 مجموعات × 8 تكرار'),
('بنش برس', '4 مجموعات × 10 تكرار'),
('بايسبس كيرل', '3 مجموعات × 15 تكرار'),
('ترايسبس ديب', '3 مجموعات × 12 تكرار'),
('بلانك', '3 مجموعات × 60 ثانية');

-- عناصر غذائية تجريبية
INSERT INTO diet_items (name, description) VALUES
('بروتين واي', '30 جرام مع الماء بعد التمرين'),
('دجاج مشوي', '150 جرام - وجبة الغداء'),
('أرز بني', '100 جرام مطبوخ'),
('خضار مشكلة', '200 جرام'),
('بيض مسلوق', '3 حبات في الإفطار'),
('سمك سلمون', '120 جرام مشوي'),
('شوفان', '50 جرام مع الحليب'),
('لوز', '30 جرام كوجبة خفيفة'),
('تونة', '1 علبة بدون زيت'),
('موز', '1 حبة متوسطة');

-- منتجات تجريبية
INSERT INTO products (name, description, price, quantity) VALUES
('بروتين واي - شوكولاتة', '2.5 كيلو، نكهة الشوكولاتة', 250.00, 10),
('كرياتين مونوهيدرات', '300 جرام، مكمل الطاقة', 80.00, 15),
('فيتامينات متعددة', '60 كبسولة، فيتامينات يومية', 45.00, 20),
('بروتين كازين', '2 كيلو، بروتين بطيء الامتصاص', 280.00, 8),
('أحماض أمينية BCAA', '300 جرام، للاستشفاء', 120.00, 12),
('أوميجا 3', '100 كبسولة، زيت السمك', 65.00, 25),
('بروتين نباتي', '2 كيلو، للنباتيين', 200.00, 6),
('مالتي فيتامين للرياضيين', '90 قرص', 85.00, 18),
('جلوتامين', '500 جرام، للاستشفاء العضلي', 95.00, 10),
('كافيين طبيعي', '100 كبسولة، للطاقة', 40.00, 30);

-- مشترك تجريبي
INSERT INTO subscribers (name, phone, age, weight, height, notes) VALUES
('أحمد محمد', '0501234567', 25, 75.5, 175, 'عضو نشط، يحضر بانتظام'),
('سارة أحمد', '0507654321', 30, 60.0, 165, 'مبتدئة، تحتاج متابعة خاصة'),
('محمد علي', '0512345678', 28, 80.0, 180, 'لاعب كمال أجسام متقدم');

-- إعطاء صلاحيات للجداول (للاستخدام مع Supabase)
-- يجب تنفيذ هذه الصلاحيات في Supabase Dashboard

-- تفعيل RLS (Row Level Security) للأمان
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

-- سياسات RLS بسيطة (يمكن تخصيصها حسب الحاجة)
-- السماح للجميع بالقراءة والكتابة (مناسب للتطبيقات الداخلية)
CREATE POLICY "Allow all access" ON subscribers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON course_points FOR ALL USING (true);
CREATE POLICY "Allow all access" ON diet_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all access" ON group_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON products FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON access_keys FOR ALL USING (true);

-- تعليقات على الجداول للتوثيق
COMMENT ON TABLE subscribers IS 'جدول المشتركين في الصالة الرياضية';
COMMENT ON TABLE course_points IS 'جدول التمارين المتاحة';
COMMENT ON TABLE diet_items IS 'جدول العناصر الغذائية';
COMMENT ON TABLE groups IS 'جدول مجموعات التمارين والأنظمة الغذائية';
COMMENT ON TABLE group_items IS 'جدول عناصر كل مجموعة';
COMMENT ON TABLE products IS 'جدول منتجات المكملات الغذائية';
COMMENT ON TABLE sales IS 'جدول عمليات البيع';
COMMENT ON TABLE sale_items IS 'جدول تفاصيل كل عملية بيع';
COMMENT ON TABLE access_keys IS 'جدول أكواد الدخول الشهرية';

-- إضافة constraints إضافية للتحقق من صحة البيانات
ALTER TABLE subscribers ADD CONSTRAINT chk_age CHECK (age >= 0 AND age <= 120);
ALTER TABLE subscribers ADD CONSTRAINT chk_weight CHECK (weight >= 0 AND weight <= 500);
ALTER TABLE subscribers ADD CONSTRAINT chk_height CHECK (height >= 0 AND height <= 300);

-- نهاية السكربت
-- يمكن تنفيذ هذا السكربت في SQL Editor في Supabase Dashboard
