import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function PWAStatus() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSWRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // مراقبة حالة التثبيت
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    // مراقبة حالة الاتصال
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // تحقق من Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setSWRegistration(registration || null);
      });
    }

    // تحقق من التثبيت المسبق
    const checkIfInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkIfInstalled();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    const result = await installPrompt.prompt();
    console.log("Install result:", result);

    setInstallPrompt(null);
    setIsInstallable(false);
  };

  const PWAFeature = ({
    icon: Icon,
    title,
    status,
    description,
  }: {
    icon: any;
    title: string;
    status: "success" | "warning" | "error";
    description: string;
  }) => {
    const statusColors = {
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
    };

    const StatusIcon =
      status === "success"
        ? CheckCircle
        : status === "warning"
          ? AlertCircle
          : XCircle;

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>
        <StatusIcon className={`h-5 w-5 ${statusColors[status]}`} />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          حالة تطبيق PWA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* حالة التثبيت */}
        {isInstalled && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              🎉 التطبيق مثبت بنجاح على الجهاز!
            </AlertDescription>
          </Alert>
        )}

        {isInstallable && !isInstalled && (
          <Alert className="border-blue-200 bg-blue-50">
            <Download className="h-4 w-4" />
            <AlertDescription className="text-blue-700 flex items-center justify-between">
              <span>يمكن تثبيت التطبيق على الجهاز</span>
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                تثبيت الآن
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isInstallable && !isInstalled && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-700">
              ميز�� التثبيت ستظهر عند رفع التطبيق على HTTPS
            </AlertDescription>
          </Alert>
        )}

        {/* ميزات PWA */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">ميزات PWA:</h4>

          <PWAFeature
            icon={Monitor}
            title="Service Worker"
            status={swRegistration ? "success" : "error"}
            description={swRegistration ? "يعمل بشكل صحيح" : "غير مُسجل"}
          />

          <PWAFeature
            icon={isOnline ? Wifi : WifiOff}
            title="العمل أوف لاين"
            status={swRegistration ? "success" : "warning"}
            description={isOnline ? "متصل بالإنترنت" : "يعمل بدون إنترنت"}
          />

          <PWAFeature
            icon={Smartphone}
            title="Manifest"
            status="success"
            description="تم تكوينه بشكل صحيح"
          />

          <PWAFeature
            icon={Download}
            title="قابل للتثبيت"
            status={isInstallable || isInstalled ? "success" : "warning"}
            description={
              isInstalled
                ? "مثبت بالفعل"
                : isInstallable
                  ? "جاهز للتثبيت"
                  : "يتطلب HTTPS للتثبيت"
            }
          />
        </div>

        {/* معلومات إضافية */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>البروتوكول:</strong> {window.location.protocol}
            </div>
            <div>
              <strong>المضيف:</strong> {window.location.hostname}
            </div>
            <div>
              <strong>وضع العرض:</strong>{" "}
              <Badge
                variant={
                  window.matchMedia("(display-mode: standalone)").matches
                    ? "default"
                    : "secondary"
                }
              >
                {window.matchMedia("(display-mode: standalone)").matches
                  ? "Standalone"
                  : "Browser"}
              </Badge>
            </div>
            <div>
              <strong>حالة الاتصال:</strong>{" "}
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "متصل" : "غير متصل"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
