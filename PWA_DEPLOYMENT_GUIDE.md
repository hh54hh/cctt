# 📱 دليل نشر PWA واختبار التثبيت

## لماذا لا تظهر خيارات التثبيت في التطوير؟

في مرحلة التطوير (`localhost`), ميزات PWA الكاملة قد لا تعمل لأن:

- **HTTPS مطلوب**: PWA تتطلب HTTPS أو localhost
- **Manifest validation**: بعض المتصفحات تتطلب domain حقيقي
- **Service Worker limitations**: قيود في بيئة التطوير

---

## 🚀 خطوات النشر لتفعيل PWA

### 1. بناء التطبيق للإنتاج

```bash
npm run build
```

**✅ يجب أن ترى:**

```
✓ built in X.XXs
PWA v0.20.5
mode      generateSW
precache  XX entries
files generated
  dist/sw.js
  dist/workbox-XXXXXX.js
```

### 2. اختبار البناء محلياً

```bash
npm run preview
```

**ثم افتح:** `http://localhost:4173`

### 3. رفع للاستضافة (مجاناً)

#### أ. Netlify (مُوصى به):

1. **إنشاء حساب** على [Netlify](https://netlify.com)
2. **اسحب مجلد `dist/`** إلى Netlify
3. **أو اربط GitHub** للنشر التلقائي

#### ب. Vercel:

1. **إنشاء حساب** على [Vercel](https://vercel.com)
2. **اربط مع GitHub** أو ارفع المجلد
3. **تأكد من إعدادات Build:**
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### ج. GitHub Pages:

```bash
# إضافة للـ package.json
"homepage": "https://username.github.io/repo-name",

# تثبيت gh-pages
npm install --save-dev gh-pages

# إضافة script للـ package.json
"deploy": "gh-pages -d dist"

# النشر
npm run deploy
```

---

## 🧪 اختبار PWA بعد النشر

### 1. اختبار أساسي:

1. **افتح الموقع** في Chrome/Edge/Firefox
2. **ابحث عن أيقونة التثبيت** في شريط العناوين
3. **تحقق من DevTools** → Application → Manifest

### 2. اختبار التثبيت على Desktop:

#### Chrome:

- **أيقونة + في شريط العناوين**
- **Menu → Install app**
- **Banner تلقائي** (قد يستغرق وقت)

#### Edge:

- **أيقونة + في شريط العناوين**
- **Menu → Apps → Install this site as an app**

#### Firefox:

- **يدعم PWA جزئياً**
- **إضافة لشاشة البداية**

### 3. اختبار التثبيت على Mobile:

#### Android Chrome:

- **Banner "Add to Home Screen"**
- **Menu → Add to Home Screen**
- **يجب أن يظهر كتطبيق منفصل**

#### iOS Safari:

- **Share Button → Add to Home Screen**
- _(يحتاج تحديثات إضافية للـ manifest)_

---

## 🔍 اختبارات PWA المتقدمة

### 1. Lighthouse PWA Audit:

1. **افتح DevTools** (F12)
2. **تبويب Lighthouse**
3. **اختر Progressive Web App**
4. **Generate Report**

**✅ يجب أن تحصل على:**

- **Installable**: ✅
- **PWA Optimized**: ✅
- **Service Worker**: ✅
- **Manifest**: ✅

### 2. اختبار Service Worker:

1. **DevTools → Application → Service Workers**
2. **تأكد من وجود** `sw.js`
3. **حالة**: **activated and running**

### 3. اختبار الأوف لاين:

1. **DevTools → Network → Offline**
2. **أعد تحميل الصفحة**
3. **يجب أن تعمل بدون إنترنت**

---

## 🛠️ إصلاح مشاكل PWA الشائعة

### المشكلة: لا تظهر أيقونة التثبيت

**الحلول:**

```bash
# 1. تأكد من HTTPS
# 2. امسح الكاش
# 3. تحقق من Manifest

# فحص Manifest في DevTools:
# Application → Manifest
# يجب أن تكون جميع الحقول صحيحة
```

### المشكلة: Service Worker لا يعمل

**الحلول:**

```bash
# 1. امسح الكاش والبيانات
# 2. تحقق من Console للأخطاء
# 3. أعد بناء التطبيق

npm run build
```

### المشكلة: لا يعمل أوف لاين

**الحلول:**

```bash
# 1. تحقق من Service Worker
# 2. فحص Cache Storage في DevTools
# 3. تأكد من تسجيل SW بشكل صحيح
```

---

## 📋 Checklist قبل النشر

### ✅ إعدادات PWA:

- [ ] **Manifest.json** صحيح ومكتمل
- [ ] **Icons** متعددة الأحجام موجودة
- [ ] **Service Worker** يُبنى بشكل صحيح
- [ ] **Theme colors** محددة
- [ ] **Display mode** = standalone
- [ ] **Start URL** صحيح

### ✅ إعدادات الاستضافة:

- [ ] **HTTPS** مُفعل
- [ ] **Custom domain** (اختياري)
- [ ] **Headers** صحيحة للـ SW
- [ ] **Caching** مُعد بشكل صحيح

### ✅ اختبارات نهائية:

- [ ] **Lighthouse PWA score** > 80
- [ ] **يعمل أوف لاين**
- [ ] **قابل للتثبيت** على Desktop/Mobile
- [ ] **أيقونات ظاهرة** بشكل صحيح
- [ ] **Splash screen** يعمل

---

## 🎯 مثال للنشر على Netlify

### 1. إعداد ملف `_redirects`:

```bash
# في مجلد public/_redirects
/*    /index.html   200
```

### 2. إعداد ملف `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
```

### 3. النشر:

```bash
# بناء التطبيق
npm run build

# رفع مجلد dist/ إلى Netlify
# أو ربط GitHub للنشر التلقائي
```

---

## 🔗 روابط مفيدة للاختبار

- **PWA Builder**: https://www.pwabuilder.com/
- **Lighthouse**: https://web.dev/lighthouse-pwa/
- **Can I Use PWA**: https://caniuse.com/web-app-manifest
- **MDN PWA Guide**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

---

## 📱 نصائح للتأكد من عمل PWA

### في Chrome:

1. **اكتب** `chrome://flags` في شريط العناوين
2. **ابحث عن** "Desktop PWAs"
3. **تأكد من تفعيلها**

### في Edge:

1. **Settings → Default browser**
2. **تفعيل** "Allow sites to be saved as apps"

### للاختبار المحلي:

```bash
# استخدم HTTPS محلياً
npx local-ssl-proxy --source 3001 --target 3000

# أو استخدم ngrok
npx ngrok http 3000
```

---

**بعد النشر على HTTPS، ستظهر جميع ميزات PWA بشكل صحيح! 🚀**

**للتأكد من النجاح:**

1. ✅ **رفع للاستضافة** (Netlify/Vercel)
2. ✅ **اختبار على HTTPS**
3. ✅ **فحص Lighthouse**
4. ✅ **تجربة التثبيت**
