import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Database,
  ExternalLink,
  Copy,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface DatabaseSetupWarningProps {
  onRetry?: () => void;
}

export default function DatabaseSetupWarning({
  onRetry,
}: DatabaseSetupWarningProps) {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- 🏋️ سكربت مبسط لإعداد صالة حسام (يعمل دائماً)
-- انسخ والصق هذا في Supabase SQL Editor

-- 1. إنشاء الجداول الأساسية
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'diet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
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

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    category TEXT,
    min_stock_level INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إدراج البيانات الأولية (مع حماية من التكرار)
DO $\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM course_points LIMIT 1) THEN
        INSERT INTO course_points (name, description) VALUES
        ('بنش برس', 'تمرين أساسي لعضلات الصدر'),
        ('سكوات', 'تمرين شامل لعضلات الأرجل'),
        ('ديد ليفت', 'تمرين قوي لعضلات الظهر'),
        ('شد علوي', 'تمرين لعضلات الظهر والباي'),
        ('ضغط كتف', 'تمرين لعضلات الكتف'),
        ('كارديو', 'تمارين القلب والأوعية الدموية'),
        ('تمارين البطن', 'تمارين عضلات البطن'),
        ('باي سبس', 'تمرين للعضلة ذات الرأسين');
    END IF;
END $\$;

DO $\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM diet_items LIMIT 1) THEN
        INSERT INTO diet_items (name, description) VALUES
        ('بيض مسلوق', 'مصدر ممتاز للبروتين'),
        ('شوفان', 'كربوهيدرات معقدة وألياف'),
        ('دجاج مشوي', 'بروتين خالي من الدهون'),
        ('أرز بني', 'كربوهيدرات صحية'),
        ('خضروات ورقية', 'فيتامينات ومعادن'),
        ('تمر', 'سكريات طبيعية سريعة'),
        ('لوز', 'دهون صحية وبروتين نباتي'),
        ('حليب خالي الدسم', 'كالسيوم وبروتين');
    END IF;
END $\$;

DO $\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
        INSERT INTO products (name, description, price, quantity, category, min_stock_level) VALUES
        ('واي بروتين', 'مكمل بروتين سريع الامتصاص', 150.00, 50, 'مكملات غذائية', 10),
        ('كرياتين', 'مكمل لزيادة القوة والطاقة', 80.00, 30, 'مكملات غذائية', 5),
        ('مشروب طاقة', 'مشروب طاقة طبيعي', 8.00, 200, 'مشروبات', 50);
    END IF;
END $\$;

-- 3. تعطيل Row Level Security للبساطة
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_items DISABLE ROW LEVEL SECURITY;`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const openSupabase = () => {
    window.open("https://supabase.com/dashboard", "_blank");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-700">
            <div className="text-xl font-bold mb-2">
              ⚠️ قاعدة البيانات غير موجودة!
            </div>
            <p className="text-lg">
              يجب تشغيل السكربت في Supabase أولاً لإنشاء الجداول المطلوبة.
            </p>
            <p className="text-sm mt-2 bg-red-100 p-2 rounded">
              <strong>ملاحظة:</strong> هذه خطوة واحدة فقط ولن تحتاج لتكرارها مرة
              أخرى.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-500 rounded-full">
                <Database className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">
              إعداد قاعدة البيانات مطلوب
            </CardTitle>
            <p className="text-gray-600 mt-2">
              يبدو أن جداول قاعدة البيانات لم يتم إنشاؤها بعد. اتبع الخطوات
              التالية لإعداد النظام:
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  📋 الخطوات المطلوب��:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>افتح لوحة تحكم Supabase</li>
                  <li>انتقل إلى "SQL Editor"</li>
                  <li>انسخ والصق السكربت المرفق</li>
                  <li>اضغط "Run" لتنفيذ السكربت</li>
                  <li>أعد تحميل هذه الصفحة</li>
                </ol>

                <div className="flex gap-2">
                  <Button
                    onClick={openSupabase}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    فتح Supabase
                  </Button>

                  {onRetry && (
                    <Button
                      onClick={onRetry}
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      إعادة المحاولة
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📄 السكربت المطلوب:
                  </h3>
                  <Button
                    onClick={handleCopyScript}
                    size="sm"
                    variant="outline"
                    className={copied ? "bg-green-50 border-green-200" : ""}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    {copied ? "تم النسخ!" : "نسخ السكربت"}
                  </Button>
                </div>

                <div
                  className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-64 overflow-y-auto"
                  dir="ltr"
                >
                  <pre>{sqlScript}</pre>
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Database className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>ملاحظة مهمة:</strong> هذا السكربت سينشئ جميع الجداول
                المطلوبة ويدرج البيانات الأولية (التمارين والعناصر الغذائية
                الأساسية) لبدء استخدام النظام فوراً.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-200 bg-green-50 mt-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>كيف تتأكد من نجاح العملية:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>ستظهر رسالة "Success" في Supabase</li>
                  <li>عند إعادة تحميل هذه الصفحة ستختفي هذه الرسالة</li>
                  <li>ستظهر صفحة تسجيل الدخول بدلاً من هذه الشاشة</li>
                  <li>ستجد تمارين وأطعمة جاهزة في النظام</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-center text-gray-500">
          <p>
            إذا كنت تحتاج مساعدة إضافية، راجع ملف{" "}
            <code>دليل_الإعداد_الكامل.md</code>
          </p>
        </div>
      </div>
    </div>
  );
}
