# 🔧 حل مشاكل حفظ البيانات في Supabase

## 🚨 الخطأ الحالي: "[object Object]"

هذا الخطأ يحدث عندما لا يتم عرض تفاصيل الخطأ بشكل صحيح. تم إصلاح هذا وستظهر الآن رسائل خطأ واضحة.

## 🔍 التشخيص السريع

### في Console المتصفح:

```javascript
// تشخيص سريع
quickSupabaseFix();

// تشخيص متقدم
quickSupabaseDiagnosis();
```

## 🛠️ الحلول الشائعة

### 1. ❌ **"relation does not exist"**

**السبب**: الجداول غير موجودة ف�� Supabase

**الحل**:

1. انتقل إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك → SQL Editor
3. انسخ والصق محتوى `database/schema.sql`
4. اضغط Run

### 2. ❌ **"JWT malformed" أو "Invalid API key"**

**السبب**: مفتاح API خاطئ

**الحل**:

1. في Supabase Dashboard → Settings → API
2. انسخ `Project URL` و `anon public key`
3. حدث في `src/lib/supabase.ts`:

```typescript
const supabaseUrl = "https://[PROJECT-ID].supabase.co";
const supabaseKey = "[ANON-KEY]";
```

### 3. ❌ **"Row Level Security policy"**

**السبب**: سياسات الأمان تمنع الوصول

**الحل** - في Supabase SQL Editor:

```sql
-- إنشاء سياسات مفتوحة (للتطوير)
CREATE POLICY "Allow all access" ON subscribers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON course_points FOR ALL USING (true);
CREATE POLICY "Allow all access" ON diet_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all access" ON group_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON products FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON access_keys FOR ALL USING (true);
```

### 4. ❌ **"Foreign key constraint"**

**السبب**: مشكلة في ترتيب إنشاء البيانات

**الحل**: تم إصلاح هذا تلقائياً بجعل إنشاء البيانات متسلسل

### 5. ❌ **"CORS policy blocked"**

**السبب**: نطاقك غير مسموح في Supabase

**الحل**:

1. في Supabase Dashboard → Settings → API
2. أضف نطاقك في `Site URL`
3. أو أضف `*` للسماح بجميع النطاقات (للتطوير فقط)

## 🔧 أدوات التشخيص الجديدة

### 1. **زر التشخيص الثابت**

- موجود أسفل يسار كل صفحة
- يعرض حالة مفصلة للنظام
- يقترح حلول للمشاكل

### 2. **التشخيص المتقدم**

- يختبر كل جدول على حدة
- يختبر صلاحيات القراءة والكتابة
- يختبر Foreign Key constraints

### 3. **الإصلاح التلقائي**

- يحاول حل المشاكل الشائعة
- يمزامن البيانات المعلقة
- ينظف البيانات التالفة

## 📊 رسائل الخطأ الجديدة

بدلاً من `[object Object]`، ستظهر رسائل واضحة:

```
❌ خطأ في قاعدة البيانات: الجداول غير موجودة
❌ خطأ في الاتصال: مفتاح API غير صحيح
❌ خطأ في الشبكة: تحقق من اتصال الإنترنت
❌ خطأ في العلاقات: مشكلة في ربط البيانات
```

## 🎯 خطوات الإصلاح السريع

### الخطوة 1: تشخيص المشكلة

```javascript
// في Console
quickSupabaseFix();
```

### الخطوة 2: تحقق من الجداول

1. انتقل إلى Supabase Dashboard
2. Database → Tables
3. تأكد من وجود 9 جداول

### الخطوة 3: اختبر الاتصال

```javascript
// في Console
quickSupabaseDiagnosis();
```

### الخطوة 4: تطبيق الحلول

- حسب نوع الخطأ، اتبع الحلول أعلاه

## 📱 طريقة الاستخدام

### عند ظهور خطأ:

1. **اضغط زر "تشخيص المشكلة"** في رسالة الخطأ
2. **راجع النتائج** في نافذة التشخيص
3. **اضغط "إصلاح تلقائي"** إذا توفر
4. **اتبع الاقتراحات** المعروضة

### للمراقبة المستمرة:

- راقب **مؤشر الحالة السريع** في شريط التنقل
- تحقق من **زر التشخيص** إذا تغير لونه للأحمر
- راجع **Console المتصفح** للتفاصيل

## 🆘 إذا لم تحل المشكلة

### جمع المعلومات للدعم:

```javascript
// تقرير شامل للمشكلة
console.log("=== تقرير المشكلة ===");
console.log("URL:", window.location.href);
console.log("User Agent:", navigator.userAgent);
console.log("Online:", navigator.onLine);

// تشخيص Supabase
quickSupabaseFix().then((result) => {
  console.log("Supabase Diagnosis:", result);
});
```

### معلومات مطلوبة:

1. **لقطة شاشة** من زر التشخيص
2. **نسخ من Console logs**
3. **إعدادات Supabase** (بدون المفاتيح السرية)
4. **خطوات إعادة إنتاج المشكلة**

---

**مع هذه التحديثات، يجب أن تختفي رسائل "[object Object]" وتظهر تفاصيل واضحة للأخطاء! 🎉**
