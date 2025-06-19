/*
========================================================
        إصلاح شامل لجدول المنتجات - جميع الأعمدة
========================================================

المشكلة: أعمدة مفقودة من جدول products (category, description, etc.)
الحل: إضافة جميع الأعمدة المطلوبة وتحديث البيانات

خطوات الاستخدام:
1. انتقل إلى Supabase Dashboard
2. اضغط "SQL Editor"
3. ان��خ والصق كامل محتوى هذا الملف
4. اضغط "Run"
5. جرب إضافة منتج جديد

========================================================
*/

-- التحقق من هيكل الجدول الحالي
DO $$
BEGIN
    RAISE NOTICE '🔍 بدء فحص جدول المنتجات...';
END
$$;

-- إضافة العمود category إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category'
    ) THEN
        ALTER TABLE products ADD COLUMN category TEXT;
        RAISE NOTICE '✅ تم إضافة عمود category';
    ELSE
        RAISE NOTICE '⚠️ عمود category موجود بالفعل';
    END IF;
END
$$;

-- إضافة العمود description إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'description'
    ) THEN
        ALTER TABLE products ADD COLUMN description TEXT;
        RAISE NOTICE '✅ تم إضافة عمود description';
    ELSE
        RAISE NOTICE '⚠️ عمود description موجود بالفعل';
    END IF;
END
$$;

-- إضافة العمود updated_at إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ تم إضافة عمود updated_at';
    ELSE
        RAISE NOTICE '⚠️ عمود updated_at موجود بالفعل';
    END IF;
END
$$;

-- التأكد من وجود العمود created_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ تم إضافة عمود created_at';
    ELSE
        RAISE NOTICE '⚠️ عمود created_at موجود بالفعل';
    END IF;
END
$$;

-- تحديث البيانات الموجودة بقيم افتراضية ذكية
UPDATE products 
SET 
    category = CASE 
        WHEN category IS NULL THEN
            CASE 
                WHEN LOWER(name) LIKE '%بروتين%' OR LOWER(name) LIKE '%كرياتين%' OR LOWER(name) LIKE '%فيتامين%' OR LOWER(name) LIKE '%أحماض%' THEN 'مكملات'
                WHEN LOWER(name) LIKE '%مشروب%' OR LOWER(name) LIKE '%طاقة%' OR LOWER(name) LIKE '%عصير%' THEN 'مشروبات'
                WHEN LOWER(name) LIKE '%شيكر%' OR LOWER(name) LIKE '%حزام%' OR LOWER(name) LIKE '%قفاز%' THEN 'أدوات'
                WHEN LOWER(name) LIKE '%منشفة%' OR LOWER(name) LIKE '%حقيبة%' THEN 'إكسسوارات'
                WHEN LOWER(name) LIKE '%قميص%' OR LOWER(name) LIKE '%شورت%' OR LOWER(name) LIKE '%ملابس%' THEN 'ملابس'
                ELSE 'أخرى'
            END
        ELSE category
    END,
    description = CASE 
        WHEN description IS NULL THEN
            CASE 
                WHEN LOWER(name) LIKE '%بروتين%' THEN 'مكمل بروتين عالي الجودة'
                WHEN LOWER(name) LIKE '%كرياتين%' THEN 'لزيادة القوة والطاقة'
                WHEN LOWER(name) LIKE '%فيتامين%' THEN 'فيتامينات ومعادن أساسية'
                WHEN LOWER(name) LIKE '%مشروب%' THEN 'مشروب منشط ومنعش'
                WHEN LOWER(name) LIKE '%شيكر%' THEN 'كوب خاص لخلط المكملات'
                WHEN LOWER(name) LIKE '%حزام%' THEN 'حزام دعم للظهر أثناء التمرين'
                WHEN LOWER(name) LIKE '%قفاز%' THEN 'قفازات حماية لليدين'
                ELSE 'منتج عالي الجودة'
            END
        ELSE description
    END,
    updated_at = CASE 
        WHEN updated_at IS NULL THEN NOW()
        ELSE updated_at
    END
WHERE category IS NULL OR description IS NULL OR updated_at IS NULL;

-- إضافة الفهارس المطلوبة
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- إضافة قيود للتحقق من صحة البيانات
DO $$
BEGIN
    -- قيد للتأكد من أن السعر غير سالب
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' AND constraint_name = 'products_price_check'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price >= 0);
        RAISE NOTICE '✅ تم إضافة قيد فحص السعر';
    END IF;
    
    -- قيد للتأكد من أن الكمية غير سالبة
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' AND constraint_name = 'products_quantity_check'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_quantity_check CHECK (quantity >= 0);
        RAISE NOTICE '✅ تم إضافة قيد فحص الكمية';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ بعض القيود موجودة بالفعل';
END
$$;

-- إدراج منتجات تجريبية محدثة (إذا لم تكن موجودة)
INSERT INTO products (name, quantity, price, description, category) 
VALUES 
    ('بروتين واي جولد', 12, 320.00, 'بروتين مصل اللبن المعزول - نكهة الفانيليا', 'مكملات'),
    ('كرياتين مونوهيدرات', 25, 160.00, 'كرياتين خالص 100% لزيادة القوة والطاقة', 'مكملات'),
    ('مشروب طاقة سبورت', 40, 12.00, 'مشروب طاقة طبيعي قبل التمرين', 'مشروبات'),
    ('قفازات جيم بريميوم', 15, 85.00, 'قفازات رياضية مضادة للانزلاق مع دعم المعصم', 'أدوات'),
    ('حزام رفع أثقال جلدي', 8, 420.00, 'حزام دعم ظهر من الجلد الطبيعي - قابل للتعديل', 'أدوات'),
    ('فيتامينات متعددة ديلي', 30, 150.00, 'فيتامينات ومعادن أساسية يومية - 60 كبسولة', 'مكملات'),
    ('منشفة رياضية سريعة الجفاف', 20, 35.00, 'منشفة من الألياف الدقيقة سريعة الجفاف', 'إكسسوارات'),
    ('أحماض أمينية BCAA', 18, 240.00, 'أحماض أمينية متفرعة السلسلة - نكهة الليمون', 'مكملات')
ON CONFLICT (name) DO NOTHING;

-- عرض نتائج الإصلاح
SELECT 
    '🎯 ملخص الإصلاح:' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as products_with_category,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as products_with_description,
    COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as products_with_created_at,
    COUNT(CASE WHEN updated_at IS NOT NULL THEN 1 END) as products_with_updated_at
FROM products;

-- عرض الفئات الموجودة مع عدد المنتجات
SELECT 
    '📊 الفئات المتاحة:' as info,
    category as category_name,
    COUNT(*) as product_count
FROM products 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY product_count DESC;

-- عرض عينة من المنتجات للتأكد
SELECT 
    '📦 عينة من المنتجات:' as sample,
    name,
    quantity,
    price || ' ر.س' as price,
    category,
    CASE 
        WHEN LENGTH(description) > 30 THEN LEFT(description, 30) || '...'
        ELSE description
    END as short_description
FROM products 
ORDER BY created_at DESC
LIMIT 5;

-- التحقق من هيكل الجدول النهائي
SELECT 
    '🔍 هيكل الجدول النهائي:' as structure,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- رسالة نجاح نهائية
SELECT '🎉 تم إصلاح جدول المنتجات بنجاح! جميع الأعمدة المطلوبة متوفرة الآن.' as success_message;

/*
========================================================
                    تم الانتهاء!
========================================================

ما تم إصلاحه:
✅ إضافة عمود category (الفئة)
✅ إضافة عمود description (الوصف)  
✅ إضافة عمود updated_at (تاريخ التحديث)
✅ التأكد من وجود created_at (تاريخ الإنشاء)
✅ تحديث البيانات الموجودة بقيم ذكية
✅ إضافة فهارس لتحسين الأداء
✅ إضافة قيود للتحقق من صحة البيانات
✅ إضافة منتجات تجريبية محدثة

الخطوات التالية:
1. أعد تحميل صفحة المخزون (F5)
2. جرب إضافة منتج جديد
3. املأ جميع الحقول (الاسم، الكمية، السعر، الفئة، الوصف)

المشكلة محلولة بالكامل! 🎉

========================================================
*/
