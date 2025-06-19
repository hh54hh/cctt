import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Activity,
  Wifi,
  Cloud,
  HardDrive,
  Settings,
  Info,
  AlertCircle,
  Clock,
} from "lucide-react";
import { checkConnection, supabaseManager, TABLES } from "@/lib/supabase";
import { offlineManager, useSyncStatus } from "@/lib/offline-manager";
import { syncManager } from "@/lib/sync-manager";
import gymDB from "@/lib/database";

interface DiagnosticResult {
  category: string;
  name: string;
  status: "success" | "warning" | "error" | "info";
  message: string;
  details?: string[];
  timestamp: Date;
}

export default function DatabaseDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const syncStatus = useSyncStatus();

  const addResult = (result: Omit<DiagnosticResult, "timestamp">) => {
    setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. فحص الاتصال بالإنترنت
      addResult({
        category: "الشبكة",
        name: "حالة الاتصال بالإنترنت",
        status: navigator.onLine ? "success" : "error",
        message: navigator.onLine ? "متصل بالإنترنت" : "غير متصل بالإنترنت",
      });

      // 2. فحص قاعدة البيانات المحلية
      try {
        await gymDB.init();
        const members = await gymDB.getMembers();
        addResult({
          category: "قاعدة البيانات المحلية",
          name: "IndexedDB",
          status: "success",
          message: `تعمل بشكل طبيعي - ${members.length} عضو محفوظ`,
        });
      } catch (error) {
        addResult({
          category: "قاعدة البيانات المحلية",
          name: "IndexedDB",
          status: "error",
          message: "فشل في الوصول لقاعدة البيانات المحلية",
          details: [error instanceof Error ? error.message : "خطأ غير معروف"],
        });
      }

      // 3. فحص الاتصال بـ Supabase
      try {
        const isConnected = await checkConnection();
        addResult({
          category: "قاعدة البيانات السحابية",
          name: "اتصال Supabase",
          status: isConnected ? "success" : "error",
          message: isConnected
            ? "متصل بـ Supabase بنجاح"
            : "فشل الاتصال بـ Supabase",
        });

        // 4. فحص الجداول إذا كان الاتصال ناجح
        if (isConnected) {
          const tableTests = [
            { name: "الأعضاء", table: TABLES.MEMBERS },
            { name: "الكورسات", table: TABLES.COURSES },
            { name: "الأنظمة الغذائية", table: TABLES.DIET_PLANS },
            { name: "المنتجات", table: TABLES.PRODUCTS },
            { name: "المبيعات", table: TABLES.SALES },
          ];

          for (const test of tableTests) {
            try {
              const data = await supabaseManager.getAll(test.table);
              addResult({
                category: "جداول Supabase",
                name: `جدول ${test.name}`,
                status: "success",
                message: `يعمل بشكل طبيعي - ${data.length} سجل`,
              });
            } catch (error) {
              addResult({
                category: "جداول Supabase",
                name: `جدول ${test.name}`,
                status: "error",
                message: "الجدول غير موجود أو لا يمكن الوصول إليه",
                details: [
                  error instanceof Error ? error.message : "خطأ غير معروف",
                ],
              });
            }
          }

          // 5. فحص عملية الكتابة
          try {
            const testRecord = {
              id: `test-${Date.now()}`,
              name: "اختبار الاتصال",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await supabaseManager.insert(TABLES.COURSES, testRecord);
            await supabaseManager.delete(TABLES.COURSES, testRecord.id);

            addResult({
              category: "عمليات Supabase",
              name: "الكتابة والحذف",
              status: "success",
              message: "عمليات الكتابة والحذف تعمل بشكل طبيعي",
            });
          } catch (error) {
            addResult({
              category: "عمليات Supabase",
              name: "الكتابة والحذف",
              status: "error",
              message: "فشل في عمليات الكتابة أو الحذف",
              details: [
                error instanceof Error ? error.message : "خطأ غير معروف",
              ],
            });
          }
        }
      } catch (error) {
        addResult({
          category: "قاعدة البيانات السحابية",
          name: "اتصال Supabase",
          status: "error",
          message: "خطأ في فحص الاتصال",
          details: [error instanceof Error ? error.message : "خطأ غير معروف"],
        });
      }

      // 6. فحص حالة المزامنة
      addResult({
        category: "المزامنة",
        name: "حالة قائمة الانتظار",
        status:
          syncStatus.withErrors > 0
            ? "error"
            : syncStatus.unsynced > 0
              ? "warning"
              : "success",
        message:
          syncStatus.withErrors > 0
            ? `${syncStatus.withErrors} عملية فشلت في المزامنة`
            : syncStatus.unsynced > 0
              ? `${syncStatus.unsynced} عملية في انتظار المزامنة`
              : "جميع العمليات مزامنة",
        details:
          syncStatus.withErrors > 0
            ? syncStatus.errors.map(
                (err) =>
                  `${err.operation} على ${err.table}: ${err.error} (محاولة ${err.attempts})`,
              )
            : undefined,
      });

      addResult({
        category: "المزامنة",
        name: "حالة العملية",
        status: syncStatus.inProgress ? "info" : "success",
        message: syncStatus.inProgress ? "جاري المزامنة..." : "المزامنة متوقفة",
      });

      if (syncStatus.failed > 0) {
        addResult({
          category: "المزامنة",
          name: "العمليات الفاشلة",
          status: "warning",
          message: `${syncStatus.failed} عملية تحتاج إعادة محاولة`,
        });
      }

      // 7. فحص مساحة التخزين المحلي
      try {
        const estimate = await navigator.storage?.estimate();
        if (estimate) {
          const usedMB = (estimate.usage || 0) / (1024 * 1024);
          const quotaMB = (estimate.quota || 0) / (1024 * 1024);
          const usagePercent = (usedMB / quotaMB) * 100;

          addResult({
            category: "التخزين المحلي",
            name: "مساحة التخزين",
            status: usagePercent > 80 ? "warning" : "success",
            message: `مستخدم ${usedMB.toFixed(1)} ميجا من ${quotaMB.toFixed(1)} ميجا (${usagePercent.toFixed(1)}%)`,
          });
        }
      } catch (error) {
        addResult({
          category: "التخزين المحلي",
          name: "مساحة التخزين",
          status: "info",
          message: "لا يمكن قرا��ة معلومات التخزين",
        });
      }

      // 8. معلومات النظام
      addResult({
        category: "معلومات النظام",
        name: "المتصفح",
        status: "info",
        message: navigator.userAgent.includes("Chrome")
          ? "Chrome"
          : navigator.userAgent.includes("Firefox")
            ? "Firefox"
            : navigator.userAgent.includes("Safari")
              ? "Safari"
              : "متصفح آخر",
      });

      addResult({
        category: "معلومات النظام",
        name: "وقت التشغيل",
        status: "info",
        message: `${Math.round(performance.now() / 1000)} ثانية`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "info":
        return "bg-blue-100 text-blue-800";
    }
  };

  const groupedResults = results.reduce(
    (groups, result) => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
      return groups;
    },
    {} as Record<string, DiagnosticResult[]>,
  );

  const overallStatus =
    results.length === 0
      ? "info"
      : results.some((r) => r.status === "error")
        ? "error"
        : results.some((r) => r.status === "warning")
          ? "warning"
          : "success";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setIsOpen(true)}
        >
          <Activity className="h-4 w-4 mr-2" />
          تشخيص قاعدة البيانات
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            تشخيص قاعدة البيانات والمزامنة
            {results.length > 0 && (
              <Badge className={getStatusColor(overallStatus)}>
                {overallStatus === "success" && "جميع الفحوصات ناجحة"}
                {overallStatus === "warning" && "توجد تحذيرات"}
                {overallStatus === "error" && "توجد أخطاء"}
                {overallStatus === "info" && "جاري الفحص"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Control Panel */}
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              {isRunning ? "جاري الفحص..." : "تشغيل التشخيص الشامل"}
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await syncManager.forceSyncNow();
                  await runDiagnostics();
                } catch (error) {
                  console.error("Force sync failed:", error);
                }
              }}
              disabled={isRunning || !navigator.onLine}
            >
              <Cloud className="h-4 w-4 mr-2" />
              فرض المزامنة
            </Button>

            {syncStatus.withErrors > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  offlineManager.clearSyncQueue();
                  runDiagnostics();
                }}
                disabled={isRunning}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                مسح الأخطاء
              </Button>
            )}
          </div>

          {/* Current Status Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <div className="font-semibold">
                    {navigator.onLine ? "متصل" : "غير متصل"}
                  </div>
                  <div className="text-xs text-gray-500">الإنترنت</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div className="font-semibold">نشط</div>
                  <div className="text-xs text-gray-500">التخزين المحلي</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Cloud className="h-4 w-4" />
                  </div>
                  <div className="font-semibold">
                    {syncStatus.inProgress ? "جاري المزامنة" : "متوقف"}
                  </div>
                  <div className="text-xs text-gray-500">المزامنة</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="font-semibold">{syncStatus.unsynced}</div>
                  <div className="text-xs text-gray-500">غير مزامن</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length === 0 && !isRunning && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                اضغط "تشغيل التشخيص الشامل" لفحص حالة النظام
              </AlertDescription>
            </Alert>
          )}

          {Object.entries(groupedResults).map(([category, categoryResults]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryResults.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusColor(result.status)}
                      >
                        {result.status === "success" && "نجح"}
                        {result.status === "warning" && "تحذير"}
                        {result.status === "error" && "خطأ"}
                        {result.status === "info" && "معلومات"}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-700 mr-6">
                      {result.message}
                    </div>

                    {result.details && (
                      <div className="mr-6 p-2 bg-gray-100 rounded text-xs">
                        {result.details.map((detail, i) => (
                          <div key={i} className="text-red-600">
                            {detail}
                          </div>
                        ))}
                      </div>
                    )}

                    {index < categoryResults.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
