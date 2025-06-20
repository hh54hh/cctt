import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Download, X, Smartphone, Monitor } from "lucide-react";
import { usePWA } from "@/lib/pwa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

export function InstallBanner() {
  const {
    canInstall,
    isInstalled,
    install,
    getInstallInstructions,
    getDeviceInfo,
  } = usePWA();

  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem("install-banner-dismissed") === "true",
  );
  const [showInstructions, setShowInstructions] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("install-banner-dismissed", "true");
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsDismissed(true);
    } else {
      // إذا فشل التثبيت التلقائي، اعرض التعليمات
      setShowInstructions(true);
    }
  };

  const deviceInfo = getDeviceInfo();
  const instructions = getInstallInstructions();

  // لا تظهر البانر إذا كان التطبيق مثبت أو تم تجاهله
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 md:left-auto shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {deviceInfo.isMobile ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : (
                <Monitor className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                🏋️ تثبيت صالة حسام جم
              </p>
              <p className="text-xs text-blue-700">
                تطبيق سطح مكتب يعمل بدون إنترنت مع مزامنة تلقائية
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
              >
                <Download className="h-3 w-3 mr-1" />
                تثبيت
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInstructions(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                كيف؟
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة تعليمات التثبيت */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deviceInfo.isMobile ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              {instructions.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                اتبع هذه الخطوات لتثبيت التطبيق:
              </p>
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-xs text-emerald-800">
                <strong>مميزات التطبيق المثبت:</strong>
                <br />
                • يعمل بدون إنترنت 📱
                <br />
                • مزامنة تلقائية 🔄
                <br />
                • إشعارات فورية 🔔
                <br />• أيقونة في سطح المكتب 🏠
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowInstructions(false)}
                className="flex-1"
              >
                فهمت
              </Button>
              {canInstall && (
                <Button
                  onClick={handleInstall}
                  variant="outline"
                  className="flex-1"
                >
                  محاولة التثبيت
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
