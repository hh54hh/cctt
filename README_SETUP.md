# 🏋️ نظام صالة حسام - دليل الإعداد السريع

## ⚠️ إذا ظهرت لك شاشة "إعداد قاعدة البيانات مطلوب"

### خطوات الحل السريع:

1. **افتح Supabase**

   - اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
   - سجل دخولك أو أنشئ حساباً جديداً

2. **انشئ مشروع جديد** (إذا لم يكن لديك)

   - اضغط "New Project"
   - اختر اسماً: `صالة-حسام`
   - اختر منطقة قريبة منك

3. **شغّل السكربت**

   - اذهب إلى "SQL Editor" في القائمة الجانبية
   - انس�� السكربت من الشاشة أو من ملف `DATABASE_COMPLETE_SETUP.sql`
   - الصق السكربت في المحرر
   - اضغط "Run" (زر أخضر)

4. **تأكد من البيانات**

   - في ملف `src/lib/supabase.ts`
   - تأكد أن `supabaseUrl` و `supabaseAnonKey` صحيحان
   - انسخهما من "Settings" → "API" في Supabase

5. **أعد تحميل الصفحة**
   - اضغط F5 أو Ctrl+R
   - ستختفي رسالة الخطأ ويعمل النظام

## 🔑 تسجيل الدخول

- كلمة المرور: `112233`

## ✅ علامات نجاح الإعداد

- اختفاء رسالة "إعداد قاعدة البيانات مطلوب"
- ظهور صفحة تسجيل الدخول
- وجود تمارين وأطعمة جاهزة في القوائم

## 🆘 مشاكل شائعة

### "خطأ في الاتصال"

- تأكد من بيانات Supabase في `src/lib/supabase.ts`
- تأكد من استقرار الإنترنت

### "الجداول فارغة"

- شغّل السكربت مرة أخرى في SQL Editor
- تأكد من تنفيذ الجزء الخاص بإدراج البيانات

### "لا أستطيع رؤية السكربت"

```sql
-- نسخة مختصرة من السكربت الأساسي
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

CREATE TABLE IF NOT EXISTS course_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- باقي الجداول والبيانات في الملف الكامل
```

## 📞 للمساعدة

السكربت الكامل موجود في ملف `DATABASE_COMPLETE_SETUP.sql` في جذر المشروع.

---

**بعد الإعداد، ستحصل على نظام كامل لإدارة صالتك الرياضية! 🎉**
