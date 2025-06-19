/*
===============================================
   إصلاح سريع للجداول المفقودة - صالة حسام جم
===============================================

الهدف: إضافة جداول المخزون والمبيعات المفقودة
التاريخ: 2024
الإصدار: 2.0

تعليمات الاستخدام:
1. انتقل إلى Supabase Dashboard
2. اضغط على "SQL Editor" 
3. انسخ والصق كامل محتوى هذا الملف
4. اضغط "Run" أو Ctrl+Enter
5. أعد تحميل صفحة التطبيق

===============================================
*/

-- ====================================
-- الخطوة 1: إنشاء جدول المنتجات
-- ====================================

DO $$
BEGIN
    -- ا��تحقق من وجود الجدول أولاً
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'products') THEN
        
        CREATE TABLE products (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
            price DECIMAL(10,2) DEFAULT 0.00 CHECK (price >= 0),
            description TEXT,
            category TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ تم إنشاء جدول المنتجات (products) بنجاح';
        
    ELSE
        RAISE NOTICE '⚠️ جدول المنتجات (products) موجود بالفعل';
    END IF;
END
$$;

-- ====================================
-- الخطوة 2: إنشاء جدول المبيعات
-- ====================================

DO $$
BEGIN
    -- التحقق من وجود الجدول أولاً
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'sales') THEN
        
        CREATE TABLE sales (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            buyer_name TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
            total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
            sale_date TIMESTAMPTZ DEFAULT NOW(),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- إضافة مفتاح خارجي للربط مع جدول المنتجات
            CONSTRAINT fk_sales_product 
                FOREIGN KEY (product_id) 
                REFERENCES products(id) 
                ON DELETE CASCADE
        );
        
        RAISE NOTICE '✅ تم إنشاء جدول المبيعات (sales) بنجاح';
        
    ELSE
        RAISE NOTICE '⚠️ جدول المبيعات (sales) موجود بالفعل';
    END IF;
END
$$;

-- ====================================
-- الخطوة 3: إنشاء الفهارس للأداء
-- ====================================

-- فهارس جدول المنتجات
CREATE INDEX IF NOT EXISTS idx_products_name 
    ON products(name);
    
CREATE INDEX IF NOT EXISTS idx_products_category 
    ON products(category);
    
CREATE INDEX IF NOT EXISTS idx_products_quantity 
    ON products(quantity);
    
CREATE INDEX IF NOT EXISTS idx_products_created_at 
    ON products(created_at);

-- فهارس جدول المبيعات
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name 
    ON sales(buyer_name);
    
CREATE INDEX IF NOT EXISTS idx_sales_product_id 
    ON sales(product_id);
    
CREATE INDEX IF NOT EXISTS idx_sales_sale_date 
    ON sales(sale_date);
    
CREATE INDEX IF NOT EXISTS idx_sales_created_at 
    ON sales(created_at);

-- ====================================
-- الخطوة 4: إضافة البيانات التجريبية
-- ====================================

-- إدراج المنتجات التجريبية (مع تجنب التكرار)
INSERT INTO products (name, quantity, price, description, category) 
VALUES 
    ('بروتين مصل اللبن', 10, 250.00, 'مكمل بروتين عالي الجودة', 'مكملات'),
    ('كرياتين', 15, 180.00, 'لزيادة القوة والطاقة', 'مكملات'),
    ('مشروب طاقة', 25, 15.00, 'مشروب منشط قبل التمرين', 'مشروبات'),
    ('فيتامينات متعددة', 20, 120.00, 'فيتامينات ومعادن أساسية', 'مكملات'),
    ('شيكر بروتين', 8, 45.00, 'كوب خاص لخلط البروتين', 'أدوات'),
    ('حزام رفع أثقال', 5, 300.00, 'حزام دعم للظهر', 'أدوات'),
    ('قفازات رياضية', 12, 85.00, 'قفازات حماية لليدين', 'أدوات'),
    ('مشروب طاقة طبيعي', 30, 12.00, 'مشروب منشط طبيعي', 'مشروبات'),
    ('أحماض أمينية', 18, 200.00, 'مكمل أحماض أمينية متفرعة السلسلة', 'مكملات'),
    ('منشفة رياضية', 15, 25.00, 'منشفة سريعة الجفاف', 'إكسسوارات')
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- الخطوة 5: التحقق من النجاح
-- ====================================

-- عرض نتائج العملية
DO $$
DECLARE
    products_count INTEGER;
    sales_count INTEGER;
BEGIN
    -- عد المنتجات
    SELECT COUNT(*) INTO products_count FROM products;
    
    -- عد المبيعات
    SELECT COUNT(*) INTO sales_count FROM sales;
    
    -- عرض النتائج
    RAISE NOTICE '';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '          🎉 تم الإصلاح بنجاح! 🎉';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'عدد المنتجات في قاعدة البيانات: %', products_count;
    RAISE NOTICE 'عدد المبيعات في قاعدة البيانات: %', sales_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ جدول المنتجات: موجود ويعمل';
    RAISE NOTICE '✅ جدول المبيعات: موجود ويعمل';
    RAISE NOTICE '✅ الفهارس: تم إنشاؤها';
    RAISE NOTICE '✅ البيانات التجريبية: متوفرة';
    RAISE NOTICE '';
    RAISE NOTICE 'الخطوات التالية:';
    RAISE NOTICE '1. أعد تحميل صفحة التطبيق';
    RAISE NOTICE '2. ادخل برمز: 112233';
    RAISE NOTICE '3. اذهب إلى "المخزون والمبيعات"';
    RAISE NOTICE '';
    RAISE NOTICE 'صالة حسام جم - نظام إدارة متكامل';
    RAISE NOTICE '===============================================';
    
END
$$;

-- ====================================
-- اختبار سريع للتأكد من عمل الجداول
-- ====================================

-- اختبار قراءة المنتجات
SELECT 
    '🔍 اختبار جدول المنتجات' as test_name,
    COUNT(*) as products_count,
    'منتج' as unit
FROM products;

-- اختبار قراءة المبيعات
SELECT 
    '🔍 اختبار جدول المبيعات' as test_name,
    COUNT(*) as sales_count,
    'عملية بيع' as unit
FROM sales;

-- عرض عينة من المنتجات
SELECT 
    '📦 عينة من المنتجات:' as info,
    name as product_name,
    quantity as available_quantity,
    price || ' ر.س' as price,
    category
FROM products 
LIMIT 5;

/*
===============================================
           تم الانتهاء من الإصلاح!
===============================================

إذا رأيت رسائل "تم بنجاح" أعلاه، فقد تم حل المشكلة.

الآن:
1. أعد تحميل صفحة التطبيق (F5)
2. ادخل برمز: 112233  
3. استمتع بالنظام الكامل!

للدعم: تحقق من وجود الجداول في 
Table Editor في Supabase
===============================================
*/
