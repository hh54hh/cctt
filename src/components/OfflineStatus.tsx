import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wifi,
  WifiOff,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  isOnline,
  getPendingOperationsCount,
  onConnectionChange,
  getLastSyncTime,
  forceSyncWithServer,
} from "@/lib/database-offline";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function OfflineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(getPendingOperationsCount());
  const [lastSync, setLastSync] = useState<Date | null>(getLastSyncTime());
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Update status when connection changes
    const unsubscribe = onConnectionChange((isOnline) => {
      setOnline(isOnline);
      setPendingCount(getPendingOperationsCount());
      setLastSync(getLastSyncTime());
    });

    // Update pending count periodically
    const interval = setInterval(() => {
      setPendingCount(getPendingOperationsCount());
      setLastSync(getLastSyncTime());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!online) return;

    try {
      setSyncing(true);
      await forceSyncWithServer();
      setPendingCount(getPendingOperationsCount());
      setLastSync(getLastSyncTime());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

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

  const getStatusColor = () => {
    if (!online) return "bg-red-500";
    if (pendingCount > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!online) return "غير متصل";
    if (pendingCount > 0) return `${pendingCount} معلق`;
    return "متصل";
  };

  const getStatusIcon = () => {
    if (!online) return <WifiOff className="h-3 w-3" />;
    if (pendingCount > 0) return <Clock className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Badge
            variant="secondary"
            className={`${getStatusColor()} text-white hover:opacity-80 cursor-pointer transition-opacity`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
          </Badge>
        </DialogTrigger>

        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {online ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              حالة الاتصال
            </DialogTitle>
            <DialogDescription>
              معلومات تفصيلية حول حالة الاتصال والمزامنة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Connection Status */}
            <Alert
              className={
                online
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              {online ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={online ? "text-green-700" : "text-red-700"}
              >
                {online ? "متصل بالإنترنت" : "غير متصل بالإنترنت"}
              </AlertDescription>
            </Alert>

            {/* Pending Operations */}
            {pendingCount > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  يوجد {pendingCount} عملية في انتظار المزامنة مع الخادم
                </AlertDescription>
              </Alert>
            )}

            {/* Offline Mode Info */}
            {!online && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  يعمل التطبيق في وضع الأوف لاين. جميع العمليات ستتم محلياً
                  وسيتم مزامنت��ا عند عودة الاتصال.
                </AlertDescription>
              </Alert>
            )}

            {/* Last Sync */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-1">
                آخر مزامنة:
              </h4>
              <p className="text-sm text-gray-600">
                {formatSyncTime(lastSync)}
              </p>
            </div>

            {/* Sync Button */}
            {online && (
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
                variant="outline"
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 ml-2" />
                )}
                {syncing ? "جاري المزامنة..." : "مزامنة البيانات"}
              </Button>
            )}

            {/* Features Available Offline */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                الميزات المتاحة بدون إنترنت:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• إضافة وتعديل المشتركين</li>
                <li>• إدارة المخزون والمنتجات</li>
                <li>• تسجيل عمليات البيع</li>
                <li>• عرض البيانات المحفوظة محلياً</li>
                <li>• البحث في البيانات</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compact indicator for pending operations */}
      {pendingCount > 0 && (
        <Badge variant="outline" className="text-xs text-yellow-600">
          <Clock className="h-3 w-3 ml-1" />
          {pendingCount}
        </Badge>
      )}
    </div>
  );
}
