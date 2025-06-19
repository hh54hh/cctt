import { useState, useEffect } from "react";
import { Cloud, CloudOff, AlertTriangle, Wifi, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { db } from "@/lib/database";
import { supabase } from "@/lib/supabase";

const QuickStatusIndicator = () => {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    pendingChanges: number;
    supabaseConnection: "connected" | "disconnected" | "checking";
    lastSyncTime: string | null;
  }>({
    isOnline: navigator.onLine,
    pendingChanges: 0,
    supabaseConnection: "checking",
    lastSyncTime: null,
  });

  useEffect(() => {
    // Update status every 10 seconds
    const updateStatus = async () => {
      const pendingChanges = db.getPendingChangesCount();
      const lastSync = localStorage.getItem("last_sync_time");

      // Quick Supabase check
      let supabaseConnection: "connected" | "disconnected" | "checking" =
        "checking";

      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from("access_keys")
            .select("id")
            .limit(1);
          supabaseConnection = error ? "disconnected" : "connected";
        } catch {
          supabaseConnection = "disconnected";
        }
      } else {
        supabaseConnection = "disconnected";
      }

      setStatus({
        isOnline: navigator.onLine,
        pendingChanges,
        supabaseConnection,
        lastSyncTime: lastSync,
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getConnectionIcon = () => {
    if (!status.isOnline) {
      return <CloudOff className="w-3 h-3 text-red-500" />;
    }

    switch (status.supabaseConnection) {
      case "connected":
        return <Database className="w-3 h-3 text-green-500" />;
      case "disconnected":
        return <Database className="w-3 h-3 text-red-500" />;
      case "checking":
        return <Database className="w-3 h-3 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    if (!status.isOnline || status.supabaseConnection === "disconnected") {
      return "destructive";
    }

    if (status.pendingChanges > 0) {
      return "secondary";
    }

    return "default";
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return "غير متصل";
    }

    if (status.supabaseConnection === "disconnected") {
      return "قاعدة البيانات غير متصلة";
    }

    if (status.pendingChanges > 0) {
      return `${status.pendingChanges} معلق`;
    }

    return "متزامن";
  };

  const getTooltipContent = () => {
    const parts = [];

    // Internet connection
    parts.push(`🌐 الإنترنت: ${status.isOnline ? "متصل" : "غير متصل"}`);

    // Supabase connection
    const dbStatus =
      status.supabaseConnection === "connected"
        ? "متصلة"
        : status.supabaseConnection === "disconnected"
          ? "غير متصلة"
          : "جاري الفحص";
    parts.push(`🗄️ قاعدة البيانات: ${dbStatus}`);

    // Pending changes
    parts.push(`⏳ التغييرات المعلقة: ${status.pendingChanges || "لا توجد"}`);

    // Last sync
    if (status.lastSyncTime) {
      const lastSync = new Date(status.lastSyncTime);
      const timeDiff = Date.now() - lastSync.getTime();
      const minutes = Math.floor(timeDiff / 60000);

      if (minutes < 1) {
        parts.push("🔄 آخر مزامنة: الآن");
      } else if (minutes < 60) {
        parts.push(`🔄 آخر مزامنة: منذ ${minutes} دقيقة`);
      } else {
        const hours = Math.floor(minutes / 60);
        parts.push(`🔄 آخر مزامنة: منذ ${hours} ساعة`);
      }
    } else {
      parts.push("🔄 آخر مزامنة: لم تتم");
    }

    return parts.join("\n");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {getConnectionIcon()}
            <Badge variant={getStatusColor()} className="text-xs px-2 py-1">
              {getStatusText()}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="whitespace-pre-line">
          <div className="text-sm">{getTooltipContent()}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QuickStatusIndicator;
