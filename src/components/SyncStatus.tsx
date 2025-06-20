import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  processSyncQueue,
  pullFromSupabase,
  isOnline,
} from "@/lib/syncService";
import { db } from "@/lib/database";
import { toast } from "sonner";

interface SyncStatusProps {
  compact?: boolean;
}

export default function SyncStatus({ compact = false }: SyncStatusProps) {
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnlineState(isOnline());
      if (isOnline()) {
        // Auto-sync when coming back online
        handleSync();
      }
    };

    const updateUnsyncedCount = async () => {
      try {
        const count = await db.syncQueue.count();
        setUnsyncedCount(count);
      } catch (error) {
        console.error("Error getting unsynced count:", error);
        setUnsyncedCount(0);
      }
    };

    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Update unsynced count every 10 seconds
    const interval = setInterval(updateUnsyncedCount, 10000);
    updateUnsyncedCount(); // Initial check

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline()) {
      toast.error("لا يوجد اتصال بالإنترنت");
      return;
    }

    setIsSyncing(true);
    try {
      const initialCount = await db.syncQueue.count();

      // Process sync queue and pull from Supabase
      await Promise.all([processSyncQueue(), pullFromSupabase()]);

      const finalCount = await db.syncQueue.count();
      const syncedCount = initialCount - finalCount;

      setLastSyncTime(new Date());
      setUnsyncedCount(finalCount);

      if (syncedCount > 0) {
        toast.success(`تم مزامنة ${syncedCount} عنصر مع سوبربيس بنجاح`);
      } else if (initialCount === 0) {
        toast.info("جميع البيانات متزامنة مع سوبربيس");
      } else {
        toast.warning(
          "تم محاولة المزامنة، بعض العناصر قد تحتاج لإعادة المحاولة",
        );
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("فشل في مزامنة البيانات مع سوبربيس");
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnlineState) {
      return <CloudOff className="w-4 h-4 text-destructive" />;
    }
    if (isSyncing) {
      return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
    }
    if (unsyncedCount > 0) {
      return <Clock className="w-4 h-4 text-warning" />;
    }
    return <CheckCircle className="w-4 h-4 text-success" />;
  };

  const getStatusText = () => {
    if (!isOnlineState) return "غير متصل";
    if (isSyncing) return "جاري المزامنة مع سوبربيس...";
    if (unsyncedCount > 0) return `${unsyncedCount} غير متزامن`;
    return "متزامن مع سوبربيس";
  };

  const getStatusColor = () => {
    if (!isOnlineState) return "destructive";
    if (isSyncing) return "default";
    if (unsyncedCount > 0) return "secondary";
    return "default";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {unsyncedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unsyncedCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{getStatusText()}</p>
              {lastSyncTime && (
                <p className="text-xs text-muted-foreground">
                  آخر مزامنة:{" "}
                  {lastSyncTime.toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  سيتم المزامنة عند عودة الاتصال
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">{getStatusText()}</span>
          </div>
          <Badge variant={getStatusColor()} className="text-xs">
            {isOnlineState ? "متصل" : "غير متصل"}
          </Badge>
        </div>

        {unsyncedCount > 0 && (
          <div className="mb-3 p-2 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">
                {unsyncedCount} عنصر بحاجة للمزامنة
              </span>
            </div>
          </div>
        )}

        {lastSyncTime && (
          <div className="text-xs text-muted-foreground mb-3">
            آخر مزامنة:{" "}
            {lastSyncTime.toLocaleDateString("ar-EG", {
              month: "short",
              day: "numeric",
            })}{" "}
            {lastSyncTime.toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        <Button
          size="sm"
          onClick={handleSync}
          disabled={!isOnlineState || isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              جاري المزامنة مع سوبربيس...
            </>
          ) : (
            <>
              <Cloud className="w-3 h-3 mr-2" />
              مزامنة مع سوبربيس
            </>
          )}
        </Button>

        {!isOnlineState && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            سيتم المزامنة مع سوبربيس عند عودة الاتصال
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Sync indicator for individual items
interface SyncIndicatorProps {
  synced: boolean;
  size?: "sm" | "md";
}

export function SyncIndicator({ synced, size = "sm" }: SyncIndicatorProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {synced ? (
            <CheckCircle className={`${iconSize} text-success`} />
          ) : (
            <Clock className={`${iconSize} text-warning`} />
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {synced ? "متزامن ✅" : "بانتظار المزامنة ⏳"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
