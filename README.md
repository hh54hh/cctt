# صالة حسام جم - نظام الإدارة

نظام إدارة شامل لصالة حسام جم الرياضية مع دعم العمل كتطبيق ويب متقدم (PWA) ووضع عدم الاتصال.

## المزايا الرئيسية

- 🏋️ **إدارة المشتركين**: عرض وإدارة جميع المشتركين مع تفاصيل شاملة
- 📝 **إضافة مشتركين**: واجهة من ثلاثة أعمدة لإدخال البيانات والكورسات والأنظمة الغذائية
- 🏃 **إدارة الكورسات**: قاعدة بيانات للتمارين والبرامج التدريبية
- 🥗 **الأنظمة الغذائية**: إدارة العناصر والبرامج الغذائية
- 🏪 **المخزن والمبيعات**: إدارة المنتجات والمبيعات مع نظام الفواتير
- 📱 **تطبيق PWA**: يعمل كتطبيق سطح مكتب أو جوال
- 🔄 **وضع عدم الاتصال**: يعمل بدون إنترنت مع تزامن تلقائي
- 🖨️ **الطباعة**: طباعة تقارير المشتركين والفواتير بتنسيق A4

## التقنيات المستخدمة

- **React 18** + **TypeScript**
- **React Router 6** للتنقل
- **TailwindCSS** للتصميم
- **Radix UI** للمكونات
- **PWA** مع Service Workers
- **IndexedDB** للتخزين المحلي (قريباً)
- **Supabase** لقاعدة البيانات (قريباً)

## التشغيل والتطوير

```bash
# تثبيت التبعيات
npm install

# تشغيل الخادم التطويري
npm run dev

# بناء للإنتاج
npm run build

# فحص الأنواع
npm run typecheck

# تشغيل الاختبارات
npm test
```

## بيانات الدخول الافتراضية

- **رمز الدخول**: `112233`

## هيكل المشروع

```
src/
├── components/          # مكونات قابلة للإعادة الاستخدام
│   ├── ui/             # مكتبة المكونات الأساسية
│   ├── Layout.tsx      # التخطيط الرئيسي
│   ├── SubscriberCard.tsx  # بطاقة المشترك
│   └── OfflineStatus.tsx   # حالة عدم الاتصال
├── pages/              # صفحات التطبيق
│   ├── Login.tsx       # صفحة تسجيل الدخول
│   ├── Subscribers.tsx # صفحة المشتركين
│   ├── AddSubscriber.tsx   # إضافة مشترك
│   ├── Courses.tsx     # إدارة الكورسات
│   ├── Diet.tsx        # إدارة الأنظمة الغذائية
│   ├── Store.tsx       # المخزن
│   └── Sales.tsx       # المبيعات
└── lib/                # أدوات مساعدة
```

## قاعدة البيانات (قريباً)

سيتم ربط النظام بقاعدة بيانات Supabase مع الجداول التالية:

```sql
-- جدول المشتركين
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  weight DECIMAL,
  height DECIMAL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المجموعات (كورسات/غذاء)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('course', 'diet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول عناصر المجموعات
CREATE TABLE group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول نقاط الكورسات
CREATE TABLE course_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول عناصر الغذاء
CREATE TABLE diet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المنتجات
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  price DECIMAL,
  quantity INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المبيعات
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  total_amount DECIMAL,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## المزايا القادمة

- [ ] ربط قاعدة البيانات Supabase
- [ ] وضع عدم الاتصال الكامل مع IndexedDB
- [ ] نظام الطباعة المتقدم
- [ ] إشعارات انتهاء الاشتراكات
- [ ] تقارير وإحصائيات متقدمة
- [ ] دعم تعدد الفروع
- [ ] تطبيق جوال أصلي

## الدعم الفني

للدعم الفني أو الاستفسارات، يرجى التواصل مع فريق التطوير.

---

© 2024 صالة حسام جم - جميع الحقوق محفوظة
