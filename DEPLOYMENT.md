# 🚀 دليل النشر - صالة حسام جم

## ✅ قائمة التحقق قبل النشر

### 1. فحص الكود والاستيرادات

```bash
# فحص صحة الاستيرادات
npm run validate

# فحص أنواع TypeScript
npm run typecheck

# فحص شامل
npm run check
```

### 2. اختبار البناء محلياً

```bash
# بناء للإنتاج
npm run build

# اختبار البناء
npm run preview
```

### 3. فحص قاعدة البيانات

- [ ] تأكد من تشغيل SQL schema في Supabase
- [ ] تحقق من صحة معرفات الاتصال
- [ ] اختبر الاتصال بقاعدة البيانات

### 4. متغيرات البيئة

```bash
# تأكد من وجود هذه المتغيرات في بيئة النشر
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. اختبار PWA

- [ ] تحقق من manifest.json
- [ ] اختبر Service Worker
- [ ] تأكد من عمل الوضع offline

## 🔧 حل المشاكل الشائعة

### مشكلة: ملف مفقود أثناء البناء

```
Error: Could not load /path/to/missing-file
```

**الحل:**

1. تشغيل `npm run validate` لفحص الاستيرادات
2. التأكد من وجود جميع الملفات المستوردة
3. إصلاح المسارات الخاطئة

### مشكلة: خطأ في أنواع TypeScript

```
Error: Type error
```

**الحل:**

1. تشغيل `npm run typecheck`
2. إصلاح أخطاء الأنواع
3. التأكد من تحديث جميع types

### مشكلة: فشل PWA build

```
Error: PWA build failed
```

**الحل:**

1. التحقق من وجود ملفات الأيقونات
2. فحص manifest.json
3. التأكد من إعدادات vite.config.ts

## 📦 أوامر النشر المختلفة

### النشر العادي (مع التحقق)

```bash
npm run build
```

### النشر السريع (بدون تحقق)

```bash
npm run build:force
```

### النشر مع فحص شامل

```bash
npm run deploy:check
```

## 🌐 إعداد بيئات النشر

### Vercel

1. ربط repository بـ Vercel
2. إضافة متغيرات البيئة
3. تعيين build command: `npm run build`
4. تعيين output directory: `dist`

### Netlify

1. ربط repository بـ Netlify
2. إضافة متغيرات البيئة
3. تعيين build command: `npm run build`
4. تعيين publish directory: `dist`

### GitHub Pages

```bash
# إضافة لـ package.json
"homepage": "https://yourusername.github.io/repo-name",
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

## 🔍 مراقبة ما بعد النشر

### تحقق من:

- [ ] تحميل الصفحة الرئيسية بنجاح
- [ ] عمل تسجيل الدخول (كلمة المرور: 112233)
- [ ] عمل جميع الصفحات
- [ ] عمل الوضع offline
- [ ] تثبيت PWA
- [ ] عمل قاعدة البيانات

### أدوات المراقبة:

```bash
# فحص وحدة التحكم في المتصفح
# فحص Network tab للأخطاء
# فحص Application tab لـ PWA
# اختبار Service Worker
```

## 🚨 إجراءات الطوارئ

### في حالة فشل النشر:

1. **الرجوع للإصدار السابق:**

   ```bash
   git revert HEAD
   git push
   ```

2. **النشر السريع بدون تحقق:**

   ```bash
   npm run build:force
   ```

3. **فحص سجلات الأخطاء:**
   - تحقق من وحدة التحكم
   - راجع سجلات النشر
   - فحص متغيرات البيئة

### جهات الاتصال للدعم:

- مطور النظام: [البريد الإلكتروني]
- وثائق Supabase: https://supabase.io/docs
- مجتمع GitHub: [رابط المستودع]

## 📊 مؤشرات الأداء

### أهداف الأداء:

- وقت التحميل: < 3 ثوانٍ
- First Contentful Paint: < 1.5 ثانية
- Largest Contentful Paint: < 2.5 ثانية
- Time to Interactive: < 3 ثوانٍ

### أدوات القياس:

- Google PageSpeed Insights
- Lighthouse
- WebPageTest

---

**ملاحظة:** احتفظ بهذا الدليل محدثاً مع أي تغييرات في عملية النشر.
