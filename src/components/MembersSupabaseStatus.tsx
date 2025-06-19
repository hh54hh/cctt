import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Cloud,
  CloudOff,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabaseManager } from "@/lib/supabase";
import { getMembers, getOnlineStatus, getSyncStatus } from "@/lib/storage-new";

interface StatusInfo {
  isOnline: boolean;
  supabaseConnected: boolean;
  localCount: number;
  supabaseCount: number;
  lastSync: Date | null;
  syncPending: number;
  error?: string;
}

export default function MembersSupabaseStatus() {
  const [status, setStatus] = useState<StatusInfo>({
    isOnline: false,
    supabaseConnected: false,
    localCount: 0,
    supabaseCount: 0,
    lastSync: null,
    syncPending: 0,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      // فحص الاتصال بالإنترنت
      const isOnline = getOnlineStatus();

      // فحص عدد الأعضاء محلياً
      const localMembers = await getMembers();
      const localCount = localMembers.length;

      // فحص حالة المزامنة
      const syncStatus = getSyncStatus();

      let supabaseConnected = false;
      let supabaseCount = 0;
      let error = undefined;

      if (isOnline) {
        try {
          const supabase = supabaseManager.getClient();
          const {
            data,
            error: supabaseError,
            count,
          } = await supabase
            .from("members")
            .select("*", { count: "exact", head: true });

          if (supabaseError) throw supabaseError;

          supabaseConnected = true;
          supabaseCount = count || 0;
        } catch (err) {
          error = err.message;
          supabaseConnected = false;
        }
      }

      setStatus({
        isOnline,
        supabaseConnected,
        localCount,
        supabaseCount,
        lastSync: syncStatus.lastAttempt
          ? new Date(syncStatus.lastAttempt)
          : null,
        syncPending: 0, // يمكن الحصول على هذا من offlineManager
        error,
      });
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        error: err.message,
      }));
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // فحص كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }

    if (!status.isOnline) {
      return <CloudOff className="h-3 w-3 text-red-500" />;
    }

    if (!status.supabaseConnected) {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }

    if (status.localCount !== status.supabaseCount) {
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    }

    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return "غير متصل";
    }

    if (!status.supabaseConnected) {
      return "خطأ في Supabase";
    }

    if (status.localCount !== status.supabaseCount) {
      return "غير متزامن";
    }

    return "متزامن";
  };

  const getStatusColor = () => {
    if (!status.isOnline || !status.supabaseConnected) {
      return "destructive";
    }

    if (status.localCount !== status.supabaseCount) {
      return "secondary";
    }

    return "default";
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "لم يتم";

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440)
      return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusColor()}
              className="flex items-center gap-1"
            >
              {getStatusIcon()}
              <span className="text-xs">Supabase: {getStatusText()}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkStatus}
              disabled={isChecking}
              className="p-1 h-6 w-6"
            >
              <RefreshCw
                className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent align="start" className="max-w-xs" dir="rtl">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>الاتصال بالإنترنت:</span>
              <span
                className={status.isOnline ? "text-green-600" : "text-red-600"}
              >
                {status.isOnline ? "متصل" : "غير متصل"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>اتصال Supabase:</span>
              <span
                className={
                  status.supabaseConnected ? "text-green-600" : "text-red-600"
                }
              >
                {status.supabaseConnected ? "متصل" : "غير متصل"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>الأعضاء محلياً:</span>
              <span>{status.localCount}</span>
            </div>
            <div className="flex justify-between">
              <span>الأعضاء في Supabase:</span>
              <span>{status.supabaseCount}</span>
            </div>
            <div className="flex justify-between">
              <span>آخر مزامنة:</span>
              <span>{formatLastSync(status.lastSync)}</span>
            </div>
            {status.error && (
              <div className="text-red-600 border-t pt-2">
                <div>خطأ: {status.error}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
