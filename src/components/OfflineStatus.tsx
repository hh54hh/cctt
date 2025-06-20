import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showOfflineAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 lg:left-80">
      <Alert className="border-warning bg-warning/10">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            وضع عدم الاتصال - سيتم حفظ التغييرات محلياً وتزامنها عند عودة
            الإنترنت
          </span>
          {isOnline && (
            <div className="flex items-center gap-2 text-success">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">متصل</span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
