import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  WifiOff,
  Users,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  getPendingOperationsCount,
  getLastSyncTime,
  onConnectionChange,
  isOnline,
} from "@/lib/database-offline";
// OfflineStorage functionality integrated into database-offline
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function OfflineMode() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(getPendingOperationsCount());
  const [lastSync, setLastSync] = useState<Date | null>(getLastSyncTime());
  const [stats, setStats] = useState({
    subscribers: 0,
    products: 0,
    sales: 0,
  });

  useEffect(() => {
    // Update connection status
    const unsubscribe = onConnectionChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        // Redirect back to dashboard when online
        navigate("/dashboard/subscribers");
      }
    });

    // Load offline stats
    const loadStats = () => {
      const subscribers = OfflineStorage.getSubscribers();
      const products = OfflineStorage.getProducts();
      const sales = OfflineStorage.getSales();

      setStats({
        subscribers: subscribers.length,
        products: products.length,
        sales: sales.length,
      });
    };

    loadStats();

    // Update pending count periodically
    const interval = setInterval(() => {
      setPendingCount(getPendingOperationsCount());
      setLastSync(getLastSyncTime());
      loadStats();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigate]);

  const formatSyncTime = (date: Date | null) => {
    if (!date) return "لم يتم المزامنة بعد";

    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "منذ أقل من دقيقة";
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffMinutes < 1440) return `منذ ${Math.floor(diffMinutes / 60)} ساعة`;

    return format(date, "dd MMMM yyyy - HH:mm", { locale: ar });
  };

  // If online, redirect immediately
  if (online) {
    navigate("/dashboard/subscribers");
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-lg inline-flex">
            <WifiOff className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">وضع الأوف لاين</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            التطبيق يعمل الآن بدون إنترنت. يمكنك الاستمرار في استخدام جميع
            الميزات وستتم مزامنة البيانات تلقائياً عند عودة الاتصال.
          </p>
        </div>

        {/* Status Alert */}
        <Alert className="border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            لا يتوفر اتصال بالإنترنت. جميع العمليات ستحفظ محلياً وتتم مزامنتها
            لاحقاً.
          </AlertDescription>
        </Alert>

        {/* Pending Operations Alert */}
        {pendingCount > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              يوجد {pendingCount} عملية في انتظار المزامنة مع الخادم
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">المشتركين (محلياً)</p>
                  <p className="text-2xl font-bold">{stats.subscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">المنتجات (محلياً)</p>
                  <p className="text-2xl font-bold">{stats.products}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">المبيعات (محلياً)</p>
                  <p className="text-2xl font-bold">{stats.sales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Sync Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              معلومات المزامنة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-1">
                آخر مزامنة:
              </h4>
              <p className="text-sm text-gray-600">
                {formatSyncTime(lastSync)}
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-yellow-700 mb-1">
                  العمليات المعلقة:
                </h4>
                <p className="text-sm text-yellow-600">
                  {pendingCount} عملية في انتظار المزامنة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              الميزات المتاحة بدون إنترنت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">
                  إدارة المشتركين:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• إضافة مشتركين جدد</li>
                  <li>• تعديل بيانات المشتركين</li>
                  <li>• عرض وبحث المشتركين</li>
                  <li>• طباعة بطاقات المشتركين</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">إدارة المخزون:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• إضافة وتعديل المنتجات</li>
                  <li>• تسجيل عمليات البيع</li>
                  <li>• عرض المخزون المتاح</li>
                  <li>• متابعة الكميات القليلة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/dashboard/subscribers")}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            <Users className="h-5 w-5 ml-2" />
            المشتركين
          </Button>

          <Button
            onClick={() => navigate("/dashboard/add-subscriber")}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <Users className="h-5 w-5 ml-2" />
            إضافة مشترك
          </Button>

          <Button
            onClick={() => navigate("/dashboard/inventory")}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Package className="h-5 w-5 ml-2" />
            المخزون والمبيعات
          </Button>
        </div>

        {/* Connection Status */}
        <div className="text-center">
          <Badge variant="secondary" className="bg-red-500 text-white">
            <WifiOff className="h-3 w-3 ml-1" />
            غير متصل
          </Badge>
          <p className="text-xs text-gray-500 mt-2">
            سيتم إعادة التوجيه تلقائياً عند عودة الاتصال
          </p>
        </div>
      </div>
    </div>
  );
}
