import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "./alert";
import { Wifi, WifiOff, RefreshCw, Bell, CheckCircle } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { usePWA } from "@/lib/pwa";
import { syncService } from "@/lib/sync";

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const count = await syncService.getPendingSyncCount();
      setPendingSyncCount(count);
      setIsSyncing(syncService.isSyncing());

      const lastSync = localStorage.getItem("last_sync_time");
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    };

    updateStatus();

    // Update every 3 seconds
    const interval = setInterval(updateStatus, 3000);

    // Listen for sync completion
    syncService.onSyncComplete(() => {
      updateStatus();
      setIsSyncing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    });

    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncService.forcSync();
  };

  // لا تظهر شيئاً إذا كان كل شيء طبيعي
  if (isOnline && pendingSyncCount === 0 && !showSuccess) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-lg">
      {!isOnline ? (
        <Alert className="bg-red-50 border-red-200 shadow-lg">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">🔴 غير متصل بالإنترنت</div>
                <div className="text-xs mt-1">
                  التطبيق يعمل في وضع عدم الاتصال
                  {pendingSyncCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingSyncCount} معلقة
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-red-600">
                {lastSyncTime && (
                  <div>
                    آخر مزامنة:
                    <br />
                    {lastSyncTime.toLocaleTimeString("ar-SA")}
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : showSuccess ? (
        <Alert className="bg-green-50 border-green-200 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">✅ تم التحديث بنجاح</div>
                <div className="text-xs mt-1">جميع البيانات محدثة ومتزامنة</div>
              </div>
              <Bell className="h-4 w-4 text-green-600" />
            </div>
          </AlertDescription>
        </Alert>
      ) : pendingSyncCount > 0 ? (
        <Alert className="bg-yellow-50 border-yellow-200 shadow-lg">
          <RefreshCw
            className={`h-4 w-4 text-yellow-600 ${isSyncing ? "animate-spin" : ""}`}
          />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {isSyncing ? "🔄 جاري المزامنة..." : "⏳ في انتظار المزامنة"}
                </div>
                <div className="text-xs mt-1">
                  {isSyncing
                    ? "يتم رفع البيانات لقاعدة البيانات"
                    : `${pendingSyncCount} عملية في انتظار المزامنة`}
                </div>
              </div>
              {!isSyncing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  className="h-8 px-3 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  مزامنة فورية
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
