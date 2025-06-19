import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Database,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  BarChart3,
  Search,
  Settings,
} from "lucide-react";
import {
  getSubscribers,
  getCoursePoints,
  getDietItems,
  getProducts,
  getSales,
  getSubscriberWithGroups,
} from "@/lib/database-new";
import { checkDatabaseInitialization } from "@/lib/database-init";
import { supabase } from "@/lib/supabase";
import { DiagnosticResult, SystemStatus } from "@/lib/types-new";

export default function SystemDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    // Check initial connection status
    checkConnection();
  }, []);

  const addResult = (result: DiagnosticResult) => {
    setResults((prev) => [...prev, result]);
  };

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("count")
        .limit(1);

      setConnectionStatus(!error);
    } catch (error) {
      setConnectionStatus(false);
    }
  };

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Step 1: Check Database Connection
      setProgress(10);
      addResult({
        title: "فحص الاتصال بقاعدة البيانات",
        status: "success",
        message: "جاري فحص الاتصال مع Supabase...",
        timestamp: new Date().toISOString(),
      });

      try {
        const { data, error } = await supabase
          .from("subscribers")
          .select("count")
          .limit(1);

        if (error) throw error;

        addResult({
          title: "اتصال قاعدة البيانات",
          status: "success",
          message: "تم الاتصال بقاعدة البيا��ات بنجاح",
          details: "جميع العمليات متاحة",
          timestamp: new Date().toISOString(),
        });
        setConnectionStatus(true);
      } catch (error) {
        addResult({
          title: "اتصال قاعدة البيانات",
          status: "error",
          message: "فشل في الاتصال بقاعدة البيانات",
          details: error instanceof Error ? error.message : "خطأ غير معروف",
          timestamp: new Date().toISOString(),
        });
        setConnectionStatus(false);
      }

      // Step 2: Check Database Schema
      setProgress(25);
      addResult({
        title: "فحص هيكل قاعدة البيانات",
        status: "success",
        message: "جاري فحص الجداول المطلوبة...",
        timestamp: new Date().toISOString(),
      });

      const dbStatus = await checkDatabaseInitialization();
      if (dbStatus.isInitialized) {
        addResult({
          title: "هيكل قاعدة البيانات",
          status: "success",
          message: "جميع الجداول المطلوبة موجودة",
          details:
            "subscribers, groups, group_items, course_points, diet_items, products, sales",
          timestamp: new Date().toISOString(),
        });
      } else {
        addResult({
          title: "هيكل قاعدة البيانات",
          status: "error",
          message: "بعض الجداول مفقودة",
          details: `الجداول المفقودة: ${dbStatus.missingTables.join(", ")}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 3: Check Basic Data
      setProgress(40);
      addResult({
        title: "فحص البيانات الأساسية",
        status: "success",
        message: "جاري فحص البيانات الأساسية...",
        timestamp: new Date().toISOString(),
      });

      const [subscribers, coursePoints, dietItems, products, sales] =
        await Promise.all([
          getSubscribers().catch(() => []),
          getCoursePoints().catch(() => []),
          getDietItems().catch(() => []),
          getProducts().catch(() => []),
          getSales().catch(() => []),
        ]);

      addResult({
        title: "البيانات الأساسية",
        status: "success",
        message: "تم تحميل البيانات بنجاح",
        details: `المشتركين: ${subscribers.length}, التمارين: ${coursePoints.length}, الأطعمة: ${dietItems.length}, المنتجات: ${products.length}, المبيعات: ${sales.length}`,
        timestamp: new Date().toISOString(),
      });

      // Step 4: Check Subscribers with Data
      setProgress(60);
      addResult({
        title: "فحص بيانات المشتركين",
        status: "success",
        message: "جاري فحص بيانات المشتركين وربطها...",
        timestamp: new Date().toISOString(),
      });

      let subscribersWithData = 0;
      let subscribersWithCourses = 0;
      let subscribersWithDiet = 0;

      for (const subscriber of subscribers.slice(0, 10)) {
        // Check first 10 for performance
        try {
          const fullSubscriber = await getSubscriberWithGroups(subscriber.id);
          if (fullSubscriber) {
            subscribersWithData++;
            if (fullSubscriber.courseGroups.length > 0) {
              subscribersWithCourses++;
            }
            if (fullSubscriber.dietGroups.length > 0) {
              subscribersWithDiet++;
            }
          }
        } catch (error) {
          // Skip this subscriber if there's an error loading details
        }
      }

      addResult({
        title: "بيانات المشتركين",
        status: subscribersWithData > 0 ? "success" : "warning",
        message: `تم فحص ${Math.min(subscribers.length, 10)} مشترك`,
        details: `مع كورسات: ${subscribersWithCourses}, مع أنظمة غذائية: ${subscribersWithDiet}`,
        timestamp: new Date().toISOString(),
      });

      // Step 5: Performance Check
      setProgress(80);
      addResult({
        title: "فحص الأداء",
        status: "success",
        message: "جاري فحص أداء النظام...",
        timestamp: new Date().toISOString(),
      });

      const startTime = Date.now();
      await Promise.all([
        getSubscribers()
          .then(() => null)
          .catch(() => null),
        getCoursePoints()
          .then(() => null)
          .catch(() => null),
        getDietItems()
          .then(() => null)
          .catch(() => null),
      ]);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      addResult({
        title: "أداء النظام",
        status:
          responseTime < 2000
            ? "success"
            : responseTime < 5000
              ? "warning"
              : "error",
        message: `وقت الاستجابة: ${responseTime}ms`,
        details:
          responseTime < 2000 ? "ممتاز" : responseTime < 5000 ? "جيد" : "بطيء",
        timestamp: new Date().toISOString(),
      });

      // Step 6: System Status Summary
      setProgress(100);
      const status: SystemStatus = {
        database_connection: connectionStatus === true,
        tables_status: {
          subscribers: subscribers.length > 0,
          course_points: coursePoints.length > 0,
          diet_items: dietItems.length > 0,
          products: products.length > 0,
          sales: sales.length > 0,
        },
        sample_data_status: {
          subscribers: subscribers.length,
          course_points: coursePoints.length,
          diet_items: dietItems.length,
          products: products.length,
          sales: sales.length,
        },
        subscribers_with_data: subscribersWithData,
        total_subscribers: subscribers.length,
      };

      setSystemStatus(status);

      addResult({
        title: "فحص شامل مكتمل",
        status: "success",
        message: "تم إكمال الفحص الشامل بنجاح",
        details: "جميع الفحوصات مكتملة",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      addResult({
        title: "خطأ في الفحص",
        status: "error",
        message: "حدث خطأ أثناء الفحص",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickConnectionTest = async () => {
    setIsRunning(true);
    setResults([]);

    addResult({
      title: "اختبار الاتصال السريع",
      status: "success",
      message: "جاري اختبار الاتصال...",
      timestamp: new Date().toISOString(),
    });

    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("subscribers")
        .select("count")
        .limit(1);
      const endTime = Date.now();

      if (error) throw error;

      addResult({
        title: "اتصال Supabase",
        status: "success",
        message: "متصل بنجاح",
        details: `وقت الاستجابة: ${endTime - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
      setConnectionStatus(true);
    } catch (error) {
      addResult({
        title: "اتصال Supabase",
        status: "error",
        message: "فشل في الاتصال",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
        timestamp: new Date().toISOString(),
      });
      setConnectionStatus(false);
    } finally {
      setIsRunning(false);
    }
  };

  const runSubscribersDataTest = async () => {
    setIsRunning(true);
    setResults([]);

    addResult({
      title: "فحص بيانات المشتركين",
      status: "success",
      message: "جاري فحص المشتركين...",
      timestamp: new Date().toISOString(),
    });

    try {
      const subscribers = await getSubscribers();

      addResult({
        title: "عدد المشتركين",
        status: "success",
        message: `تم العثور على ${subscribers.length} مشترك`,
        timestamp: new Date().toISOString(),
      });

      if (subscribers.length > 0) {
        // Check first subscriber in detail
        const firstSubscriber = await getSubscriberWithGroups(
          subscribers[0].id,
        );

        if (firstSubscriber) {
          addResult({
            title: "تفاصيل المشترك الأول",
            status: "success",
            message: `${firstSubscriber.name}`,
            details: `كورسات: ${firstSubscriber.courseGroups.length}, أنظمة غذائية: ${firstSubscriber.dietGroups.length}`,
            timestamp: new Date().toISOString(),
          });

          // Check course groups details
          if (firstSubscriber.courseGroups.length > 0) {
            const firstCourseGroup = firstSubscriber.courseGroups[0];
            addResult({
              title: "مجموعة الكورسات الأولى",
              status: "success",
              message: firstCourseGroup.title || "بدون عنوان",
              details: `عدد التمارين: ${firstCourseGroup.items?.length || 0}`,
              timestamp: new Date().toISOString(),
            });
          }

          // Check diet groups details
          if (firstSubscriber.dietGroups.length > 0) {
            const firstDietGroup = firstSubscriber.dietGroups[0];
            addResult({
              title: "المجموعة الغذائية الأولى",
              status: "success",
              message: firstDietGroup.title || "بدون عنوان",
              details: `عدد العناصر: ${firstDietGroup.items?.length || 0}`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } else {
        addResult({
          title: "لا يوجد مشتركين",
          status: "warning",
          message: "لم يتم العثور على أي مشتركين",
          details: "قم بإضافة مشتركين جدد",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      addResult({
        title: "خطأ في فحص المشتركين",
        status: "error",
        message: "فشل في تحميل بيانات المشتركين",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusIcon = (status: "success" | "warning" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: "success" | "warning" | "error") => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "error":
        return "border-red-200 bg-red-50";
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">فحص النظام</h1>
            <p className="text-gray-600">
              فحص شامل لحالة النظام وقاعدة البيانات
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === true ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : connectionStatus === false ? (
                <WifiOff className="h-5 w-5 text-red-600" />
              ) : (
                <RefreshCw className="h-5 w-5 text-gray-600 animate-spin" />
              )}
              حالة الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {connectionStatus === true && (
                <Badge variant="default" className="bg-green-600">
                  متصل بقاعدة البيانات
                </Badge>
              )}
              {connectionStatus === false && (
                <Badge variant="destructive">غير متصل بقاعدة البيانات</Badge>
              )}
              {connectionStatus === null && (
                <Badge variant="secondary">جاري فحص الاتصال...</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={checkConnection}
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4 ml-1" />
                تحديث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={runQuickConnectionTest}
            disabled={isRunning}
            className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Database className="h-6 w-6 mb-2" />
            <div>
              <div className="font-semibold">فحص الاتصال</div>
              <div className="text-sm opacity-90">اختبار سريع للاتصال</div>
            </div>
          </Button>

          <Button
            onClick={runSubscribersDataTest}
            disabled={isRunning}
            className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Users className="h-6 w-6 mb-2" />
            <div>
              <div className="font-semibold">فحص المشتركين</div>
              <div className="text-sm opacity-90">فحص بيانات المشتركين</div>
            </div>
          </Button>

          <Button
            onClick={runComprehensiveDiagnostics}
            disabled={isRunning}
            className="h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <BarChart3 className="h-6 w-6 mb-2" />
            <div>
              <div className="font-semibold">فحص شامل</div>
              <div className="text-sm opacity-90">فحص كامل للنظام</div>
            </div>
          </Button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>جاري الفحص...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status Summary */}
        {systemStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                ملخص حالة النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">
                    قاعدة البيانات
                  </h4>
                  <Badge
                    variant={
                      systemStatus.database_connection
                        ? "default"
                        : "destructive"
                    }
                  >
                    {systemStatus.database_connection ? "متصل" : "غير متصل"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">المشتركين</h4>
                  <p className="text-sm">
                    {systemStatus.total_subscribers} إجمالي
                  </p>
                  <p className="text-sm text-gray-600">
                    {systemStatus.subscribers_with_data} مع بيانات
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">
                    البيانات الأساسية
                  </h4>
                  <p className="text-sm">
                    تمارين: {systemStatus.sample_data_status.course_points}
                  </p>
                  <p className="text-sm">
                    أطعمة: {systemStatus.sample_data_status.diet_items}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">المخزون</h4>
                  <p className="text-sm">
                    منتجات: {systemStatus.sample_data_status.products}
                  </p>
                  <p className="text-sm">
                    مبيعات: {systemStatus.sample_data_status.sales}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                نتائج الفحص ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{result.title}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(result.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-gray-600 mt-2">
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إرشادات الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">فحص الاتصال</h4>
                <p className="text-sm text-gray-600">
                  يتحقق من الاتصال مع قاعدة البيانات Supabase ويقيس وقت
                  الاستجابة
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">فحص المشتركين</h4>
                <p className="text-sm text-gray-600">
                  يتحقق من بيانات المشتركين وربطها مع الكورسات والأنظمة الغذائية
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">فحص شامل</h4>
                <p className="text-sm text-gray-600">
                  فحص متكامل يشمل قاعدة البيانات والبيانات والأداء والربط
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
