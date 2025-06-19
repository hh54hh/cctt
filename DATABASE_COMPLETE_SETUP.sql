-- 🏋️ نظام إدارة صالة حسام الرياضية - السكربت الكامل لإنشاء جميع الجداول
-- يجب تنفيذ هذا السكربت في Supabase SQL Editor

-- ================================================
-- 1️⃣ جدول المشتركين (Subscribers)
-- ================================================
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

-- ================================================
-- 2️⃣ جدول المجموعات (Groups) - للكورسات والأنظمة الغذائية
-- ================================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3️⃣ جدول عناصر المجموعات (Group Items)
-- ================================================
CREATE TABLE IF NOT EXISTS group_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- ================================================
-- 4️⃣ جدول مكتبة التمارين (Course Points)
-- ================================================
CREATE TABLE IF NOT EXISTS course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 5️⃣ جدول مكتبة العناصر الغذائية (Diet Items)
-- ================================================
CREATE TABLE IF NOT EXISTS diet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 6️⃣ جدول المنتجات (Products) - للمخزن
-- ================================================
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

-- ================================================
-- 7️⃣ جدول المبيعات (Sales)
-- ================================================
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

-- ================================================
-- 8️⃣ جدول تقارير المخزن (Stock Movements) - اختياري
-- ================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_id UUID, -- يمكن أن يكون معرف المبيعة أو الشراء
    reference_type TEXT, -- sale, purchase, adjustment
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 🔍 إنشاء الفهارس (Indexes) لتحسين الأداء
-- ================================================

-- فهارس المشتركين
CREATE INDEX IF NOT EXISTS idx_subscribers_name ON subscribers(name);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);

-- فهارس المجموعات
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_id ON groups(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at);

-- فهارس عناصر المجموعات
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_items_order ON group_items(order_index);

-- فهارس التمارين والأطعمة
CREATE INDEX IF NOT EXISTS idx_course_points_name ON course_points(name);
CREATE INDEX IF NOT EXISTS idx_diet_items_name ON diet_items(name);

-- فهارس المنتجات
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

-- فهارس المبيعات
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_total_price ON sales(total_price);

-- فهارس حركات المخزن
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- ================================================
-- 🛡️ إنشاء Functions مفيدة
-- ================================================

-- Function لحساب إجمالي قيمة المخزن
CREATE OR REPLACE FUNCTION calculate_total_inventory_value()
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(quantity * price), 0)
        FROM products
        WHERE quantity > 0
    );
END;
$$ LANGUAGE plpgsql;

-- Function لحساب الأرباح اليومية
CREATE OR REPLACE FUNCTION calculate_daily_profit(target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(
            (s.unit_price - COALESCE(p.cost_price, 0)) * s.quantity_sold
        ), 0)
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE DATE(s.created_at) = target_date
    );
END;
$$ LANGUAGE plpgsql;

-- Function لتحديث المخزن عند البيع
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- تقليل الكمية من المنتج
    UPDATE products
    SET quantity = quantity - NEW.quantity_sold,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    -- إضافة حركة مخزن
    INSERT INTO stock_movements (
        product_id, movement_type, quantity, reference_id, reference_type, notes
    ) VALUES (
        NEW.product_id, 'out', NEW.quantity_sold, NEW.id, 'sale',
        'بيع للعميل: ' || NEW.buyer_name
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger لتحديث المخزن تلقائياً عند البيع
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_sale();

-- ================================================
-- 📊 إدراج البيانات الأولية
-- ================================================

-- إدراج التمارين الأساسية
INSERT INTO course_points (name, description)
SELECT * FROM (VALUES
    ('بنش برس', 'تمرين أساسي لعضلات الصدر'),
    ('سكوات', 'تمرين شامل لعضلات الأرجل والمؤخرة'),
    ('ديد ليفت', 'تمرين قوي لعضلات الظهر والأرجل'),
    ('شد علوي', 'تمرين لعضلات الظهر والعضلة ذات الرأسين'),
    ('ضغط كتف', 'تمرين لتقوية عضلات الكتف'),
    ('ضغط فرنسي', 'تمرين مخصص للعضلة ثلاثية الرؤوس'),
    ('كارديو', 'تمارين القلب والأوعية الدموية'),
    ('تمارين البطن', 'تمارين لتقوية عضلات البطن الأساسية'),
    ('باي سبس', 'تمرين للعضلة ذات الرأسين'),
    ('تراي سبس', 'تمرين للعضلة ثلاثية الرؤوس'),
    ('رفرفة جانبية', 'تمرين لعضلات الكتف الجانبية'),
    ('سحب أرضي', 'تمرين لعضلات الظهر السفلية'),
    ('لونجز', 'تمرين للأرجل والتوازن'),
    ('بلانك', 'تمرين ثبات لعضلات الجذع'),
    ('بيربي', 'تمرين شامل للجسم')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM course_points WHERE course_points.name = v.name
);

-- إدراج العناصر الغذائية الأساسية
INSERT INTO diet_items (name, description)
SELECT * FROM (VALUES
    ('بيض مسلوق', 'مصدر ممتاز للبروتين عالي الجودة'),
    ('شوفان', 'كربوهيدرات معقدة وألياف مفيدة'),
    ('دجاج مشوي', 'بروتين خالي من الدهون'),
    ('أرز بني', 'كربوهيدرات صحية مع ألياف'),
    ('خضروات ورقية', 'مصدر الفيتامينات والمعادن'),
    ('تمر', 'سكريات طبيعية سري��ة الامتصاص'),
    ('لوز', 'دهون صحية وبروتين نباتي'),
    ('سمك السلمون', 'أوميغا 3 وبروتين عالي الجودة'),
    ('حليب خالي الدسم', 'كالسيوم وبروتين'),
    ('فواكه موسمية', 'فيتامينات طبيعية وألياف'),
    ('زيت الزيتون', 'دهون أحادية غير مشبعة'),
    ('كينوا', 'بروتين نباتي كامل'),
    ('أفوكادو', 'دهون صحية وألياف'),
    ('زبادي يوناني', 'بروتين وبروبيوتيك'),
    ('بذور الشيا', 'أوميغا 3 وألياف')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM diet_items WHERE diet_items.name = v.name
);

-- إدراج منتجات أساسية للمخزن
INSERT INTO products (name, description, price, quantity, category, cost_price, min_stock_level)
SELECT * FROM (VALUES
    ('واي بروتين - فانيلا', 'مكمل بروتين سريع الامتصاص', 150.00, 50, 'مكملات غذائية', 120.00, 10),
    ('واي بروتين - شوكولاتة', 'مكمل بروتين بطعم الشوكولاتة', 150.00, 45, 'مكملات غذائية', 120.00, 10),
    ('كرياتين مونوهيدرات', 'مكمل لزيادة القوة والطاقة', 80.00, 30, 'مكملات غذائية', 60.00, 5),
    ('فيتامينات متعددة', 'مكمل فيتامينات شامل', 45.00, 100, 'فيتامينات', 30.00, 20),
    ('أوميغا 3', 'مكمل أحماض دهنية أساسية', 65.00, 25, 'مكملات غذائية', 45.00, 10),
    ('مشروب طاقة', 'مشروب طاقة طبيعي', 8.00, 200, 'مشروبات', 5.00, 50),
    ('ماء صحي', 'مياه معدنية طبيعية', 2.50, 500, 'مشروبات', 1.50, 100),
    ('بار بروتين', 'وجبة خفيفة غنية بالبروتين', 12.00, 150, 'وجبات خفيفة', 8.00, 30),
    ('قفازات رياضية', 'قفازات تدريب عالية الجودة', 35.00, 20, 'معدات رياضية', 25.00, 5),
    ('حزام رفع أثقال', 'حزام دعم للظهر', 120.00, 15, 'معدات رياضية', 80.00, 3)
) AS v(name, description, price, quantity, category, cost_price, min_stock_level)
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE products.name = v.name
);

-- ================================================
-- ���� إعدادات الأمان (اختياري)
-- ================================================

-- تعطيل Row Level Security مؤقتاً للبساطة
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- ملاحظة: يمكنك تفعيل RLS لاحقاً وإنشاء policies حسب احتياجاتك

-- ================================================
-- ✅ اكتمل إنشاء جميع الجداول والبيانات الأولية
-- ================================================

-- للتحقق من نجاح العملية، شغل هذه الاستعلامات:
-- SELECT 'subscribers' as table_name, count(*) as count FROM subscribers
-- UNION ALL
-- SELECT 'course_points', count(*) FROM course_points
-- UNION ALL
-- SELECT 'diet_items', count(*) FROM diet_items
-- UNION ALL
-- SELECT 'products', count(*) FROM products;
