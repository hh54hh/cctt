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
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  StopCircle,
  Zap,
  CheckCircle,
  Eye,
} from "lucide-react";
import {
  getOperationStatus,
  clearAllOperations,
} from "../lib/memberStorageWithRelationshipsFixed";

export default function InfiniteLoopMonitor() {
  const [status, setStatus] = useState<{
    ongoingOperations: string[];
    recentlySaved: [string, number][];
    operationCount: number;
  }>({
    ongoingOperations: [],
    recentlySaved: [],
    operationCount: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [hasInfiniteLoop, setHasInfiniteLoop] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const updateStatus = () => {
      try {
        const currentStatus = getOperationStatus();
        setStatus(currentStatus);

        // Detect potential infinite loop
        const isInfiniteLoop = currentStatus.operationCount > alertThreshold;
        setHasInfiniteLoop(isInfiniteLoop);

        if (isInfiniteLoop) {
          console.warn(
            "🚨 Potential infinite loop detected:",
            currentStatus.ongoingOperations,
          );
        }
      } catch (error) {
        console.error("Error getting operation status:", error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, alertThreshold]);

  const handleClearOperations = () => {
    clearAllOperations();
    setHasInfiniteLoop(false);
    console.log("🧹 Manually cleared all operations");
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getOperationStatusColor = (count: number) => {
    if (count === 0) return "default";
    if (count < 3) return "secondary";
    if (count < alertThreshold) return "outline";
    return "destructive";
  };

  const getOperationStatusIcon = (count: number) => {
    if (count === 0) return <CheckCircle className="h-3 w-3" />;
    if (count < alertThreshold) return <Activity className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            مراقب الحلقات اللا نهائية
          </CardTitle>
          <CardDescription>
            مراقبة العمليات المتكررة ومنع الحلقات اللا نهائية في حفظ البيانات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Critical Alert */}
          {hasInfiniteLoop && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                🚨 تم اكتشاف حلقة لا نهائية! {status.operationCount} عملية قيد
                التشغيل في نفس الوقت. يرجى إيقافها فوراً.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">العمليات الجارية</span>
                <Badge
                  variant={getOperationStatusColor(status.operationCount)}
                  className="w-fit"
                >
                  {getOperationStatusIcon(status.operationCount)}
                  <span className="mr-1">{status.operationCount}</span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">المراقبة</span>
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <StopCircle className="h-3 w-3 mr-1" />
                  )}
                  {isMonitoring ? "نشطة" : "متوقفة"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">عتبة التنبيه</span>
                <span className="font-medium">{alertThreshold} عملية</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleClearOperations}
              variant="destructive"
              disabled={status.operationCount === 0}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              إيقاف جميع العمليات
            </Button>

            {isMonitoring ? (
              <Button
                onClick={handleStopMonitoring}
                variant="outline"
                className="w-full"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                إيقاف المراقبة
              </Button>
            ) : (
              <Button
                onClick={handleStartMonitoring}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                تشغيل المراقبة
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تحميل الصفحة
            </Button>
          </div>

          {/* Ongoing Operations */}
          {status.ongoingOperations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">العمليات الجارية:</h3>
              <div className="space-y-1">
                {status.ongoingOperations.map((operation, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm"
                  >
                    <Activity className="h-3 w-3 text-red-500" />
                    <span>{operation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Saved */}
          {status.recentlySaved.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">تم حفظها مؤخراً:</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {status.recentlySaved.map(([memberId, timestamp], index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <span>عضو: {memberId}</span>
                    <span className="text-gray-500">
                      {formatTimestamp(timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 كيفية التعامل مع الحلقات اللا نهائية:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>
                إذا رأيت أكثر من {alertThreshold} عمليات، اضغط "إيقاف جميع
                العمليات"
              </li>
              <li>إذا استمرت المشكلة، أعد تحميل الصفحة</li>
              <li>تجنب الحفظ المتكرر للعضو نفسه في فترة قصيرة</li>
              <li>يمكنك إيقاف المراقبة إذا كانت تؤثر على الأداء</li>
            </ol>
          </div>

          {/* Threshold Control */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">عتبة التنبيه:</span>
            <div className="flex gap-2">
              {[3, 5, 7, 10].map((threshold) => (
                <Button
                  key={threshold}
                  onClick={() => setAlertThreshold(threshold)}
                  variant={alertThreshold === threshold ? "default" : "outline"}
                  size="sm"
                >
                  {threshold}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
