# 🚀 دليل إعداد Supabase لنظام حسام جم

## ✅ التحقق من الإعداد الصحيح

### 1. فحص الاتصال

بعد تشغيل التطبيق، تحقق من وحدة التحكم (Console) للرسائل التالية:

```
🔍 فحص سريع لـ Supabase...
✅ Supabase جاهز للاستخدام
📋 الجداول المتاحة: subscribers, course_points, diet_items, groups, group_items, products, sales, sale_items, access_keys
🚀 تهيئة نظام حسام جم...
✅ تم تهيئة النظام بنجاح
```

### 2. في حالة ظهور رسائل خطأ

إذا ظهرت رسائل مثل:

```
�� مشاكل في Supabase:
  - الجدول subscribers غير موجود
  - خطأ في الاتصال: relation "subscribers" does not exist
```

## 🔧 خطوات الإصلاح

### الخطوة 1: تنفيذ سكربت قاعدة البيانات

1. انتقل إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. انتقل إلى **SQL Editor**
4. انسخ محتوى ملف `database/schema.sql` أو `database/additional_functions.sql`
5. الصق الكود في SQL Editor
6. اضغط **Run** لتنفيذ السكربت

### الخطوة 2: التحقق من الجداول

1. انتقل إلى **Database** → **Tables**
2. تأكد من وجود الجداول التالية:
   - ✅ subscribers
   - ✅ course_points
   - ✅ diet_items
   - ✅ groups
   - ✅ group_items
   - ✅ products
   - ✅ sales
   - ✅ sale_items
   - ✅ access_keys

### الخطوة 3: تحديث مفاتيح Supabase

في ملف `src/lib/supabase.ts`:

```typescript
const supabaseUrl = "https://[YOUR-PROJECT-ID].supabase.co";
const supabaseKey = "[YOUR-ANON-KEY]";
```

احصل على هذه المعلومات من:
**Settings** → **API** في Supabase Dashboard

## 🔐 إعداد الأمان (RLS)

### التحقق من Row Level Security

1. انتقل إلى **Authentication** → **Policies**
2. تأكد من وجود سياسة "Allow all access" لكل جدول
3. إذا لم تكن موجودة، أضفها يدوياً:

```sql
-- لكل جدول
CREATE POLICY "Allow all access" ON [table_name] FOR ALL USING (true);
```

## 📊 التحقق من البيانات التجريبية

### تأكد من وجود البيانات الأساسية:

```sql
-- التحقق من أكواد الدخول
SELECT * FROM access_keys;

-- التحقق من التمارين
SELECT * FROM course_points;

-- التحقق من العناصر الغذائية
SELECT * FROM diet_items;

-- التحقق من المنتجات
SELECT * FROM products;
```

## 🔄 اختبار المزامنة

### 1. فحص حالة المزامنة في التطبيق

- انظر إلى مكون "حالة المزامنة" في لوحة التحكم
- يجب أن يظهر "متزامن" باللون الأخضر

### 2. اختبار العمل بدون إنترنت

1. افصل الإنترنت
2. أضف مشترك جديد
3. تحقق من ظهور "X تغيير في الانتظار"
4. أعد الاتصال بالإنترنت
5. يجب أن تتم المزامنة تلقائياً

### 3. اختبار المزامنة اليدوية

- اضغط على زر السحابة في مك��ن المزامنة
- تأكد من عدم ظهور أخطاء في Console

## 🚨 حل المشاكل الشائعة

### مشكلة 1: "CORS policy blocked"

**الحل:**

1. انتقل إلى **Settings** → **API**
2. تأكد من إضافة نطاقك في **Allowed origins**
3. أو أضف `*` للسماح بجميع النطاقات (للتطوير فقط)

### مشكلة 2: "Invalid API key"

**الحل:**

1. تحقق من صحة `SUPABASE_URL` و `SUPABASE_ANON_KEY`
2. تأكد من عدم وجود مسافات إضافية
3. تأكد من أن المفتاح لم ينته

### مشكلة 3: "Table doesn't exist"

**الحل:**

1. تنفيذ سكربت `database/schema.sql` مرة أخرى
2. التحقق من صحة اسم قاعدة البيانات
3. تأكد من أن المشروع نشط في Supabase

### مشكلة 4: "Permission denied"

**الحل:**

1. تفعيل RLS policies
2. إضافة سياسة "Allow all" لكل جدول
3. التحقق من صلاحيات المستخدم

## 🔍 أدوات التشخيص

### في وحدة التحكم (Console)

```javascript
// فحص سريع للاتصال
quickSupabaseCheck();

// عرض التغييرات المعلقة
console.log("تغييرات معلقة:", db.getPendingChangesCount());

// فحص البيانات المحلية
console.log("مشتركين محليين:", db.getSubscribers().length);

// مزامنة يدوية
db.syncAllToSupabase();
```

### في Supabase Dashboard

1. **Logs** - لرؤية الأخطاء المفصلة
2. **Database** → **Logs** - لفحص استعلامات SQL
3. **API** → **Logs** - لمراقبة طلبات API

## ✅ قائمة التحقق النهائية

- [ ] Supabase project منشأ ونشط
- [ ] جميع الجداول (9 جداول) موجودة
- [ ] مفاتيح API صحيحة ومحدثة
- [ ] RLS policies مفعلة مع "Allow all"
- [ ] بيانات تجريبية موجودة (أكواد دخول، تمارين، منتجات)
- [ ] مكون المزامنة يظهر "متزامن"
- [ ] اختبار إضافة/تعديل/حذف يعمل
- [ ] مزامنة offline/online تعمل

## 📞 الحصول على المساعدة

إذا واجهت مشاكل مستمرة:

1. **فحص Logs في Supabase Dashboard**
2. **مراجعة Network tab في Developer Tools**
3. **تشغيل `quickSupabaseCheck()` في Console**
4. **التأكد من أن المشروع لم يتم إيقافه في Supabase**

---

**النظام الآن جاهز للعمل مع Supabase بالكامل! 🎉**

جميع العمليات ستُحفظ تلقائياً في السحابة مع إمكانية العمل بدون إنترنت.
