# 🚀 دليل النشر - نظام حسام جم

## قبل البدء

تأكد من توفر:

- حساب [Supabase](https://supabase.com) (مجاني)
- Node.js v18 أو أحدث
- npm أو yarn

## 1. إعداد قاعدة البيانات (Supabase)

### إنشاء المشروع

1. انتقل إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط "New Project"
3. املأ بيانات المشروع:
   - **Name**: Hussam Gym
   - **Database Password**: كلمة مرور قوية
   - **Region**: اختر الأقرب لموقعك

### تنفيذ سكربت قاعدة البيانات

1. انتقل إلى **SQL Editor** في لوحة تحكم Supabase
2. انسخ محتوى ملف `database/schema.sql`
3. الصق الكود في SQL Editor
4. اضغط **Run** لتنفيذ السكربت

### الحصول على مفاتيح الاتصال

1. انتقل إلى **Settings > API**
2. انسخ:
   - **Project URL**: `https://[project-id].supabase.co`
   - **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 2. تكوين المشروع محلياً

### تحديث معلومات Supabase

في ملف `src/lib/supabase.ts`:

```typescript
const supabaseUrl = "https://[YOUR-PROJECT-ID].supabase.co";
const supabaseKey = "YOUR-ANON-KEY";
```

### تثبيت التبعيات

```bash
npm install
```

### تشغيل المشروع محلياً

```bash
npm run dev
```

## 3. النشر على Vercel (مُوصى به)

### الطريقة السريعة

1. ادفع الكود إلى GitHub
2. انتقل إلى [Vercel Dashboard](https://vercel.com)
3. اضغط "New Project"
4. اختر مستودع GitHub
5. اضغط "Deploy"

### إعداد متغيرات البيئة

في Vercel Dashboard > Settings > Environment Variables:

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. النشر على Netlify

### الطريقة السريعة

1. اربط مع GitHub
2. انتقل إلى [Netlify Dashboard](https://netlify.com)
3. اضغط "New site from Git"
4. اختر مستودع GitHub
5. تكوين البناء:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

## 5. النشر الذاتي

### بناء المشروع

```bash
npm run build
```

### رفع الملفات

1. انسخ محتوى مجلد `dist/`
2. ارفعه إلى خادمك
3. تأكد من تكوين الخادم لإعادة توجيه جميع الطلبات إلى `index.html`

### تكوين Apache

```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

### تكوين Nginx

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 6. تفعيل PWA

### تحقق من الملفات

تأكد من وجود:

- `public/manifest.json`
- `public/sw.js`
- أيقونات في `public/`

### اختبار PWA

1. افتح الموقع في Chrome/Edge
2. اضغط F12 > Application > Manifest
3. تحقق من صحة البيانات

## 7. تكوين النطاق المخصص

### في Vercel

1. انتقل إلى Settings > Domains
2. أضف نطاقك المخصص
3. اتبع تعليمات DNS

### في Netlify

1. انتقل إلى Domain settings
2. أضف Custom domain
3. تكوين DNS records

## 8. النسخ الاحتياطي والأمان

### نسخ احتياطي تلقائي

Supabase يوفر نسخ احتياطي تلقائي، لكن يُنصح بـ:

1. تصدير البيانات دورياً من SQL Editor
2. حفظ نسخة من الكود في مكان آمن

### تقوية الأمان

في Supabase:

1. **Authentication > Settings**
2. تفعيل additional security features
3. تحديث RLS policies حسب الحاجة

## 9. المراقبة والصيانة

### مراقبة Supabase

1. انتقل إلى **Reports** في Dashboard
2. راقب استخدام الموارد
3. تفقد logs للأخطاء

### تحديثات النظام

```bash
# تحديث التبعيات
npm update

# إعادة نشر
npm run build
```

## 10. استكشاف الأخطاء

### مشاكل الاتصال

- تحقق من صحة Supabase keys
- تأكد من تفعيل CORS في Supabase
- راجع Network tab في DevTools

### مشاكل PWA

- تحقق من صحة manifest.json
- تأكد من تسجيل Service Worker
- اختبر offline functionality

### مشاكل البيانات

- تحقق من RLS policies في Supabase
- راجع SQL logs للأخطاء
- تأكد من صحة foreign keys

## 📞 الدعم

في حالة مواجهة مشاكل:

1. راجع logs في Supabase Dashboard
2. تحقق من Developer Tools في المتصفح
3. راجع documentation الرسمي لـ Supabase

## ✅ قائمة المراجعة النهائية

- [ ] قاعدة البيانات منشأة في Supabase
- [ ] البيانات التجريبية محمّلة
- [ ] مفاتيح Supabase محدّثة في الكود
- [ ] المشروع يعمل محلياً
- [ ] تم النشر بنجاح
- [ ] PWA يعمل بشكل صحيح
- [ ] النطاق المخصص مُكوّن (اختياري)
- [ ] النسخ الاحتياطي مُفعّل

---

**تهانينا! 🎉 نظام حسام جم جاهز للعمل**
