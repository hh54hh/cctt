import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Cloud,
} from "lucide-react";
import { useOnlineStatus, useSyncStatus } from "@/lib/offline-manager";
import { forceSyncNow } from "@/lib/storage-new";
import { checkConnection } from "@/lib/supabase";
import { offlineManager } from "@/lib/offline-manager";

export default function SyncStatusIndicator() {
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();

  // Auto-clear errors after some time
  React.useEffect(() => {
    if (syncStatus.withErrors > 0) {
      const timer = setTimeout(
        () => {
          console.log("Auto-clearing sync errors after timeout");
          offlineManager.clearSyncQueue();
        },
        5 * 60 * 1000,
      ); // Clear errors after 5 minutes

      return () => clearTimeout(timer);
    }
  }, [syncStatus.withErrors]);

  const getStatusColor = () => {
    if (!isOnline) return "bg-red-500";
    if (syncStatus.inProgress) return "bg-yellow-500";
    if (syncStatus.withErrors > 0) return "bg-red-500";
    if (syncStatus.unsynced > 0) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!isOnline) return "غير متصل";
    if (syncStatus.inProgress) return "جاري المزامنة...";
    if (syncStatus.withErrors > 0) return `${syncStatus.withErrors} خطأ`;
    if (syncStatus.unsynced > 0) return `${syncStatus.unsynced} في الانتظار`;
    return "مزامن";
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (syncStatus.inProgress)
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (syncStatus.unsynced > 0) return <AlertCircle className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`${getStatusColor()} text-white border-0 text-xs py-1 px-2 flex items-center gap-1 rounded-full font-medium cursor-default`}
        >
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span>الاتصال: {isOnline ? "متصل" : "غير متصل"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            <span>المزامنة: {syncStatus.inProgress ? "جارية" : "تلقائية"}</span>
          </div>

          {syncStatus.unsynced > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{syncStatus.unsynced} عملية في انتظار المزامنة</span>
            </div>
          )}

          {syncStatus.withErrors > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>{syncStatus.withErrors} خطأ - سيتم المسح تلقائياً</span>
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-2">
            {isOnline
              ? "المزامنة تتم تلقائياً مع السحابة كل 30 ثانية"
              : "البيانات محفوظة محلياً - ستتم المزامنة عند الاتصال"}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
