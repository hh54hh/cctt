import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Users,
  GraduationCap,
  Apple,
  Package,
  ShoppingCart,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { supabaseManager } from "@/lib/supabase";
import {
  getMembers,
  getCourses,
  getDietPlans,
  getProducts,
  getSales,
  getOnlineStatus,
  getSyncStatus,
} from "@/lib/storage-new";
import { offlineManager } from "@/lib/offline-manager";
import { syncManager } from "@/lib/sync-manager";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  details?: any;
  icon?: React.ReactNode;
}

interface TableDiagnostic {
  table: string;
  localCount: number;
  cloudCount: number;
  synced: boolean;
  lastSync?: Date;
  pendingOperations: number;
  icon: React.ReactNode;
}

export default function SupabaseStorageDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [tableStatus, setTableStatus] = useState<TableDiagnostic[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    errors: 0,
    warnings: 0,
  });
  const { toast } = useToast();

  const icons = {
    members: <Users className="h-4 w-4" />,
    courses: <GraduationCap className="h-4 w-4" />,
    diet_plans: <Apple className="h-4 w-4" />,
    products: <Package className="h-4 w-4" />,
    sales: <ShoppingCart className="h-4 w-4" />,
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setTableStatus([]);

    const diagnosticResults: DiagnosticResult[] = [];
    const tables: TableDiagnostic[] = [];

    try {
      // 1. فحص الاتصال بالإنترنت
      setProgress(10);
      const onlineStatus = getOnlineStatus();
      diagnosticResults.push({
        name: "حالة الاتصال بالإنترنت",
        status: onlineStatus ? "success" : "error",
        message: onlineStatus ? "متصل بالإنترنت" : "غير متصل بالإنترنت",
        icon: onlineStatus ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        ),
      });

      // 2. فحص اتصال Supabase
      setProgress(20);
      try {
        const supabase = supabaseManager.getClient();
        const { data, error } = await supabase
          .from("members")
          .select("count", { count: "exact", head: true });

        if (error) throw error;

        diagnosticResults.push({
          name: "اتصال Supabase",
          status: "success",
          message: "الاتصال بـ Supabase يعمل بنجاح",
          icon: <Cloud className="h-4 w-4" />,
        });
      } catch (error) {
        diagnosticResults.push({
          name: "اتصال Supabase",
          status: "error",
          message: `خطأ في الاتصال: ${error.message}`,
          details: error,
          icon: <XCircle className="h-4 w-4" />,
        });
      }

      // 3. فحص قاعدة البيانات المحلية
      setProgress(30);
      try {
        const localMembers = await getMembers();
        diagnosticResults.push({
          name: "قاعدة البيانات المحلية",
          status: "success",
          message: "قاعدة البيانات المحلية تعمل بنجاح",
          details: { memberCount: localMembers.length },
          icon: <HardDrive className="h-4 w-4" />,
        });
      } catch (error) {
        diagnosticResults.push({
          name: "قاعدة البيانات المحلية",
          status: "error",
          message: `خطأ في قاعدة البيانات المحلية: ${error.message}`,
          details: error,
          icon: <XCircle className="h-4 w-4" />,
        });
      }

      // 4. فحص كل جدول بالتفصيل
      const tablesToCheck = [
        { name: "members", localGetter: getMembers, displayName: "الأعضاء" },
        { name: "courses", localGetter: getCourses, displayName: "الكورسات" },
        {
          name: "diet_plans",
          localGetter: getDietPlans,
          displayName: "الخطط الغذائية",
        },
        { name: "products", localGetter: getProducts, displayName: "المنتجات" },
        { name: "sales", localGetter: getSales, displayName: "المبيعات" },
      ];

      for (let i = 0; i < tablesToCheck.length; i++) {
        const table = tablesToCheck[i];
        setProgress(40 + i * 10);

        try {
          // عدد البيانات المحلية
          const localData = await table.localGetter();
          const localCount = localData.length;

          // عدد البيانات السحابية
          let cloudCount = 0;
          let cloudError = null;

          if (onlineStatus) {
            try {
              const supabase = supabaseManager.getClient();
              const { count, error } = await supabase
                .from(table.name)
                .select("*", { count: "exact", head: true });

              if (error) throw error;
              cloudCount = count || 0;
            } catch (error) {
              cloudError = error;
            }
          }

          // حالة المزامنة
          const syncStatus = getSyncStatus();
          const pendingOps = offlineManager.getPendingOperationsCount();

          const tableDiagnostic: TableDiagnostic = {
            table: table.displayName,
            localCount,
            cloudCount,
            synced: localCount === cloudCount && !cloudError,
            pendingOperations: pendingOps,
            icon: icons[table.name] || <Database className="h-4 w-4" />,
          };

          tables.push(tableDiagnostic);

          // النتيجة التفصيلية لكل جدول
          const status = cloudError
            ? "error"
            : localCount === cloudCount
              ? "success"
              : "warning";

          diagnosticResults.push({
            name: `جدول ${table.displayName}`,
            status,
            message: cloudError
              ? `خطأ في المزامنة: ${cloudError.message}`
              : localCount === cloudCount
                ? `متزامن بنجاح (${localCount} عنصر)`
                : `غير متزامن - محلي: ${localCount}، سحابي: ${cloudCount}`,
            details: {
              local: localCount,
              cloud: cloudCount,
              error: cloudError,
              pending: pendingOps,
            },
            icon: tableDiagnostic.icon,
          });
        } catch (error) {
          diagnosticResults.push({
            name: `جدول ${table.displayName}`,
            status: "error",
            message: `خطأ في فحص الجدول: ${error.message}`,
            details: error,
            icon: <XCircle className="h-4 w-4" />,
          });
        }
      }

      // 5. فحص حالة المزامنة العامة
      setProgress(90);
      const syncStatus = getSyncStatus();
      const pendingOpsTotal = offlineManager.getPendingOperationsCount();

      diagnosticResults.push({
        name: "حالة المزامنة العامة",
        status: pendingOpsTotal === 0 ? "success" : "warning",
        message:
          pendingOpsTotal === 0
            ? "جميع العمليات متزامنة"
            : `${pendingOpsTotal} عملية في انتظار المزامنة`,
        details: { pending: pendingOpsTotal, status: syncStatus },
        icon: <RefreshCw className="h-4 w-4" />,
      });

      // 6. فحص أداء النظام
      setProgress(95);
      const performanceInfo = {
        onlineStatus: getOnlineStatus(),
        syncQueueSize: pendingOpsTotal,
        lastSyncAttempt: syncStatus.lastAttempt,
        isAutoSyncActive: true,
      };

      diagnosticResults.push({
        name: "أداء النظام",
        status: "info",
        message: "معلومات الأداء",
        details: performanceInfo,
        icon: <Activity className="h-4 w-4" />,
      });

      setProgress(100);

      // حساب الملخص
      const summary = {
        total: diagnosticResults.length,
        success: diagnosticResults.filter((r) => r.status === "success").length,
        errors: diagnosticResults.filter((r) => r.status === "error").length,
        warnings: diagnosticResults.filter((r) => r.status === "warning")
          .length,
      };

      setResults(diagnosticResults);
      setTableStatus(tables);
      setSummary(summary);

      toast({
        title: "تم التشخيص بنجاح",
        description: `${summary.success} نجح، ${summary.errors} خطأ، ${summary.warnings} تحذير`,
        variant: summary.errors > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "خطأ في التشخيص",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "info":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "info":
        return <Database className="h-4 w-4 text-blue-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const forceSyncAll = async () => {
    try {
      await syncManager.performFullSync();
      toast({
        title: "تمت المزامنة",
        description: "تم إجراء مزامنة شاملة للبيانات",
        variant: "default",
      });
      // إعادة تشغيل التشخيص
      runDiagnostics();
    } catch (error) {
      toast({
        title: "خطأ في المزامنة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
      >
        <Database className="h-4 w-4" />
        تشخيص Supabase الشامل
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                تشخيص Supabase الشامل
              </CardTitle>
              <CardDescription>
                فحص شامل لجميع عمليات التخزين والمزامنة مع قاعدة البيانات
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isRunning && results.length > 0 && (
                <Button size="sm" onClick={forceSyncAll} variant="outline">
                  <RefreshCw className="h-4 w-4 ml-1" />
                  إجراء مزامنة شاملة
                </Button>
              )}
              <Button
                size="sm"
                onClick={runDiagnostics}
                disabled={isRunning}
                variant={results.length === 0 ? "default" : "outline"}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Database className="h-4 w-4 ml-1" />
                )}
                {isRunning ? "جاري التشخيص..." : "بدء التشخيص"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>

          {isRunning && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">
                جاري التشخيص... {progress}%
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <ScrollArea className="h-[60vh]">
            {results.length > 0 && (
              <>
                {/* الملخص العام */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.total}
                      </div>
                      <div className="text-sm text-gray-600">
                        إجمالي الفحوصات
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.success}
                      </div>
                      <div className="text-sm text-gray-600">نجح</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.errors}
                      </div>
                      <div className="text-sm text-gray-600">أخطاء</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary.warnings}
                      </div>
                      <div className="text-sm text-gray-600">تحذيرات</div>
                    </div>
                  </Card>
                </div>

                {/* حالة الجداول */}
                {tableStatus.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">حالة الجداول</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tableStatus.map((table, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {table.icon}
                              <span className="font-medium">{table.table}</span>
                            </div>
                            <Badge
                              variant={table.synced ? "default" : "destructive"}
                            >
                              {table.synced ? "متزامن" : "غير متزامن"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>محلي: {table.localCount} عنصر</div>
                            <div>سحابي: {table.cloudCount} عنصر</div>
                            {table.pendingOperations > 0 && (
                              <div className="text-yellow-600">
                                عمليات معلقة: {table.pendingOperations}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* النتائج التفصيلية */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    نتائج التشخيص التفصيلية
                  </h3>
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {result.icon || getStatusIcon(result.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{result.name}</span>
                              <Badge className={getStatusColor(result.status)}>
                                {result.status === "success" && "نجح"}
                                {result.status === "error" && "خطأ"}
                                {result.status === "warning" && "تحذير"}
                                {result.status === "info" && "معلومات"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {result.message}
                            </p>
                            {result.details && (
                              <details className="text-xs text-gray-500">
                                <summary className="cursor-pointer hover:text-gray-700">
                                  عرض التفاصيل
                                </summary>
                                <pre
                                  className="mt-2 p-2 bg-gray-50 rounded text-left"
                                  dir="ltr"
                                >
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {results.length === 0 && !isRunning && (
              <div className="text-center text-gray-500 py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>اضغط على "بدء التشخيص" لفحص حالة التخزين والمزامنة</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
