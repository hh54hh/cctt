import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Printer,
  Database,
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  HardDrive,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getSubscribers,
  getProducts,
  getSales,
  getCoursePoints,
  getDietItems,
} from "@/lib/database-offline";
import { getOnlineStatus } from "@/lib/database-offline";
import PWAStatus from "@/components/PWAStatus";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    subscribers: 0,
    products: 0,
    sales: 0,
    courses: 0,
    dietItems: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  useEffect(() => {
    loadStats();

    // مراقبة حالة الاتصال
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadStats = async () => {
    try {
      const [subscribers, products, sales, courses, dietItems] =
        await Promise.all([
          getSubscribers(),
          getProducts(),
          getSales(),
          getCoursePoints(),
          getDietItems(),
        ]);

      setStats({
        subscribers: subscribers.length,
        products: products.length,
        sales: sales.length,
        courses: courses.length,
        dietItems: dietItems.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleBackupDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // جمع جميع البيانات
      const [subscribers, products, sales, courses, dietItems] =
        await Promise.all([
          getSubscribers(),
          getProducts(),
          getSales(),
          getCoursePoints(),
          getDietItems(),
        ]);

      // إنشاء كائن النسخة الاحتياطية
      const backupData = {
        metadata: {
          created_at: new Date().toISOString(),
          version: "1.0",
          gym_name: "صالة حسام لكمال الأجسام",
          total_records:
            subscribers.length +
            products.length +
            sales.length +
            courses.length +
            dietItems.length,
        },
        data: {
          subscribers,
          products,
          sales,
          courses,
          dietItems,
        },
        statistics: stats,
      };

      // تحويل إلى JSON
      const backupJson = JSON.stringify(backupData, null, 2);

      // إنشاء ملف للتنزيل
      const blob = new Blob([backupJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // إنشاء رابط التنزيل
      const link = document.createElement("a");
      link.href = url;
      link.download = `gym-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // تنظيف الذاكرة
      URL.revokeObjectURL(url);

      setSuccess("تم تنزيل النسخة الاحتياطية بنجاح!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error("Error creating backup:", error);
      setError("حدث خطأ أثناء إنشاء النسخة الاحتياطية");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSystemPrint = () => {
    setBackupDialogOpen(true);
  };

  const handlePrintAllData = async () => {
    try {
      // جمع جميع البيانات التفصيلية
      const [subscribers, products, sales, courses, dietItems] =
        await Promise.all([
          getSubscribers(),
          getProducts(),
          getSales(),
          getCoursePoints(),
          getDietItems(),
        ]);

      // فتح نافذة طباعة تحتوي على جميع البيانات التفصيلية
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>التقرير الشامل للنظام - صالة حسام</title>
            <style>
              body { font-family: 'Arial', sans-serif; direction: rtl; margin: 15px; font-size: 12px; }
              h1 { color: #f97316; border-bottom: 3px solid #f97316; padding-bottom: 10px; text-align: center; }
              h2 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 8px; margin-top: 25px; }
              h3 { color: #d97706; border-bottom: 1px solid #d97706; padding-bottom: 5px; }
              .stats { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .section { margin: 20px 0; page-break-inside: avoid; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
              th { background: #f97316; color: white; font-weight: bold; }
              tr:nth-child(even) { background: #f9f9f9; }
              .currency { color: #16a34a; font-weight: bold; }
              .date { color: #6b7280; font-size: 10px; }
              .notes { font-style: italic; color: #6b7280; max-width: 200px; }
              @media print {
                .no-print { display: none; }
                body { margin: 10px; }
                h1 { font-size: 18px; }
                h2 { font-size: 16px; }
                h3 { font-size: 14px; }
              }
              .developer-info { background: #e0f2fe; padding: 10px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <h1>🏋️ التقرير الشامل لنظام إدارة صالة حسام جم</h1>

            <div class="stats">
              <h2>📊 إحصائيات النظام</h2>
              <table>
                <tr><td><strong>إجمالي المشتركين:</strong></td><td>${stats.subscribers}</td></tr>
                <tr><td><strong>إجمالي المنتجات:</strong></td><td>${stats.products}</td></tr>
                <tr><td><strong>إجمالي المبيعات:</strong></td><td>${stats.sales}</td></tr>
                <tr><td><strong>إجمالي التمارين:</strong></td><td>${stats.courses}</td></tr>
                <tr><td><strong>إجمالي العناصر الغذائية:</strong></td><td>${stats.dietItems}</td></tr>
                <tr><td><strong>تاريخ التقرير:</strong></td><td>${new Date().toLocaleDateString("ar-IQ")} - ${new Date().toLocaleTimeString("ar-IQ")}</td></tr>
              </table>
            </div>

            ${
              subscribers.length > 0
                ? `
            <div class="section">
              <h2>👥 قائمة المشتركين (${subscribers.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>الاسم</th>
                    <th>العمر</th>
                    <th>الوزن</th>
                    <th>الطول</th>
                    <th>رقم الهاتف</th>
                    <th>تاريخ الاشتراك</th>
                  </tr>
                </thead>
                <tbody>
                  ${subscribers
                    .map(
                      (sub, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${sub.name}</td>
                      <td>${sub.age || "-"}</td>
                      <td>${sub.weight ? sub.weight + " كج" : "-"}</td>
                      <td>${sub.height ? sub.height + " سم" : "-"}</td>
                      <td>${sub.phone || "-"}</td>
                      <td class="date">${new Date(sub.created_at).toLocaleDateString("ar-IQ")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
                : ""
            }

            ${
              products.length > 0
                ? `
            <div class="section">
              <h2>📦 قائمة المنتجات (${products.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم المنتج</th>
                    <th>الفئة</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>القيمة الإجمالية</th>
                    <th>الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  ${products
                    .map(
                      (product, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${product.name}</td>
                      <td>${product.category || "-"}</td>
                      <td>${product.quantity}</td>
                      <td class="currency">${product.price.toFixed(0)} د.ع</td>
                      <td class="currency">${(product.quantity * product.price).toFixed(0)} د.ع</td>
                      <td class="notes">${product.description || "-"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              <h3>💰 إجمالي قيمة المخزون: ${products.reduce((total, p) => total + p.quantity * p.price, 0).toFixed(0)} دينار عراقي</h3>
            </div>`
                : ""
            }

            ${
              sales.length > 0
                ? `
            <div class="section">
              <h2>🛒 سجل المبيعات (${sales.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم المشتري</th>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>المجموع</th>
                    <th>التاريخ</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${sales
                    .map(
                      (sale, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${sale.buyer_name}</td>
                      <td>${sale.product_name}</td>
                      <td>${sale.quantity}</td>
                      <td class="currency">${sale.unit_price.toFixed(0)} د.ع</td>
                      <td class="currency">${sale.total_price.toFixed(0)} د.ع</td>
                      <td class="date">${new Date(sale.created_at).toLocaleDateString("ar-IQ")}</td>
                      <td class="notes">${sale.notes || "-"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              <h3>💵 إجمالي المبيعات: ${sales.reduce((total, s) => total + s.total_price, 0).toFixed(0)} دينار عراقي</h3>
            </div>`
                : ""
            }

            ${
              courses.length > 0
                ? `
            <div class="section">
              <h2>💪 قائمة التمارين (${courses.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم التمرين</th>
                    <th>الوصف</th>
                    <th>تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  ${courses
                    .map(
                      (course, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${course.name}</td>
                      <td class="notes">${course.description || "-"}</td>
                      <td class="date">${new Date(course.created_at).toLocaleDateString("ar-IQ")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
                : ""
            }

            ${
              dietItems.length > 0
                ? `
            <div class="section">
              <h2>🍎 قائمة العناصر الغذائية (${dietItems.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم العنصر الغذائي</th>
                    <th>الوصف</th>
                    <th>تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  ${dietItems
                    .map(
                      (item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.name}</td>
                      <td class="notes">${item.description || "-"}</td>
                      <td class="date">${new Date(item.created_at).toLocaleDateString("ar-IQ")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
                : ""
            }

            <div class="developer-info">
              <h3>👨‍💻 معلومات المطور</h3>
              <p><strong>المطور:</strong> حمزه احمد</p>
              <p><strong>واتساب:</strong> 07800657822</p>
              <p><strong>تاريخ إنشاء التقرير:</strong> ${new Date().toLocaleDateString("ar-IQ")} - ${new Date().toLocaleTimeString("ar-IQ")}</p>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #6b7280;">
              <p>تم إنشاء هذا التقرير بواسطة نظام إدارة صالة حسام جم</p>
              <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error("Error generating detailed report:", error);
      setError("حدث خطأ أثناء إنشاء التقرير المفصل");
    }
    setBackupDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const estimatedBackupSize =
    JSON.stringify({
      subscribers: stats.subscribers,
      products: stats.products,
      sales: stats.sales,
    }).length * 50; // تقدير تقريبي

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
              <SettingsIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                إعدادات النظام
              </h1>
              <p className="text-gray-600">
                إدارة النسخ الاحتياطية والإعدادات العامة
              </p>
            </div>
          </div>

          {/* حالة الاتصال */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="h-4 w-4 ml-2" />
                متصل
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                <WifiOff className="h-4 w-4 ml-2" />
                غير متصل
              </Badge>
            )}
          </div>
        </div>

        {/* رسائل النجاح والخطأ */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* إحصائيات النظام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              إحصائيات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.subscribers}
                </div>
                <div className="text-sm text-blue-700">المشتركين</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.products}
                </div>
                <div className="text-sm text-green-700">المنتجات</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.sales}
                </div>
                <div className="text-sm text-purple-700">المبيعات</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.courses}
                </div>
                <div className="text-sm text-orange-700">التمارين</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.dietItems}
                </div>
                <div className="text-sm text-yellow-700">العناصر الغذائية</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* النسخة الاحتياطية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              النسخة الاحتياطية والطباعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                💾 تنزيل النسخة الاحتياطية
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                احفظ جميع بيانات النظام في ملف JSON آمن
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  الحجم المتوقع: {formatFileSize(estimatedBackupSize)}
                </div>
                <Button
                  onClick={handleBackupDownload}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download className="h-4 w-4 ml-2" />
                  )}
                  {isLoading ? "جاري الإنشاء..." : "تنزيل النسخة الاحتياطية"}
                </Button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                🖨️ طباعة التقرير الشامل للنظام
              </h3>
              <p className="text-green-800 text-sm mb-3">
                اطبع تقرير مفصل يحتوي على جميع البيانات: المشتركين، المنتجات،
                المبيعات، التمارين، والعناصر الغذائية
              </p>
              <Button
                onClick={handleFullSystemPrint}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة التقرير الشامل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* حالة PWA */}
        <PWAStatus />

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>إصدار النظام:</strong> 1.0.0
              </div>
              <div>
                <strong>نوع التطبيق:</strong> PWA (تطبيق ويب تقدمي)
              </div>
              <div>
                <strong>آخر تحديث:</strong>{" "}
                {new Date().toLocaleDateString("ar")}
              </div>
              <div>
                <strong>حالة العمل بدون إنترنت:</strong>
                <Badge variant="default" className="mr-2 bg-green-500">
                  متوفر
                </Badge>
              </div>
              <div className="md:col-span-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  👨‍💻 معلومات المطور
                </h4>
                <div className="space-y-1 text-blue-800">
                  <div>
                    <strong>المطور:</strong> حمزه احمد
                  </div>
                  <div>
                    <strong>واتساب:</strong> 07800657822
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    للدعم التقني والصيانة، يرجى التواصل عبر الواتساب
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog تأكيد الطباعة */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>🖨️ طباعة النظام الكامل</DialogTitle>
            <DialogDescription>
              هل تريد طباعة تقرير شامل عن حالة النظام؟
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                سيتم طباعة التقرير الشامل متضمناً:
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>
                  <strong>إحصائيات النظام:</strong> جميع الأعداد والمجاميع
                </li>
                <li>
                  <strong>قائمة المشتركي��:</strong> الأسماء، الأعمار، الأوزان،
                  أرقام الهواتف
                </li>
                <li>
                  <strong>قائمة المنتجات:</strong> الأسماء، الأسعار، الكميات،
                  القيم الإجمالية
                </li>
                <li>
                  <strong>سجل المبيعات:</strong> تفاصيل كل عملية بيع مع التواريخ
                </li>
                <li>
                  <strong>قائمة التمارين:</strong> جميع التمارين المتاحة
                </li>
                <li>
                  <strong>العناصر الغذائية:</strong> جميع الأطعمة المسجلة
                </li>
                <li>
                  <strong>معلومات المطور:</strong> حمزه احمد - واتساب
                  07800657822
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                📄 تقرير مفصل وشامل لجميع بيانات النظام
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrintAllData}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
              <Button
                variant="outline"
                onClick={() => setBackupDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
