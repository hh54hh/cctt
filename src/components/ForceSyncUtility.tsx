import React, { useState } from "react";
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
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  getMembers,
  getCourses,
  getDietPlans,
  getProducts,
  getSales,
} from "@/lib/storage-new";
import { supabaseManager } from "@/lib/supabase";
import { syncManager } from "@/lib/sync-manager";
import { useToast } from "@/hooks/use-toast";

interface SyncResult {
  table: string;
  localCount: number;
  syncedCount: number;
  failedCount: number;
  status: "success" | "error" | "warning";
  errors: string[];
  duration: number;
}

export default function ForceSyncUtility() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [summary, setSummary] = useState({
    totalTables: 0,
    successTables: 0,
    totalRecords: 0,
    syncedRecords: 0,
  });
  const { toast } = useToast();

  const forceSyncAllData = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const startTime = Date.now();

    try {
      // 1. جلب جميع البيانات المحلية
      setProgress(10);
      const [
        localMembers,
        localCourses,
        localDietPlans,
        localProducts,
        localSales,
      ] = await Promise.all([
        getMembers(),
        getCourses(),
        getDietPlans(),
        getProducts(),
        getSales(),
      ]);

      console.log("📊 Local data counts:", {
        members: localMembers.length,
        courses: localCourses.length,
        dietPlans: localDietPlans.length,
        products: localProducts.length,
        sales: localSales.length,
      });

      const dataSets = [
        { name: "الأعضاء", table: "members", data: localMembers },
        { name: "الكورسات", table: "courses", data: localCourses },
        { name: "الخطط الغذائية", table: "diet_plans", data: localDietPlans },
        { name: "المنتجات", table: "products", data: localProducts },
        { name: "المبيعات", table: "sales", data: localSales },
      ];

      const syncResults: SyncResult[] = [];
      const supabase = supabaseManager.getClient();

      // 2. مزامنة كل جدول
      for (let i = 0; i < dataSets.length; i++) {
        const dataSet = dataSets[i];
        const tableStartTime = Date.now();
        const baseProgress = 20 + (i * 60) / dataSets.length;

        setProgress(baseProgress);

        const result: SyncResult = {
          table: dataSet.name,
          localCount: dataSet.data.length,
          syncedCount: 0,
          failedCount: 0,
          status: "success",
          errors: [],
          duration: 0,
        };

        try {
          console.log(
            `🔄 Syncing ${dataSet.name} (${dataSet.data.length} records)...`,
          );

          if (dataSet.data.length === 0) {
            result.status = "warning";
            result.duration = Date.now() - tableStartTime;
            syncResults.push(result);
            continue;
          }

          // مزامنة كل عنصر في الجدول
          for (let j = 0; j < dataSet.data.length; j++) {
            const item = dataSet.data[j];
            const itemProgress =
              baseProgress + (j / dataSet.data.length) * (60 / dataSets.length);
            setProgress(itemProgress);

            try {
              // تحويل البيانات للتنسيق الصحيح
              const transformedItem = transformForSupabase(item, dataSet.table);

              console.log(`📝 Syncing ${dataSet.table} item:`, {
                id: transformedItem.id,
                name: transformedItem.name || transformedItem.buyer_name,
              });

              // رفع البيانات إلى Supabase
              const { error } = await supabase
                .from(dataSet.table)
                .upsert([transformedItem], {
                  onConflict: "id",
                  ignoreDuplicates: false,
                })
                .select();

              if (error) {
                console.error(
                  `❌ Error syncing ${dataSet.table} item ${transformedItem.id}:`,
                  error,
                );
                result.errors.push(`${transformedItem.id}: ${error.message}`);
                result.failedCount++;
              } else {
                console.log(
                  `✅ Successfully synced ${dataSet.table} item ${transformedItem.id}`,
                );
                result.syncedCount++;
              }
            } catch (itemError) {
              console.error(
                `❌ Exception syncing ${dataSet.table} item:`,
                itemError,
              );
              result.errors.push(`${item.id}: ${itemError.message}`);
              result.failedCount++;
            }
          }

          // تحديد حالة النتيجة
          if (result.failedCount === 0) {
            result.status = "success";
          } else if (result.syncedCount > 0) {
            result.status = "warning";
          } else {
            result.status = "error";
          }
        } catch (tableError) {
          console.error(`❌ Error syncing table ${dataSet.name}:`, tableError);
          result.status = "error";
          result.errors.push(`خطأ في الجدول: ${tableError.message}`);
          result.failedCount = result.localCount;
        }

        result.duration = Date.now() - tableStartTime;
        syncResults.push(result);
      }

      // 3. حساب الملخص
      setProgress(90);
      const summary = {
        totalTables: syncResults.length,
        successTables: syncResults.filter((r) => r.status === "success").length,
        totalRecords: syncResults.reduce((sum, r) => sum + r.localCount, 0),
        syncedRecords: syncResults.reduce((sum, r) => sum + r.syncedCount, 0),
      };

      setResults(syncResults);
      setSummary(summary);
      setProgress(100);

      // 4. إجبار تحديث حالة المزامنة
      await syncManager.forceSyncNow();

      toast({
        title: "اكتملت المزامنة الإجبارية",
        description: `تمت مزامنة ${summary.syncedRecords} من أصل ${summary.totalRecords} سجل`,
        variant:
          summary.syncedRecords === summary.totalRecords
            ? "default"
            : "destructive",
      });
    } catch (error) {
      console.error("❌ Error in force sync:", error);
      toast({
        title: "خطأ في المزامنة الإجبارية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // دالة تحويل البيانات لتنسيق Supabase
  const transformForSupabase = (item: any, table: string) => {
    const transformed = { ...item };

    // تحويل التواريخ
    if (transformed.createdAt) {
      transformed.created_at = new Date(transformed.createdAt).toISOString();
      delete transformed.createdAt;
    }
    if (transformed.updatedAt) {
      transformed.updated_at = new Date(transformed.updatedAt).toISOString();
      delete transformed.updatedAt;
    }

    // تحويل خاص بجدول الأعضاء
    if (table === "members") {
      if (transformed.courseGroups) {
        transformed.course_groups =
          Array.isArray(transformed.courseGroups) &&
          transformed.courseGroups.length > 0
            ? `{${transformed.courseGroups.map((g) => `"${g}"`).join(",")}}`
            : "{}";
        delete transformed.courseGroups;
      }
      if (transformed.dietPlanGroups) {
        transformed.diet_plan_groups =
          Array.isArray(transformed.dietPlanGroups) &&
          transformed.dietPlanGroups.length > 0
            ? `{${transformed.dietPlanGroups.map((g) => `"${g}"`).join(",")}}`
            : "{}";
        delete transformed.dietPlanGroups;
      }
      if (transformed.subscriptionStart) {
        transformed.subscription_start = new Date(
          transformed.subscriptionStart,
        ).toISOString();
        delete transformed.subscriptionStart;
      }
      if (transformed.subscriptionEnd) {
        transformed.subscription_end = new Date(
          transformed.subscriptionEnd,
        ).toISOString();
        delete transformed.subscriptionEnd;
      }
      if (Array.isArray(transformed.courses)) {
        transformed.courses =
          transformed.courses.length > 0
            ? `{${transformed.courses.map((c) => `"${c}"`).join(",")}}`
            : "{}";
      }
      if (Array.isArray(transformed.dietPlans)) {
        transformed.diet_plans =
          transformed.dietPlans.length > 0
            ? `{${transformed.dietPlans.map((d) => `"${d}"`).join(",")}}`
            : "{}";
        delete transformed.dietPlans;
      }
    }

    // تحويل خاص بجدول المبيعات
    if (table === "sales") {
      if (transformed.buyerName) {
        transformed.buyer_name = transformed.buyerName;
        delete transformed.buyerName;
      }
      if (transformed.productId) {
        transformed.product_id = transformed.productId;
        delete transformed.productId;
      }
      if (transformed.productName) {
        transformed.product_name = transformed.productName;
        delete transformed.productName;
      }
      if (transformed.unitPrice) {
        transformed.unit_price = transformed.unitPrice;
        delete transformed.unitPrice;
      }
      if (transformed.totalPrice) {
        transformed.total_price = transformed.totalPrice;
        delete transformed.totalPrice;
      }
    }

    return transformed;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
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
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
      >
        <Zap className="h-4 w-4" />
        مزامنة إجبارية فورية
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
                <Zap className="h-5 w-5" />
                مزامنة إجبارية فورية مع Supabase
              </CardTitle>
              <CardDescription>
                إرسال جميع البيانات المحلية إلى Supabase بالقوة
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={forceSyncAllData}
                disabled={isRunning}
                variant={results.length === 0 ? "destructive" : "outline"}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Zap className="h-4 w-4 ml-1" />
                )}
                {isRunning ? "جاري المزامنة..." : "بدء المزامنة الإجبارية"}
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
                جاري المزامنة... {progress.toFixed(0)}%
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
                        {summary.totalTables}
                      </div>
                      <div className="text-sm text-gray-600">الجداول</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.successTables}
                      </div>
                      <div className="text-sm text-gray-600">نجح</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {summary.totalRecords}
                      </div>
                      <div className="text-sm text-gray-600">
                        إجمالي السجلات
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {summary.syncedRecords}
                      </div>
                      <div className="text-sm text-gray-600">تمت المزامنة</div>
                    </div>
                  </Card>
                </div>

                {/* نتائج المزامنة */}
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(result.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{result.table}</span>
                            <Badge className={getStatusColor(result.status)}>
                              {result.status === "success" && "نجح"}
                              {result.status === "error" && "فشل"}
                              {result.status === "warning" && "جزئي"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {(result.duration / 1000).toFixed(2)}s
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            محلي: {result.localCount} | متزامن:{" "}
                            {result.syncedCount} | فشل: {result.failedCount}
                          </div>
                          {result.errors.length > 0 && (
                            <details className="text-xs text-red-600">
                              <summary className="cursor-pointer hover:text-red-800">
                                عرض الأخطاء ({result.errors.length})
                              </summary>
                              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {result.errors.map((error, i) => (
                                  <li key={i} className="p-1 bg-red-50 rounded">
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {results.length === 0 && !isRunning && (
              <div className="text-center text-gray-500 py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  مزامنة إجبارية لجميع البيانات
                </p>
                <p className="text-sm mb-4">
                  هذا سيرفع جميع البيانات المحلية إلى Supabase فوراً
                </p>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 text-sm">
                  <p className="font-medium">تحذير:</p>
                  <p>
                    هذه العملية ستحاول مزامنة جميع البيانات بالقوة. استخدمها فقط
                    إذا كانت المزامنة التلقائية لا تعمل.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
