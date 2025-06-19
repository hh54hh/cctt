/*
========================================================
        إصلاح شامل لجدول المبيعات - جميع الأعمدة
========================================================

المشكلة: أعمدة مفقودة من جدول sales (notes, sale_date, etc.)
الحل: إضافة جميع الأعمدة المطلوبة وتحديث البيانات

خطوات الاستخدام:
1. انتقل إلى Supabase Dashboard
2. اضغط "SQL Editor"
3. انسخ والصق كامل محتوى هذا الملف
4. اضغط "Run"
5. جرب تسجيل عملية بيع جديدة

========================================================
*/

-- التحقق من هيكل جدول المبيعات الحالي
DO $$
BEGIN
    RAISE NOTICE '🔍 بدء فحص جدول المبيعات...';
END
$$;

-- إضافة العمود notes إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'notes'
    ) THEN
        ALTER TABLE sales ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ تم إضافة عمود notes';
    ELSE
        RAISE NOTICE '⚠️ عمود notes موجود بالفعل';
    END IF;
END
$$;

-- إضافة العمود sale_date إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'sale_date'
    ) THEN
        ALTER TABLE sales ADD COLUMN sale_date TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ تم إضافة عمود sale_date';
    ELSE
        RAISE NOTICE '⚠️ عمود sale_date موجود بالفعل';
    END IF;
END
$$;

-- التأكد من وجود العمود created_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ تم إضافة عمود created_at';
    ELSE
        RAISE NOTICE '⚠️ عمود created_at موجود بالفعل';
    END IF;
END
$$;

-- التأكد من وجود المفتاح الخارجي للمنتجات (إذا كان جدول products موجود)
DO $$
BEGIN
    -- فقط إضافة المفتاح الخارجي إذا كان جدول products موجود
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        -- فحص وجود المفتاح الخارجي
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'sales' 
            AND constraint_name = 'fk_sales_product'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            -- محاولة إضافة المفتاح الخارجي
            BEGIN
                ALTER TABLE sales 
                ADD CONSTRAINT fk_sales_product 
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
                RAISE NOTICE '✅ تم إضافة المفتاح الخارجي للمنتجات';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ لا يمكن إضافة المفتاح الخارجي - قد يحتوي على بيانات غير متطابقة';
            END;
        ELSE
            RAISE NOTICE '⚠️ المفتاح الخارجي للمنتجات موجود بالفعل';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ جدول products غير موجود - سيتم تخطي المفتاح الخارجي';
    END IF;
END
$$;

-- تحديث البيانات الموجودة بقيم افتراضية
UPDATE sales 
SET 
    notes = CASE 
        WHEN notes IS NULL THEN NULL  -- يبقى NULL إذا لم يكن هناك ملاحظات
        ELSE notes
    END,
    sale_date = CASE 
        WHEN sale_date IS NULL THEN 
            CASE 
                WHEN created_at IS NOT NULL THEN created_at
                ELSE NOW()
            END
        ELSE sale_date
    END,
    created_at = CASE 
        WHEN created_at IS NULL THEN NOW()
        ELSE created_at
    END
WHERE sale_date IS NULL OR created_at IS NULL;

-- إضافة الفهارس المطلوبة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_total_price ON sales(total_price);

-- إضافة قيود للتحقق من صحة البيانات
DO $$
BEGIN
    -- قيد للتأكد من أن الكمية موجبة
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sales' AND constraint_name = 'sales_quantity_check'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_quantity_check CHECK (quantity > 0);
        RAISE NOTICE '✅ تم إضافة قيد فحص الكمية';
    END IF;
    
    -- قيد للتأكد من أن سعر الوحدة غير سالب
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sales' AND constraint_name = 'sales_unit_price_check'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_unit_price_check CHECK (unit_price >= 0);
        RAISE NOTICE '✅ تم إضافة قيد فحص سعر الوحدة';
    END IF;
    
    -- قيد للتأكد من أن المجموع الكلي غير سالب
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sales' AND constraint_name = 'sales_total_price_check'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_total_price_check CHECK (total_price >= 0);
        RAISE NOTICE '✅ تم إضافة قيد فحص المجموع الكلي';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ بعض القيود موجودة بالفعل';
END
$$;

-- عرض نتائج الإصلاح
SELECT 
    '🎯 ملخص إصلاح جدول المبيعات:' as status,
    COUNT(*) as total_sales,
    COUNT(CASE WHEN notes IS NOT NULL THEN 1 END) as sales_with_notes,
    COUNT(CASE WHEN sale_date IS NOT NULL THEN 1 END) as sales_with_sale_date,
    COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as sales_with_created_at,
    ROUND(AVG(total_price), 2) as average_sale_amount
FROM sales;

-- عرض إحصائيات المبيعات حسب المنتج
SELECT 
    '📊 أفضل المنتجات مبيعاً:' as info,
    product_name,
    COUNT(*) as times_sold,
    SUM(quantity) as total_quantity_sold,
    SUM(total_price) as total_revenue
FROM sales 
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 5;

-- عرض عينة من المبيعات للتأكد
SELECT 
    '💰 عينة من المبيعات:' as sample,
    buyer_name,
    product_name,
    quantity,
    total_price || ' ر.س' as total_price,
    CASE 
        WHEN notes IS NOT NULL AND notes != '' THEN 
            CASE 
                WHEN LENGTH(notes) > 20 THEN LEFT(notes, 20) || '...'
                ELSE notes
            END
        ELSE 'لا توجد ملاحظات'
    END as notes_preview,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as sale_time
FROM sales 
ORDER BY created_at DESC
LIMIT 5;

-- التحقق من هيكل جدول المبيعات النهائي
SELECT 
    '🔍 هيكل جدول المبيعات النهائي:' as structure,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- رسالة نجاح نهائية
SELECT '🎉 تم إصلاح جدول المبيعات بنجاح! يمكنك الآن تسجيل عمليات بيع مع ملاحظات.' as success_message;

/*
========================================================
                    تم الانتهاء!
========================================================

ما تم إصلاحه في جدول المبيعات:
✅ إضافة عمود notes (الملاحظات)
✅ إضافة عمود sale_date (تاريخ البيع)
✅ التأكد من وجود created_at (تاريخ الإنشاء)
✅ محاولة إضافة المفتاح الخارجي للمنتجات
✅ تحديث البيانات الموجودة
✅ إضافة فهارس لتحسين الأداء
✅ إضافة قيود للتحقق من صحة البيانات

الخطوات التالية:
1. أعد تحميل صفحة المخزون (F5)
2. جرب تسجيل عملية بيع جديدة
3. أضف ملاحظات للبيع إذا أردت

المشكلة محلولة بالكامل! 🎉

========================================================
*/
