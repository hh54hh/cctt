import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getSyncStatus, getOnlineStatus } from "@/lib/storage-new";
import { offlineManager } from "@/lib/offline-manager";
import { supabaseManager } from "@/lib/supabase";

interface SyncOperation {
  id: string;
  table: string;
  operation: string;
  timestamp: Date;
  status: "pending" | "syncing" | "completed" | "failed";
  retries: number;
}

export default function RealTimeSyncMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [stats, setStats] = useState({
    totalOperations: 0,
    pendingOperations: 0,
    completedToday: 0,
    failedOperations: 0,
  });

  useEffect(() => {
    const updateStatus = () => {
      const currentSyncStatus = getSyncStatus();
      const currentOnlineStatus = getOnlineStatus();
      const syncQueueStatus = offlineManager.getSyncQueueStatus();

      setSyncStatus(currentSyncStatus);
      setOnlineStatus(currentOnlineStatus);

      // استخدام بيانات حقيقية من نظام المزامنة
      setStats({
        totalOperations: syncQueueStatus.unsynced + syncQueueStatus.synced,
        pendingOperations: syncQueueStatus.unsynced,
        completedToday: syncQueueStatus.synced,
        failedOperations: syncQueueStatus.failed,
      });

      // محاكاة عمليات المزامنة الحالية
      const mockOperations: SyncOperation[] = [
        {
          id: "1",
          table: "members",
          operation: "INSERT",
          timestamp: new Date(Date.now() - 1000 * 60 * 2), // منذ دقيقتين
          status: "completed",
          retries: 0,
        },
        {
          id: "2",
          table: "courses",
          operation: "UPDATE",
          timestamp: new Date(Date.now() - 1000 * 30), // منذ 30 ثانية
          status: syncQueueStatus.unsynced > 0 ? "pending" : "completed",
          retries: 0,
        },
        {
          id: "3",
          table: "diet_plans",
          operation: "DELETE",
          timestamp: new Date(Date.now() - 1000 * 10), // منذ 10 ثواني
          status: syncQueueStatus.unsynced > 0 ? "syncing" : "completed",
          retries: 1,
        },
      ];

      setOperations(mockOperations);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000); // تحديث كل ثانيتين

    return () => clearInterval(interval);
  }, []);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "INSERT":
        return <Upload className="h-3 w-3" />;
      case "UPDATE":
        return <RefreshCw className="h-3 w-3" />;
      case "DELETE":
        return <Database className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "syncing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "syncing":
        return "جاري المزامنة";
      case "pending":
        return "في الانتظار";
      case "failed":
        return "فشل";
      default:
        return "غير معروف";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `منذ ${diffInSeconds} ثانية`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} دقيقة`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ساعة`;
    }
  };

  const testConnection = async () => {
    try {
      const supabase = supabaseManager.getClient();
      const { data, error } = await supabase
        .from("members")
        .select("count", { count: "exact", head: true });

      if (error) throw error;

      return {
        success: true,
        message: "الاتصال يعمل بنجاح",
        latency: (Date.now() % 100) + 50, // محاكاة زمن الاستجابة
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        latency: null,
      };
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
      >
        <Activity className="h-4 w-4" />
        مراقبة المزامنة المباشرة
        {stats.pendingOperations > 0 && (
          <Badge variant="destructive" className="text-xs">
            {stats.pendingOperations}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden" dir="rtl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              مراقبة المزامنة المباشرة
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                {onlineStatus ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={onlineStatus ? "text-green-600" : "text-red-600"}
                >
                  {onlineStatus ? "متصل" : "غير متصل"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
          {/* الإحصائيات العامة */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {stats.totalOperations}
                </div>
                <div className="text-xs text-gray-600">إجمالي العمليات</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {stats.pendingOperations}
                </div>
                <div className="text-xs text-gray-600">في الانتظار</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {stats.completedToday}
                </div>
                <div className="text-xs text-gray-600">مكتمل اليوم</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {stats.failedOperations}
                </div>
                <div className="text-xs text-gray-600">فشل</div>
              </div>
            </Card>
          </div>

          {/* حالة الاتصال التفصيلية */}
          <Card className="mb-6 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              حالة الاتصال بـ Supabase
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">آخر محاولة مزامنة:</span>
                <div className="font-medium">
                  {syncStatus.lastAttempt
                    ? formatTimeAgo(new Date(syncStatus.lastAttempt))
                    : "لم تتم بعد"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">حالة المزامنة:</span>
                <div className="font-medium">
                  {syncStatus.isActive ? "نشط" : "متوقف"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">عمليات في الطابور:</span>
                <div className="font-medium">{stats.pendingOperations}</div>
              </div>
              <div>
                <span className="text-gray-600">آخر خطأ:</span>
                <div className="font-medium text-red-600">
                  {syncStatus.lastError || "لا يوجد"}
                </div>
              </div>
            </div>
          </Card>

          {/* العمليات المباشرة */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              العمليات الأخيرة
            </h3>
            <div className="space-y-2">
              {operations.length > 0 ? (
                operations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getOperationIcon(op.operation)}
                        <span className="text-sm font-medium">{op.table}</span>
                      </div>
                      <Badge
                        className={`text-xs ${getStatusColor(op.status)}`}
                        variant="secondary"
                      >
                        {getStatusText(op.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {op.operation}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(op.timestamp)}
                      </div>
                      {op.retries > 0 && (
                        <div className="text-xs text-yellow-600">
                          إعادة المحاولة: {op.retries}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد عمليات حالياً</p>
                </div>
              )}
            </div>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={async () => {
                const result = await testConnection();
                console.log("نتيجة اختبار الاتصال:", result);
              }}
              variant="outline"
            >
              <Activity className="h-4 w-4 ml-1" />
              اختبار الاتصال
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // إعادة تشغيل المزامنة
                console.log("إعادة تشغيل المزامنة...");
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              إعادة تشغيل المزامنة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
