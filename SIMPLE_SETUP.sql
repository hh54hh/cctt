-- 🏋️ سكربت مبسط لإعداد صالة حسام (يعمل دائماً)
-- انسخ والصق هذا في Supabase SQL Editor

-- 1. إنشاء جدول المشتركين
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء جدول المجموعات
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جدول عناصر المجموعات
CREATE TABLE IF NOT EXISTS group_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- 4. إنشاء جدول التمارين
CREATE TABLE IF NOT EXISTS course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. إنشاء جدول العناصر الغذائية
CREATE TABLE IF NOT EXISTS diet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. إنشاء جدول المنتجات (للمخزن)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    category TEXT,
    barcode TEXT UNIQUE,
    supplier TEXT,
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    min_stock_level INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. إنشاء جدول المبيعات
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. إدراج التمارين الأساسية (مع حماية من التكرار)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM course_points LIMIT 1) THEN
        INSERT INTO course_points (name, description) VALUES
        ('بنش برس', 'تمرين أساسي لعضلات الصدر'),
        ('سكوات', 'تمرين شامل لعضلات الأرجل'),
        ('ديد ليفت', 'تمرين قوي لعضلات الظهر'),
        ('شد علوي', 'تمرين لعضلات الظهر والباي'),
        ('ضغط كتف', 'تمرين لعضلات الكتف'),
        ('كارديو', 'تمارين القلب والأوعية الدموية'),
        ('تمارين البطن', 'تمارين عضلات البطن'),
        ('باي سبس', 'تمرين للعضلة ذات الرأسين'),
        ('تراي سبس', 'تمرين للعضلة ثلاثية الرؤوس');
    END IF;
END $$;

-- 7. إدراج العناصر الغذائية الأساسية (مع حماية من التكرار)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM diet_items LIMIT 1) THEN
        INSERT INTO diet_items (name, description) VALUES
        ('بيض مسلوق', 'مصدر ممتاز للبروتين'),
        ('شوفان', 'كربوهيدرات معقدة وألياف'),
        ('دجاج مشوي', 'بروتين خالي من الدهون'),
        ('أرز بني', 'كربوهيدرات صحية'),
        ('خضروات ورقية', 'فيتامينات ومعادن'),
        ('تمر', 'سكريات طبيعية سريعة'),
        ('لوز', 'دهون صحية وبروتين نباتي'),
        ('حليب خالي الدسم', 'كالسيوم وبر��تين');
    END IF;
END $$;

-- 8. إدراج منتجات أساسية للمخزن
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
        INSERT INTO products (name, description, price, quantity, category, cost_price, min_stock_level) VALUES
        ('واي بروتين - فانيلا', 'مكمل بروتين سريع الامتصاص', 150.00, 50, 'مكملات غذائية', 120.00, 10),
        ('واي بروتين - شوكولاتة', 'مكمل بروتين بطعم الشوكولاتة', 150.00, 45, 'مكملات غذائية', 120.00, 10),
        ('كرياتين مونوهيدرات', 'مكمل لزيادة القوة والطاقة', 80.00, 30, 'مكملات غذائية', 60.00, 5),
        ('مشروب طاقة', 'مشروب طاقة طبيعي', 8.00, 200, 'مشروبات', 5.00, 50),
        ('ماء صحي', 'مياه معدنية طبيعية', 2.50, 500, 'مشروبات', 1.50, 100);
    END IF;
END $$;
END $$;

-- 3. تعطيل Row Level Security للبساطة
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;

-- 9. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_subscribers_name ON subscribers(name);
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_id ON groups(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- ✅ تم الانتهاء! يمكنك الآن استخدام نظام صالة حسام
-- تحقق من النجاح بتشغيل هذا الاستعلام:
-- SELECT 'course_points' as table_name, count(*) FROM course_points
-- UNION ALL SELECT 'diet_items', count(*) FROM diet_items
-- UNION ALL SELECT 'products', count(*) FROM products;
