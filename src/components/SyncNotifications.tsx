import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Cloud,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { db } from "@/lib/database";

const SyncNotifications = () => {
  const [lastOnlineStatus, setLastOnlineStatus] = useState(navigator.onLine);
  const [lastPendingCount, setLastPendingCount] = useState(0);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      if (!lastOnlineStatus) {
        toast.success("تم استعادة الاتصال بالإن��رنت", {
          description: "سيتم مزامنة التغييرات المعلقة تلقائياً",
          icon: <Cloud className="w-4 h-4" />,
          duration: 3000,
        });

        // Auto sync will handle this now, but we can trigger immediate sync
        setTimeout(async () => {
          const pendingCount = db.getPendingChangesCount();
          if (pendingCount > 0) {
            try {
              await db.forceSyncNow();
              toast.success(`تم مزامنة ${pendingCount} تغيير بنجاح`, {
                icon: <CheckCircle className="w-4 h-4" />,
                duration: 2000,
              });
            } catch (error) {
              toast.error("فشل في المزامنة", {
                description: "ستتم المزامنة تلقائياً في الخلفية",
                icon: <AlertTriangle className="w-4 h-4" />,
                duration: 4000,
              });
            }
          }
        }, 2000);
      }
      setLastOnlineStatus(true);
    };

    const handleOffline = () => {
      if (lastOnlineStatus) {
        toast.warning("انقطع الاتصال بالإنترنت", {
          description: "سيتم حفظ التغييرات محلياً ومزامنتها لاحقاً",
          icon: <CloudOff className="w-4 h-4" />,
          duration: 4000,
        });
      }
      setLastOnlineStatus(false);
    };

    // Monitor pending changes
    const checkPendingChanges = () => {
      const currentPendingCount = db.getPendingChangesCount();

      // If pending changes increased
      if (currentPendingCount > lastPendingCount && !navigator.onLine) {
        toast.info(`${currentPendingCount} تغيير في انتظار المزامنة`, {
          description: "سيتم رفعها عند استعادة الاتصال",
          icon: <RefreshCw className="w-4 h-4" />,
          duration: 3000,
        });
      }

      setLastPendingCount(currentPendingCount);
    };

    // Set up event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending changes every 30 seconds
    const pendingInterval = setInterval(checkPendingChanges, 30000);

    // Initial check
    checkPendingChanges();

    // Listen for automatic sync completion
    const handleSyncCompleted = (event: CustomEvent) => {
      const { successful, failed } = event.detail;

      if (successful > 0) {
        toast.success(`تمت المزامنة التلقائية`, {
          description: `تم رفع ${successful} تغيير إلى السحابة`,
          icon: <CheckCircle className="w-4 h-4" />,
          duration: 2000,
        });
      }

      if (failed > 0) {
        toast.warning(`مزامنة جزئية`, {
          description: `تم رفع ${successful} تغيير، فشل ${failed} تغيير`,
          icon: <AlertTriangle className="w-4 h-4" />,
          duration: 3000,
        });
      }
    };

    // Listen for direct saves to Supabase
    const handleDirectSave = (event: CustomEvent) => {
      const { table, operation, id } = event.detail;
      const tableNames = {
        subscribers: "المشتركين",
        course_points: "نقاط التمارين",
        diet_items: "عناصر الغذاء",
        groups: "المجموعات",
        group_items: "عناصر المجموعة",
        products: "المنتجات",
        sales: "المبيعات",
        sale_items: "عناصر المبيعات",
      };

      const operationNames = {
        create: "إضافة",
        update: "تحديث",
        delete: "حذف",
      };

      toast.success(`تم حفظ البيانات في السحابة`, {
        description: `${operationNames[operation]} في ${tableNames[table] || table}`,
        icon: <CheckCircle className="w-4 h-4" />,
        duration: 3000,
      });
    };

    // Listen for pending sync
    const handlePendingSync = (event: CustomEvent) => {
      const { table, operation } = event.detail;
      toast.warning(`تم الحفظ محلياً`, {
        description: `سيتم رفعه للسحابة عند استعادة الاتصال`,
        icon: <RefreshCw className="w-4 h-4" />,
        duration: 3000,
      });
    };

    // Listen for offline save
    const handleOfflineSave = (event: CustomEvent) => {
      const { table, operation } = event.detail;
      toast.info(`تم الحفظ محلياً`, {
        description: `سيتم رفعه للسحابة عند الاتصال`,
        icon: <CloudOff className="w-4 h-4" />,
        duration: 3000,
      });
    };

    window.addEventListener(
      "gym-sync-completed",
      handleSyncCompleted as EventListener,
    );
    window.addEventListener(
      "data-saved-to-supabase",
      handleDirectSave as EventListener,
    );
    window.addEventListener(
      "data-pending-sync",
      handlePendingSync as EventListener,
    );
    window.addEventListener(
      "data-saved-offline",
      handleOfflineSave as EventListener,
    );

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "gym-sync-completed",
        handleSyncCompleted as EventListener,
      );
      window.removeEventListener(
        "data-saved-to-supabase",
        handleDirectSave as EventListener,
      );
      window.removeEventListener(
        "data-pending-sync",
        handlePendingSync as EventListener,
      );
      window.removeEventListener(
        "data-saved-offline",
        handleOfflineSave as EventListener,
      );
      clearInterval(pendingInterval);
    };
  }, [lastOnlineStatus, lastPendingCount]);

  // Show notification when sync operations happen
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "last_sync_time" && e.newValue) {
        const pendingCount = db.getPendingChangesCount();

        if (pendingCount === 0) {
          toast.success("تمت المزامنة بنجاح", {
            description: "جميع البيانات محفوظة في السحابة",
            icon: <CheckCircle className="w-4 h-4" />,
            duration: 2000,
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Monitor for database errors
  useEffect(() => {
    const originalError = console.error;

    console.error = (...args) => {
      // Check if it's a database-related error
      const errorMessage = args.join(" ").toLowerCase();

      if (
        errorMessage.includes("supabase") ||
        errorMessage.includes("database") ||
        errorMessage.includes("sync")
      ) {
        toast.error("خطأ في قاعدة البيانات", {
          description: "تحقق من اتصال الإنترنت أو استخدم زر التشخيص",
          icon: <AlertTriangle className="w-4 h-4" />,
          duration: 5000,
          action: {
            label: "تشخيص",
            onClick: () => {
              // Trigger diagnostic button (this could be improved with a global state)
              const diagnosticButton = document.querySelector(
                "[data-diagnostic-button]",
              ) as HTMLButtonElement;
              if (diagnosticButton) {
                diagnosticButton.click();
              }
            },
          },
        });
      }

      // Call original console.error
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SyncNotifications;
