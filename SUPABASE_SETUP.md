# صالة حسام - إعدادات قاعدة البيانات

## خطوات إعداد Supabase

### 1. إنشاء المشروع

- قم بتسجيل الدخول إلى [Supabase](https://supabase.com)
- أنشئ مشروع جديد
- احفظ الرابط و API Key

### 2. إنشاء الجداول

انسخ والصق الكود التالي في SQL Editor في Supabase:

```sql
-- Gym Management System Database Schema

-- 1. Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Groups table (for organizing courses and diet plans)
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Group items table (individual exercises or food items)
CREATE TABLE IF NOT EXISTS group_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- 4. Course points table (exercise library)
CREATE TABLE IF NOT EXISTS course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Diet items table (food library)
CREATE TABLE IF NOT EXISTS diet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_subscriber_id ON groups(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_items_order ON group_items(order_index);
CREATE INDEX IF NOT EXISTS idx_subscribers_name ON subscribers(name);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_course_points_name ON course_points(name);
CREATE INDEX IF NOT EXISTS idx_diet_items_name ON diet_items(name);

-- Insert sample course points
INSERT INTO course_points (name, description) VALUES
('بنش برس', 'تمرين لعضلات الصدر'),
('سكوات', 'تمرين لعضلات الأرجل'),
('ديد ليفت', 'تمرين لعضلات الظهر'),
('شد علوي', 'تمرين لعضلات الظهر والباي'),
('ضغط كتف', 'تمرين لعضلات الكتف'),
('ضغط فرنسي', 'تمرين لعضلات التراي'),
('كارديو', 'تمارين القلب والأوعية الدموية'),
('بطن', 'تمارين عضلات البطن'),
('باي سبس', 'تمرين لعضلات البايسبس'),
('تراي سبس', 'تمرين لعضلات التراي سبس')
ON CONFLICT (name) DO NOTHING;

-- Insert sample diet items
INSERT INTO diet_items (name, description) VALUES
('بيض مسلوق', 'مصدر بروتين عالي'),
('شوفان', 'كربوهيدرات معقدة'),
('دجاج مشوي', 'بروتين خالي من الدهون'),
('أرز بني', 'كربوهيدرات صحية'),
('خضروات', 'فيتامينات ومعادن'),
('تمر', 'سكريات طبيعية سريعة'),
('لوز', 'دهون صحية'),
('سمك', 'أوميغا 3 وبروتين'),
('حليب خالي الدسم', 'كالسيوم وبروتين'),
('فواكه', 'فيتامينات وألياف')
ON CONFLICT (name) DO NOTHING;

-- Disable RLS for now (adjust based on your security needs)
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items DISABLE ROW LEVEL SECURITY;
```

### 3. إعدادات الأمان

- انتقل إلى Authentication > Settings
- قم بتعطيل "Enable email confirmations" إذا كنت لا تريد تأكيد البريد الإلكتروني
- أو قم بإعداد SMTP إذا كنت تريد إرسال رسائل التأكيد

### 4. اختبار الاتصال

بعد تشغيل التطبيق، ستتم محاولة الاتصال تلقائياً بقاعدة البيانات وإنشاء البيانات الأولية إذا لم تكن موجودة.

## معلومات إضافية

### كلمة المرور

- كلمة المرور الافتراضية للدخول: `112233`
- يمكن تغييرها من ملف `src/pages/Login.tsx`

### البيانات الأولية

سيتم إدراج تمارين وعناصر غذائية أولية تلقائياً عند أول تشغيل للتطبيق.

### إدارة البيانات

- جميع العمليات تتم عبر واجهة التطبيق
- يمكن طباعة بيانات المشتركين مع خططهم
- يمكن البحث والتصفية في جميع الصفحات
