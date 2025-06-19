import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from "@/lib/database";

const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for sync completion events
    const handleSyncCompleted = (event: CustomEvent) => {
      const { successful, failed } = event.detail;
      console.log(`📊 مزامنة مكتملة: ${successful} نجح، ${failed} فشل`);
      setPendingChanges(db.getPendingChangesCount());
      const lastSync = localStorage.getItem("last_sync_time");
      setLastSyncTime(lastSync);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(
      "gym-sync-completed",
      handleSyncCompleted as EventListener,
    );

    // Update pending changes count periodically
    const updateStatus = () => {
      setPendingChanges(db.getPendingChangesCount());
      const lastSync = localStorage.getItem("last_sync_time");
      setLastSyncTime(lastSync);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "gym-sync-completed",
        handleSyncCompleted as EventListener,
      );
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;

    setIsLoading(true);
    try {
      if (pendingChanges > 0) {
        await db.forceSyncNow();
      } else {
        // If no pending changes, reload from Supabase
        await db.forceReloadFromSupabase();
      }
      setPendingChanges(0);
      const now = new Date().toISOString();
      localStorage.setItem("last_sync_time", now);
      setLastSyncTime(now);
    } catch (error) {
      console.error("فشلت المزامنة اليدوية:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSyncTime = (timeString: string | null) => {
    if (!timeString) return "لم تتم المزامنة";

    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }

    if (!isOnline) {
      return <CloudOff className="w-4 h-4 text-red-500" />;
    }

    if (pendingChanges > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }

    return <Check className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return "جاري المزامنة...";
    if (!isOnline) return "غير متصل";
    if (pendingChanges > 0) return `${pendingChanges} تغيير في الانتظار`;
    return "متزامن";
  };

  const getStatusColor = () => {
    if (isLoading) return "default";
    if (!isOnline) return "destructive";
    if (pendingChanges > 0) return "secondary";
    return "default";
  };

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">حالة المزامنة</span>
                  <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  آخر مزامنة: {formatLastSyncTime(lastSyncTime)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOnline && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleManualSync}
                      disabled={isLoading || pendingChanges === 0}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {pendingChanges > 0
                        ? "رفع التغييرات المعلقة"
                        : "تحديث البيانات من السحابة"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {pendingChanges > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  يوجد {pendingChanges} تغيير لم يتم حفظه في السحابة.
                  {isOnline
                    ? " سيتم المزامنة تلقائياً."
                    : " سيتم المزامنة عند الاتصال بالإنترنت."}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SyncStatus;
