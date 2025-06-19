import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  CloudOff,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { quickSupabaseDiagnosis } from "@/lib/supabase-diagnostics";

interface DiagnosticResult {
  category: string;
  status: "success" | "warning" | "error";
  message: string;
  details?: string;
  action?: string;
}

const DiagnosticButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastDiagnostic, setLastDiagnostic] = useState<Date | null>(null);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<
    "success" | "warning" | "error"
  >("success");

  // Quick status check on component mount
  useEffect(() => {
    quickStatusCheck();

    // Update status every 30 seconds
    const interval = setInterval(quickStatusCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickStatusCheck = async () => {
    const isOnline = navigator.onLine;
    const pendingChanges = db.getPendingChangesCount();

    if (!isOnline) {
      setOverallStatus("warning");
    } else if (pendingChanges > 0) {
      setOverallStatus("warning");
    } else {
      // Quick Supabase test
      try {
        const { error } = await supabase
          .from("access_keys")
          .select("id")
          .limit(1);
        setOverallStatus(error ? "error" : "success");
      } catch {
        setOverallStatus("error");
      }
    }
  };

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // 1. Check internet connection
      diagnosticResults.push({
        category: "اتصال الإنترنت",
        status: navigator.onLine ? "success" : "warning",
        message: navigator.onLine ? "متصل بالإنترنت" : "غير متصل بالإنترنت",
        details: navigator.onLine
          ? "الاتصال متوفر للمزامنة مع السحابة"
          : "العمل في الوضع المحلي فقط",
      });

      // 2. Check Supabase connection
      try {
        const start = Date.now();
        const { data, error } = await supabase
          .from("access_keys")
          .select("id")
          .limit(1);
        const responseTime = Date.now() - start;

        if (error) {
          diagnosticResults.push({
            category: "اتصال Supabase",
            status: "error",
            message: "فشل الاتصال بقاعدة البيانات",
            details: `خطأ: ${error.message}`,
            action: "تحقق من إعدادات Supabase أو اتصال الإنترنت",
          });
        } else {
          diagnosticResults.push({
            category: "اتصال Supabase",
            status: responseTime > 3000 ? "warning" : "success",
            message: responseTime > 3000 ? "اتصال بطيء" : "اتصال ناجح",
            details: `زمن الاستجابة: ${responseTime}ms`,
          });
        }
      } catch (err) {
        diagnosticResults.push({
          category: "اتصال Supabase",
          status: "error",
          message: "خطأ في الاتصال",
          details: `${err}`,
          action: "تحقق من إعدادات الشبكة",
        });
      }

      // 3. Check pending changes
      const pendingChanges = db.getPendingChangesCount();
      diagnosticResults.push({
        category: "التغييرات المعلقة",
        status: pendingChanges > 0 ? "warning" : "success",
        message:
          pendingChanges > 0
            ? `${pendingChanges} تغيير في انتظار المزامنة`
            : "جميع التغييرات متزامنة",
        details:
          pendingChanges > 0
            ? "سيتم رفعها عند توفر الاتصال"
            : "لا توجد تغييرات معلقة",
        action:
          pendingChanges > 0
            ? "انتظر المزامنة التلقائية أو اضغط مزامنة يدوية"
            : undefined,
      });

      // 4. Check local storage
      try {
        const localData = {
          subscribers: db.getSubscribers().length,
          products: db.getProducts().length,
          sales: db.getSales().length,
          courses: db.getCoursePoints().length,
          dietItems: db.getDietItems().length,
        };

        const totalRecords = Object.values(localData).reduce(
          (sum, count) => sum + count,
          0,
        );

        diagnosticResults.push({
          category: "البيانات المحلية",
          status: totalRecords > 0 ? "success" : "warning",
          message: `${totalRecords} سجل محفوظ محلياً`,
          details: `مشتركين: ${localData.subscribers}, منتجات: ${localData.products}, مبيعات: ${localData.sales}`,
        });
      } catch (err) {
        diagnosticResults.push({
          category: "البيانات المحلية",
          status: "error",
          message: "خطأ في ق��اءة البيانات المحلية",
          details: `${err}`,
          action: "قد تحتاج لمسح البيانات المحلية وإعادة التحميل",
        });
      }

      // 5. Check browser storage
      try {
        const testKey = "diagnostic_test";
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);

        diagnosticResults.push({
          category: "تخزين المتصفح",
          status: "success",
          message: "يعمل بشكل طبيعي",
          details: "localStorage متاح للكتابة والقراءة",
        });
      } catch (err) {
        diagnosticResults.push({
          category: "تخزين المتصفح",
          status: "error",
          message: "مشكلة في تخزين المتصفح",
          details: "قد يكون localStorage ممتلئ أو محظور",
          action: "امسح بيانات المتصفح أو استخدم وضع التصفح الخاص",
        });
      }

      // 6. Check database tables (if online)
      if (navigator.onLine) {
        try {
          const tables = [
            "subscribers",
            "products",
            "sales",
            "course_points",
            "diet_items",
          ];
          const tableChecks = await Promise.all(
            tables.map(async (table) => {
              try {
                const { data, error } = await supabase
                  .from(table)
                  .select("id")
                  .limit(1);
                return { table, success: !error, error: error?.message };
              } catch (err) {
                return { table, success: false, error: `${err}` };
              }
            }),
          );

          const failedTables = tableChecks.filter((check) => !check.success);

          if (failedTables.length === 0) {
            diagnosticResults.push({
              category: "جداول قاعدة البيانات",
              status: "success",
              message: "جميع الجداول متاحة",
              details: `تم فحص ${tables.length} جداول بنجاح`,
            });
          } else {
            diagnosticResults.push({
              category: "جداول قاعدة البيانات",
              status: "error",
              message: `${failedTables.length} جداول غير متاحة`,
              details: failedTables
                .map((t) => `${t.table}: ${t.error}`)
                .join(", "),
              action: "تحقق من إعداد قاعدة البيانات في Supabase",
            });
          }
        } catch (err) {
          diagnosticResults.push({
            category: "جداول قاعدة البيانات",
            status: "warning",
            message: "لا يمكن فحص الجداول",
            details: "فحص الجداول متاح فقط عند الاتصال بالإنترنت",
          });
        }
      }

      // 7. Performance check
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);
        const usagePercent = (usedMB / limitMB) * 100;

        diagnosticResults.push({
          category: "أداء التطبيق",
          status: usagePercent > 80 ? "warning" : "success",
          message: usagePercent > 80 ? "استخدام ذاكرة عالي" : "أداء طبيعي",
          details: `الذاكرة المستخدمة: ${usedMB}MB من ${limitMB}MB (${usagePercent.toFixed(1)}%)`,
          action:
            usagePercent > 80 ? "أعد تحميل الصفحة لتحرير الذاكرة" : undefined,
        });
      }

      setResults(diagnosticResults);
      setLastDiagnostic(new Date());

      // Determine overall status
      const hasErrors = diagnosticResults.some((r) => r.status === "error");
      const hasWarnings = diagnosticResults.some((r) => r.status === "warning");
      setOverallStatus(
        hasErrors ? "error" : hasWarnings ? "warning" : "success",
      );
    } catch (err) {
      diagnosticResults.push({
        category: "تشخيص عام",
        status: "error",
        message: "خطأ في عملية التشخيص",
        details: `${err}`,
      });
      setResults(diagnosticResults);
      setOverallStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = () => {
    if (isRunning) return <RefreshCw className="w-4 h-4 animate-spin" />;

    switch (overallStatus) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case "success":
        return "bg-green-100 hover:bg-green-200 border-green-300";
      case "warning":
        return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
      case "error":
        return "bg-red-100 hover:bg-red-200 border-red-300";
      default:
        return "bg-gray-100 hover:bg-gray-200";
    }
  };

  const fixIssues = async () => {
    setIsRunning(true);
    try {
      // Try to sync pending changes
      if (navigator.onLine && db.getPendingChangesCount() > 0) {
        await db.syncAllToSupabase();
      }

      // Re-run diagnostic
      await runFullDiagnostic();
    } catch (error) {
      console.error("Error fixing issues:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-diagnostic-button
                className={`fixed bottom-4 left-4 z-50 shadow-lg border-2 ${getStatusColor()}`}
                onClick={() => !isOpen && runFullDiagnostic()}
              >
                {getStatusIcon()}
                <span className="hidden sm:inline mr-2">تشخيص</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>فحص حالة النظام وقاعدة البيانات</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              تشخيص النظام وقاعدة البيانات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div>
                {lastDiagnostic && (
                  <p className="text-sm text-gray-600">
                    آخر فحص: {lastDiagnostic.toLocaleTimeString("ar-EG")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={runFullDiagnostic}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  إعادة الفحص
                </Button>

                {results.some((r) => r.action) && (
                  <Button
                    onClick={fixIssues}
                    disabled={isRunning}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    إصلاح تلقائي
                  </Button>
                )}

                <Button
                  onClick={async () => {
                    setIsRunning(true);
                    try {
                      await quickSupabaseDiagnosis();
                    } finally {
                      setIsRunning(false);
                    }
                  }}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  تشخيص متقدم
                </Button>
              </div>
            </div>

            <Separator />

            {/* Diagnostic Results */}
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card
                    key={index}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        result.status === "success"
                          ? "#10b981"
                          : result.status === "warning"
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {result.status === "success" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {result.status === "warning" && (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        {result.status === "error" && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {result.category}
                        <Badge
                          variant={
                            result.status === "success"
                              ? "default"
                              : result.status === "warning"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {result.message}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {result.details && (
                        <p className="text-sm text-gray-600 mb-2">
                          {result.details}
                        </p>
                      )}
                      {result.action && (
                        <p className="text-sm text-blue-600 font-medium">
                          💡 الحل المقترح: {result.action}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {isRunning ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-gray-600">جاري فحص النظام...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-600">
                      اضغط "إعادة الفحص" لبدء التشخيص
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            {results.length > 0 && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {results.filter((r) => r.status === "success").length}
                    </div>
                    <div className="text-sm text-gray-600">نجح</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {results.filter((r) => r.status === "warning").length}
                    </div>
                    <div className="text-sm text-gray-600">تحذير</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {results.filter((r) => r.status === "error").length}
                    </div>
                    <div className="text-sm text-gray-600">خطأ</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default DiagnosticButton;
