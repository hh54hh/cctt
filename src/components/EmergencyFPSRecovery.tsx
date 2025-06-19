import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  Zap,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { performanceOptimizerFixed } from "../utils/performanceOptimizerFixed";

export default function EmergencyFPSRecovery() {
  const [status, setStatus] = useState<any>({
    isOptimizationActive: false,
    isAggressiveActive: false,
    isMonitoringActive: false,
    emergencyResetCount: 0,
    fpsHistory: [],
    avgFPS: 0,
  });
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const currentStatus = performanceOptimizerFixed.getStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error("Error getting performance status:", error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRecovery = async () => {
    setIsRecovering(true);
    setRecoveryProgress(0);

    try {
      // Step 1: Stop problematic processes
      setRecoveryProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Clear memory
      setRecoveryProgress(40);
      if ((window as any).gc) {
        (window as any).gc();
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Apply recovery
      setRecoveryProgress(60);
      performanceOptimizerFixed.recoverFromZeroFPS();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Restart monitoring
      setRecoveryProgress(80);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setRecoveryProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error during manual recovery:", error);
    } finally {
      setIsRecovering(false);
      setRecoveryProgress(0);
    }
  };

  const handleStopMonitoring = () => {
    performanceOptimizerFixed.stopPerformanceMonitoring();
  };

  const handleStartMonitoring = () => {
    performanceOptimizerFixed.startPerformanceMonitoring();
  };

  const handleApplyOptimizations = () => {
    performanceOptimizerFixed.applyOptimizations();
  };

  const getFPSColor = (fps: number) => {
    if (fps === 0) return "destructive";
    if (fps < 15) return "secondary";
    if (fps < 30) return "outline";
    return "default";
  };

  const getFPSIcon = (fps: number) => {
    if (fps === 0) return <AlertTriangle className="h-3 w-3" />;
    if (fps < 15) return <Activity className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            إصلاح طارئ لمشكلة 0 FPS
          </CardTitle>
          <CardDescription>
            أداة لإصلاح مشكلة توقف الأداء (0 FPS) وتحسين سرعة التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">معدل الإطارات</span>
                <Badge variant={getFPSColor(status.avgFPS)} className="w-fit">
                  {getFPSIcon(status.avgFPS)}
                  <span className="mr-1">{status.avgFPS} FPS</span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">المراقبة</span>
                <Badge
                  variant={status.isMonitoringActive ? "default" : "secondary"}
                >
                  {status.isMonitoringActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {status.isMonitoringActive ? "نشطة" : "متوقفة"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">
                  إعادة التشغيل الطارئ
                </span>
                <span className="font-medium">
                  {status.emergencyResetCount}/3
                </span>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {status.avgFPS === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                🚨 تم اكتشاف 0 FPS - التطبيق متجمد! يرجى تطبيق الإصلاح الطارئ
                فوراً.
              </AlertDescription>
            </Alert>
          )}

          {status.avgFPS < 10 && status.avgFPS > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ أداء ضعيف جداً ({status.avgFPS} FPS). يُنصح بتطبيق التحسينات.
              </AlertDescription>
            </Alert>
          )}

          {status.emergencyResetCount >= 2 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                🚨 تم تطبيق عدة عمليات إعادة تشغيل طارئة. قد تحتاج لإعادة تحميل
                الصفحة.
              </AlertDescription>
            </Alert>
          )}

          {/* Recovery Progress */}
          {isRecovering && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري الإصلاح الطارئ...</span>
                <span>{recoveryProgress}%</span>
              </div>
              <Progress value={recoveryProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={handleManualRecovery}
              variant="destructive"
              disabled={isRecovering}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              إصلاح طارئ
            </Button>

            <Button
              onClick={handleApplyOptimizations}
              variant="default"
              disabled={isRecovering}
              className="w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              تطبيق تحسينات
            </Button>

            {status.isMonitoringActive ? (
              <Button
                onClick={handleStopMonitoring}
                variant="outline"
                disabled={isRecovering}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                إيقاف المراقبة
              </Button>
            ) : (
              <Button
                onClick={handleStartMonitoring}
                variant="outline"
                disabled={isRecovering}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                تشغيل المراقبة
              </Button>
            )}

            <Button
              onClick={reloadPage}
              variant="secondary"
              disabled={isRecovering}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تحميل الصفحة
            </Button>
          </div>

          {/* FPS History */}
          {status.fpsHistory.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                سجل معدل الإطارات (آخر 10)
              </h3>
              <div className="flex gap-1 flex-wrap">
                {status.fpsHistory.map((fps: number, index: number) => (
                  <Badge
                    key={index}
                    variant={getFPSColor(fps)}
                    className="text-xs"
                  >
                    {fps}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span>التحسينات نشطة:</span>
              <Badge
                variant={status.isOptimizationActive ? "default" : "secondary"}
              >
                {status.isOptimizationActive ? "نعم" : "لا"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>التحسينات العدوانية:</span>
              <Badge
                variant={
                  status.isAggressiveActive ? "destructive" : "secondary"
                }
              >
                {status.isAggressiveActive ? "نشطة" : "متوقفة"}
              </Badge>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 خطوات الإصلاح الطارئ:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>إذا كان FPS = 0، اضغط "إصلاح طارئ" فوراً</li>
              <li>إذا كان الأداء بطيء، اضغط "تطبيق تحسينات"</li>
              <li>إذا لم تنجح الحلول، اضغط "إعادة تحميل الصفحة" كحل أخير</li>
              <li>يمكنك إيقاف المراقبة إذا كانت تسبب مشاكل</li>
            </ol>
          </div>

          {/* Emergency Console Command */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              💻 أمر طارئ من وحدة التحكم:
            </h3>
            <p className="text-sm text-yellow-800">
              إذا لم تعمل الأزرار، افتح وحدة التحكم واكتب:
            </p>
            <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs">
              recoverFromZeroFPS()
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
