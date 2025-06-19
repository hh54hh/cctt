-- إضافة جداول المخزون والمبيعات المفقودة
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. Products Table (المنتجات - للمخزون)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    category TEXT, -- فئة المنتج (مكملات، مشروبات، إلخ)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sales Table (المبيعات)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL, -- حفظ اسم المنتج للأرشفة
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for products and sales
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Insert some sample products
INSERT INTO products (name, quantity, price, description, category) VALUES
('بروتين مصل اللبن', 10, 250.00, 'مكمل بروتين عالي الجودة', 'مكملات'),
('كرياتين', 15, 180.00, 'لزيادة القوة والطاقة', 'مكملات'),
('مشروب طاقة', 25, 15.00, 'مشروب منشط قبل التمرين', 'مشروبات'),
('فيتامينات متعددة', 20, 120.00, 'فيتامينات ومعادن أساسية', 'مكملات'),
('شيكر بروتين', 8, 45.00, 'كوب خاص لخلط البروتين', 'أدوات'),
('حزام رفع أثقال', 5, 300.00, 'حزام دعم للظهر', 'أدوات')
ON CONFLICT (id) DO NOTHING; -- تجنب إضافة مكررة إذا كانت البيانات موجودة

-- رسالة نجاح
SELECT 'تم إنشاء جداول المخزون والمبيعات بنجاح' as status;
