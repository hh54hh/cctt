import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOnlineStatus, useSyncStatus } from "@/lib/offline-manager";
import { CheckCircle, WifiOff, Cloud, AlertTriangle } from "lucide-react";

export default function ConnectionNotifications() {
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [prevUnsynced, setPrevUnsynced] = useState(0);

  // Handle online/offline notifications
  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success("تم الاتصال بالإنترنت", {
        description: "سيتم مزامنة البيانات تلقائياً",
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 3000,
      });
      setWasOffline(false);
    } else if (!isOnline && !wasOffline) {
      toast.warning("انقطع الاتصال بالإنترنت", {
        description: "البيانات ستحفظ محلياً وتتم المزامنة لاحقاً",
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      });
      setWasOffline(true);
    }
  }, [isOnline, wasOffline]);

  // Handle sync completion notifications
  useEffect(() => {
    if (
      prevUnsynced > 0 &&
      syncStatus.unsynced === 0 &&
      !syncStatus.inProgress
    ) {
      toast.success("تمت المزامنة بنجاح", {
        description: `تم مزامنة ${prevUnsynced} عملية مع السحابة`,
        icon: <Cloud className="h-4 w-4" />,
        duration: 3000,
      });
    }

    setPrevUnsynced(syncStatus.unsynced);
  }, [syncStatus.unsynced, syncStatus.inProgress, prevUnsynced]);

  // Handle sync errors (if we can detect them)
  useEffect(() => {
    if (isOnline && syncStatus.unsynced > 10) {
      // If we have too many unsynced items while online, there might be an issue
      toast.error("مشكلة في المزامنة", {
        description: "تأكد من الاتصال وحاول المزامنة اليدوية",
        icon: <AlertTriangle className="h-4 w-4" />,
        duration: 8000,
      });
    }
  }, [isOnline, syncStatus.unsynced]);

  return null; // This component only shows toasts
}
