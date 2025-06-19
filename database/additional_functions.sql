-- سكربت إضافي لنظام حسام جم
-- Additional Functions and Procedures for Hussam Gym Management System

-- =====================================
-- 1. دوال الإحصائيات والتقارير
-- =====================================

-- دالة لحساب إجمالي مبيعات فترة معينة
CREATE OR REPLACE FUNCTION get_sales_total(
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(total_price)
        FROM sales
        WHERE DATE(date) BETWEEN start_date AND end_date
    ), 0);
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب عدد المشتركين الجدد في فترة
CREATE OR REPLACE FUNCTION get_new_subscribers_count(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM subscribers
        WHERE DATE(created_at) BETWEEN start_date AND end_date
    );
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب أفضل المنتجات مبيعاً
CREATE OR REPLACE FUNCTION get_top_selling_products(
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    total_quantity INTEGER,
    total_revenue DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        SUM(si.quantity)::INTEGER,
        SUM(si.quantity * si.unit_price)
    FROM products p
    JOIN sale_items si ON p.id = si.product_id
    GROUP BY p.id, p.name
    ORDER BY SUM(si.quantity) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 2. دوال إدارة المخزون
-- =====================================

-- دالة للتحقق من توفر المنتج قبل البيع
CREATE OR REPLACE FUNCTION check_product_availability(
    product_id UUID,
    required_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    available_quantity INTEGER;
BEGIN
    SELECT quantity INTO available_quantity
    FROM products
    WHERE id = product_id;
    
    RETURN COALESCE(available_quantity, 0) >= required_quantity;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث المخزون بعد البيع
CREATE OR REPLACE FUNCTION update_product_stock(
    product_id UUID,
    sold_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_quantity INTEGER;
BEGIN
    -- الحصول على الكمية الحالية
    SELECT quantity INTO current_quantity
    FROM products
    WHERE id = product_id;
    
    -- التحقق من توفر الكمية
    IF current_quantity >= sold_quantity THEN
        UPDATE products 
        SET quantity = quantity - sold_quantity,
            updated_at = NOW()
        WHERE id = product_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على المنتجات قليلة المخزون
CREATE OR REPLACE FUNCTION get_low_stock_products(
    threshold INTEGER DEFAULT 5
) RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    current_quantity INTEGER,
    price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.quantity,
        p.price
    FROM products p
    WHERE p.quantity <= threshold AND p.quantity > 0
    ORDER BY p.quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 3. دوال إدارة المشتركين
-- =====================================

-- دالة للحصول على تفاصيل المشترك مع مجموعاته
CREATE OR REPLACE FUNCTION get_subscriber_details(subscriber_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'subscriber', row_to_json(s),
        'groups', (
            SELECT json_agg(
                json_build_object(
                    'group', row_to_json(g),
                    'items', (
                        SELECT json_agg(
                            CASE 
                                WHEN g.type = 'course' THEN 
                                    (SELECT row_to_json(cp) FROM course_points cp WHERE cp.id = gi.item_id)
                                ELSE 
                                    (SELECT row_to_json(di) FROM diet_items di WHERE di.id = gi.item_id)
                            END
                        )
                        FROM group_items gi
                        WHERE gi.group_id = g.id
                    )
                )
            )
            FROM groups g
            WHERE g.subscriber_id = s.id
        ),
        'total_purchases', (
            SELECT COALESCE(SUM(total_price), 0)
            FROM sales sa
            WHERE sa.subscriber_id = s.id
        )
    ) INTO result
    FROM subscribers s
    WHERE s.id = subscriber_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 4. Triggers متقدمة
-- =====================================

-- Trigger لتسجيل تغييرات المخزون
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    old_quantity INTEGER,
    new_quantity INTEGER,
    change_type TEXT, -- 'sale', 'restock', 'adjustment'
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
        INSERT INTO stock_history (product_id, old_quantity, new_quantity, change_type, change_reason)
        VALUES (
            NEW.id, 
            OLD.quantity, 
            NEW.quantity,
            CASE 
                WHEN NEW.quantity < OLD.quantity THEN 'sale'
                WHEN NEW.quantity > OLD.quantity THEN 'restock'
                ELSE 'adjustment'
            END,
            'Stock updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_change_log
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_stock_change();

-- =====================================
-- 5. Views إضافية للتقارير
-- =====================================

-- عرض للمبيعات الشهرية
CREATE OR REPLACE VIEW monthly_sales AS
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(*) as total_transactions,
    SUM(total_price) as total_revenue,
    COUNT(DISTINCT subscriber_id) as unique_customers,
    AVG(total_price) as average_transaction
FROM sales
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- عرض لأداء المنتجات
CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.quantity as current_stock,
    COALESCE(SUM(si.quantity), 0) as total_sold,
    COALESCE(SUM(si.quantity * si.unit_price), 0) as total_revenue,
    COALESCE(COUNT(DISTINCT s.subscriber_id), 0) as unique_buyers,
    p.price * p.quantity as stock_value
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id
GROUP BY p.id, p.name, p.price, p.quantity;

-- عرض لنشاط المشتركين
CREATE OR REPLACE VIEW subscriber_activity AS
SELECT 
    s.id,
    s.name,
    s.phone,
    s.created_at as join_date,
    COUNT(DISTINCT sa.id) as total_purchases,
    COALESCE(SUM(sa.total_price), 0) as total_spent,
    COUNT(DISTINCT g.id) as total_groups,
    COALESCE(MAX(sa.date), s.created_at) as last_activity
FROM subscribers s
LEFT JOIN sales sa ON s.id = sa.subscriber_id
LEFT JOIN groups g ON s.id = g.subscriber_id
GROUP BY s.id, s.name, s.phone, s.created_at;

-- =====================================
-- 6. إجراءات الصيانة والتنظيف
-- =====================================

-- إجراء لتنظيف البيانات القديمة (اختياري)
CREATE OR REPLACE FUNCTION cleanup_old_data(
    days_to_keep INTEGER DEFAULT 365
) RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER;
    result_message TEXT;
BEGIN
    -- حذف سجل تغييرات المخزون الأقدم من المدة المحددة
    DELETE FROM stock_history 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    result_message := 'تم حذف ' || deleted_count || ' سجل من تاريخ تغييرات المخزون';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 7. فهارس إضافية للأداء
-- =====================================

-- فهارس لتحسين أداء الاستعلامات
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_subscriber_date ON sales(subscriber_id, date);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_type ON groups(subscriber_id, type);
CREATE INDEX IF NOT EXISTS idx_stock_history_product_date ON stock_history(product_id, created_at);

-- فهرس للبحث النصي في المنتجات
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('arabic', name || ' ' || COALESCE(description, '')));

-- =====================================
-- 8. دوال التحقق من صحة البيانات
-- =====================================

-- دالة للتحقق من صحة رقم الهاتف
CREATE OR REPLACE FUNCTION validate_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- التحقق من أن الرقم يبدأ بـ 05 ويتكون من 10 أرقام
    RETURN phone_number ~ '^05[0-9]{8}$';
END;
$$ LANGUAGE plpgsql;

-- إضافة قيد للتحقق من صحة رقم الهاتف
ALTER TABLE subscribers 
ADD CONSTRAINT chk_phone_format 
CHECK (validate_phone(phone));

-- =====================================
-- 9. بيانات تجريبية إض��فية
-- =====================================

-- إضافة مشتركين تجريبيين إضافيين
INSERT INTO subscribers (name, phone, age, weight, height, notes) VALUES
('خالد أحمد', '0512345679', 32, 85.0, 178, 'لاعب سابق، خبرة عالية'),
('فاطمة محمد', '0567891234', 27, 55.0, 160, 'تدريب شخصي، هدف إنقاص الوزن'),
('عبدالله سالم', '0598765432', 24, 70.0, 172, 'مبتدئ، يحتاج برنامج تدريبي'),
('نورا علي', '0534567890', 29, 62.0, 165, 'تمارين يوجا وكارديو'),
('ماجد خالد', '0556789012', 35, 90.0, 185, 'تدريب قوة، رياضي محترف');

-- إضافة تمارين متقدمة
INSERT INTO course_points (name, description) VALUES
('تمرين الكابل كروس', '3 مجموعات × 12 تكرار للصدر'),
('تمرين الهامر كيرل', '4 مجموعات × 10 تكرار للبايسبس'),
('تمرين الليج برس', '4 مجموعات × 15 تكرار للأرجل'),
('تمرين اللات بول داون', '3 مجموعات × 12 تكرار للظهر'),
('تمرين الشولدر برس', '3 مجموعات × 10 تكرار للكتف'),
('تمرين الديب باختلاف القبضة', '3 مجموعات × 12 تكرار للترايسبس'),
('تمرين الكارديو HIIT', '20 دقيقة تدريب عالي الكثافة'),
('تمرين الفلاي للصدر', '3 مجموعات × 15 تكرار'),
('تمرين الرومانيان ديدليفت', '4 مجموعات × 8 تكرار'),
('تمرين البنش إنكلاين', '4 مجموعات × 10 تكرار');

-- إضافة عناصر غذائية متنوعة
INSERT INTO diet_items (name, description) VALUES
('زيت زيتون', '1 ملعقة كبيرة مع السلطة'),
('أفوكادو', '1/2 حبة متوسطة'),
('كينوا', '100 جرام مطبوخ'),
('زبدة الفول السوداني', '2 ملعقة كبيرة'),
('سمك التونة الطازج', '150 جرام مشوي'),
('خضروات ورقية', '200 جرام (سبانخ، جرجير)'),
('توت أزرق', '100 جرام كوجبة خفيفة'),
('جبن قريش قليل الدسم', '150 جرام'),
('بذور الشيا', '1 ملعقة كبيرة مع الزبادي'),
('حليب اللوز', '250 مل بدون سكر');

-- إضافة منتجات متنوعة
INSERT INTO products (name, description, price, quantity) VALUES
('بار بروتين - شوكولاتة', 'بار غني بالبروتين 20 جرام', 8.50, 50),
('مشروب طاقة طبيعي', '250 مل، خالي من السكر', 12.00, 40),
('حزام رفع ال��ثقال', 'حزام جلدي عالي الجودة', 150.00, 5),
('قفازات تدريب', 'قفازات واقية لليدين', 45.00, 15),
('شاكر بروتين', 'شاكر 600 مل مع مصفاة', 25.00, 20),
('منشفة رياضية', 'منشفة مايكروفايبر سريعة الجفاف', 35.00, 25),
('مكمل زيت السمك', '90 كبسولة أوميجا 3', 75.00, 12),
('فيتامين D3', '60 كبسولة 1000 وحدة', 55.00, 18),
('مغنيسيوم + زنك', '90 قرص للاستشفاء', 40.00, 22),
('بروتين نباتي بالفانيليا', '2 كيلو، خالي من اللاكتوز', 220.00, 8);

-- =====================================
-- 10. تقرير شامل للنظام
-- =====================================

-- دالة لإنشاء تقرير شامل للنظام
CREATE OR REPLACE FUNCTION generate_system_report()
RETURNS JSON AS $$
DECLARE
    report JSON;
BEGIN
    SELECT json_build_object(
        'generated_at', NOW(),
        'subscribers', json_build_object(
            'total', (SELECT COUNT(*) FROM subscribers),
            'new_this_month', (SELECT get_new_subscribers_count()),
            'active_buyers', (SELECT COUNT(DISTINCT subscriber_id) FROM sales WHERE date >= CURRENT_DATE - INTERVAL '30 days')
        ),
        'products', json_build_object(
            'total', (SELECT COUNT(*) FROM products),
            'low_stock', (SELECT COUNT(*) FROM products WHERE quantity <= 5 AND quantity > 0),
            'out_of_stock', (SELECT COUNT(*) FROM products WHERE quantity = 0),
            'total_value', (SELECT SUM(price * quantity) FROM products)
        ),
        'sales', json_build_object(
            'today', (SELECT get_sales_total()),
            'this_month', (SELECT get_sales_total(DATE_TRUNC('month', CURRENT_DATE)::DATE, CURRENT_DATE)),
            'total_transactions', (SELECT COUNT(*) FROM sales),
            'average_transaction', (SELECT AVG(total_price) FROM sales)
        ),
        'top_products', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM get_top_selling_products(5)) t)
    ) INTO report;
    
    RETURN report;
END;
$$ LANGUAGE plpgsql;

-- نهاية السكربت الإضافي
COMMENT ON FUNCTION generate_system_report() IS 'دالة لإنشاء تقرير شامل عن حالة النظام';
COMMENT ON FUNCTION get_sales_total(DATE, DATE) IS 'دالة لحساب إجمالي المبيعات في فترة محددة';
COMMENT ON FUNCTION get_low_stock_products(INTEGER) IS 'دالة للحصول على المنتجات قليلة المخزون';
COMMENT ON TABLE stock_history IS 'جدول لتتبع تاريخ تغييرات المخزون';
