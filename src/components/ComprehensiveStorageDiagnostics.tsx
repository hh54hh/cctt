import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

// Import all storage functions
import {
  saveMember,
  getMembers,
  updateMember,
  deleteMember,
  saveCourse,
  getCourses,
  deleteCourse,
  saveDietPlan,
  getDietPlans,
  deleteDietPlan,
  saveProduct,
  getProducts,
  deleteProduct,
  saveSale,
  getSales,
} from "../lib/storage-new";
import { syncManager } from "../lib/sync-manager";
import { offlineManager } from "../lib/offline-manager";
import { supabaseManager } from "../lib/supabase";
import type { Member, Course, DietPlan, Product, Sale } from "../lib/types";

interface DiagnosticResult {
  id: string;
  category: string;
  test: string;
  status: "success" | "error" | "warning" | "running";
  message: string;
  details?: any;
  duration?: number;
  timestamp: Date;
}

interface CategoryStats {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tests: (() => Promise<DiagnosticResult[]>)[];
}

export default function ComprehensiveStorageDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string>("");

  // Test data generators
  const generateTestMember = (): Member => ({
    id: `test-member-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: "عضو تشخيصي",
    phone: `05${Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(8, "0")}`,
    age: 25,
    height: 175,
    weight: 70,
    gender: "male" as const,
    courses: ["test-course-1"],
    dietPlans: ["test-diet-1"],
    courseGroups: [],
    dietPlanGroups: [],
    subscriptionStart: new Date(),
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateTestCourse = (): Course => ({
    id: `test-course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: "دورة تشخيصية",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateTestDietPlan = (): DietPlan => ({
    id: `test-diet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: "نظام غذائي ��شخيصي",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateTestProduct = (): Product => ({
    id: `test-product-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: "منتج تشخيصي",
    quantity: 10,
    price: 25.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateTestSale = (productId: string): Sale => ({
    id: `test-sale-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    buyerName: "مشتري تشخيصي",
    productId,
    productName: "منتج تشخيصي",
    quantity: 2,
    unitPrice: 25.5,
    totalPrice: 51.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Test categories and their tests
  const testCategories: TestCategory[] = [
    {
      id: "members",
      name: "إدارة الأعضاء",
      description: "اختبار عمليات حفظ، تحديث، حذف وجلب بيانات الأعضاء",
      icon: <Database className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];
          const testMember = generateTestMember();

          try {
            // Test save member
            const startTime = Date.now();
            await saveMember(testMember);
            results.push({
              id: `member-save-${Date.now()}`,
              category: "members",
              test: "حفظ عضو جديد",
              status: "success",
              message: "تم حفظ العضو بنجاح",
              duration: Date.now() - startTime,
              timestamp: new Date(),
            });

            // Test get members
            const getStartTime = Date.now();
            const members = await getMembers();
            const savedMember = members.find((m) => m.id === testMember.id);
            if (savedMember) {
              results.push({
                id: `member-get-${Date.now()}`,
                category: "members",
                test: "جلب الأعضاء",
                status: "success",
                message: `تم جلب ${members.length} عضو بنجاح`,
                duration: Date.now() - getStartTime,
                timestamp: new Date(),
              });
            } else {
              results.push({
                id: `member-get-${Date.now()}`,
                category: "members",
                test: "جلب الأعضاء",
                status: "error",
                message: "فشل في العثور على العضو المحفوظ",
                timestamp: new Date(),
              });
            }

            // Test update member
            const updateStartTime = Date.now();
            const updatedMember = { ...testMember, name: "عضو محدث" };
            await updateMember(updatedMember);
            results.push({
              id: `member-update-${Date.now()}`,
              category: "members",
              test: "تحديث بيانات العضو",
              status: "success",
              message: "تم تحديث العضو بنجاح",
              duration: Date.now() - updateStartTime,
              timestamp: new Date(),
            });

            // Test delete member
            const deleteStartTime = Date.now();
            await deleteMember(testMember.id);
            results.push({
              id: `member-delete-${Date.now()}`,
              category: "members",
              test: "حذف العضو",
              status: "success",
              message: "تم حذف العضو بنجاح",
              duration: Date.now() - deleteStartTime,
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              id: `member-error-${Date.now()}`,
              category: "members",
              test: "عمليات الأعضاء",
              status: "error",
              message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
    {
      id: "courses",
      name: "إدارة الدورات",
      description: "اختبار عمليات إدارة الدورات التدريبية",
      icon: <Activity className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];
          const testCourse = generateTestCourse();

          try {
            // Test save course
            const startTime = Date.now();
            await saveCourse(testCourse);
            results.push({
              id: `course-save-${Date.now()}`,
              category: "courses",
              test: "حفظ دورة جديدة",
              status: "success",
              message: "تم حفظ الدورة بنجاح",
              duration: Date.now() - startTime,
              timestamp: new Date(),
            });

            // Test get courses
            const courses = await getCourses();
            const savedCourse = courses.find((c) => c.id === testCourse.id);
            if (savedCourse) {
              results.push({
                id: `course-get-${Date.now()}`,
                category: "courses",
                test: "جلب الدورات",
                status: "success",
                message: `تم جلب ${courses.length} دورة بنجاح`,
                timestamp: new Date(),
              });
            }

            // Test update course (skipped - function not implemented)
            results.push({
              id: `course-update-${Date.now()}`,
              category: "courses",
              test: "تحديث الدورة",
              status: "warning",
              message: "وظيفة تحديث الدورة غير متاحة",
              timestamp: new Date(),
            });

            // Test delete course
            await deleteCourse(testCourse.id);
            results.push({
              id: `course-delete-${Date.now()}`,
              category: "courses",
              test: "حذف الدورة",
              status: "success",
              message: "تم حذف الدورة بنجاح",
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              id: `course-error-${Date.now()}`,
              category: "courses",
              test: "عمليات الدورات",
              status: "error",
              message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
    {
      id: "dietplans",
      name: "النظم الغذائية",
      description: "اختبار عمليات إدارة النظم الغذائية",
      icon: <Activity className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];
          const testDietPlan = generateTestDietPlan();

          try {
            await saveDietPlan(testDietPlan);
            results.push({
              id: `diet-save-${Date.now()}`,
              category: "dietplans",
              test: "حفظ نظام غذائي",
              status: "success",
              message: "تم حفظ النظام الغذائي بنجاح",
              timestamp: new Date(),
            });

            const dietPlans = await getDietPlans();
            results.push({
              id: `diet-get-${Date.now()}`,
              category: "dietplans",
              test: "جلب النظم الغذائية",
              status: "success",
              message: `تم جلب ${dietPlans.length} نظام غذائي`,
              timestamp: new Date(),
            });

            // Test update diet plan (skipped - function not implemented)
            results.push({
              id: `diet-update-${Date.now()}`,
              category: "dietplans",
              test: "تحديث النظام الغذائي",
              status: "warning",
              message: "وظيفة تحديث النظام الغذائي غير متاحة",
              timestamp: new Date(),
            });

            await deleteDietPlan(testDietPlan.id);
            results.push({
              id: `diet-delete-${Date.now()}`,
              category: "dietplans",
              test: "حذف النظام الغذائي",
              status: "success",
              message: "تم حذف النظام الغذائي بنجاح",
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              id: `diet-error-${Date.now()}`,
              category: "dietplans",
              test: "عمليات النظم الغذائية",
              status: "error",
              message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
    {
      id: "products",
      name: "إدارة المنتجات",
      description: "اختبار عمليات إدارة المنتجات والمخزون",
      icon: <Database className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];
          const testProduct = generateTestProduct();

          try {
            await saveProduct(testProduct);
            results.push({
              id: `product-save-${Date.now()}`,
              category: "products",
              test: "حفظ منتج جديد",
              status: "success",
              message: "تم حفظ المنتج بنجاح",
              timestamp: new Date(),
            });

            const products = await getProducts();
            results.push({
              id: `product-get-${Date.now()}`,
              category: "products",
              test: "جلب المنتجات",
              status: "success",
              message: `تم جلب ${products.length} منتج`,
              timestamp: new Date(),
            });

            // Test update product (skipped - function not implemented)
            results.push({
              id: `product-update-${Date.now()}`,
              category: "products",
              test: "تحديث المنتج",
              status: "warning",
              message: "وظيفة تحديث المنتج غير متاحة",
              timestamp: new Date(),
            });

            await deleteProduct(testProduct.id);
            results.push({
              id: `product-delete-${Date.now()}`,
              category: "products",
              test: "حذف المنتج",
              status: "success",
              message: "تم حذف المنتج بنجاح",
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              id: `product-error-${Date.now()}`,
              category: "products",
              test: "عمليات المنتجات",
              status: "error",
              message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
    {
      id: "sales",
      name: "إدارة المبيعات",
      description: "اختبار عمليات إدارة المبيعات والفواتير",
      icon: <Activity className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];
          const testProduct = generateTestProduct();

          try {
            // Save product first for the sale
            await saveProduct(testProduct);
            const testSale = generateTestSale(testProduct.id);

            await saveSale(testSale);
            results.push({
              id: `sale-save-${Date.now()}`,
              category: "sales",
              test: "حفظ عملية بيع",
              status: "success",
              message: "تم حفظ عملية البيع بنجاح",
              timestamp: new Date(),
            });

            const sales = await getSales();
            results.push({
              id: `sale-get-${Date.now()}`,
              category: "sales",
              test: "جلب المبيعات",
              status: "success",
              message: `تم جلب ${sales.length} عملية بيع`,
              timestamp: new Date(),
            });

            // Cleanup
            await deleteProduct(testProduct.id);
          } catch (error) {
            results.push({
              id: `sale-error-${Date.now()}`,
              category: "sales",
              test: "عمليات المبيعات",
              status: "error",
              message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
    {
      id: "sync",
      name: "المزامنة والاتصال",
      description: "اختبار المزامنة مع Supabase والحالة المتصلة/غير متصلة",
      icon: <Wifi className="h-4 w-4" />,
      tests: [
        async () => {
          const results: DiagnosticResult[] = [];

          try {
            // Test online status
            const isOnline = offlineManager.getOnlineStatus();
            results.push({
              id: `sync-online-${Date.now()}`,
              category: "sync",
              test: "حالة الاتصال",
              status: isOnline ? "success" : "warning",
              message: isOnline ? "متصل بالإنترنت" : "غير متصل بالإنترنت",
              timestamp: new Date(),
            });

            // Test Supabase connection
            try {
              const client = supabaseManager.getClient();
              const { data, error } = await client
                .from("members")
                .select("count")
                .limit(1);
              if (error) throw error;

              results.push({
                id: `sync-supabase-${Date.now()}`,
                category: "sync",
                test: "ا��صال Supabase",
                status: "success",
                message: "الاتصال بـ Supabase يعمل بشكل صحيح",
                timestamp: new Date(),
              });
            } catch (error) {
              results.push({
                id: `sync-supabase-${Date.now()}`,
                category: "sync",
                test: "اتصال Supabase",
                status: "error",
                message: `خطأ في الاتصال بـ Supabase: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
                details: error,
                timestamp: new Date(),
              });
            }

            // Test sync queue status
            const syncQueueStatus = offlineManager.getSyncQueueStatus();
            results.push({
              id: `sync-queue-${Date.now()}`,
              category: "sync",
              test: "حالة طابور المزامنة",
              status: syncQueueStatus.unsynced === 0 ? "success" : "warning",
              message: `${syncQueueStatus.unsynced} عملية في انتظار المزامنة، ${syncQueueStatus.synced} عملية مُزامنة`,
              details: syncQueueStatus,
              timestamp: new Date(),
            });

            // Test sync manager status
            const syncStatus = syncManager.getSyncStatus();
            results.push({
              id: `sync-manager-${Date.now()}`,
              category: "sync",
              test: "حالة مدير المزامنة",
              status: syncStatus.isSyncing ? "warning" : "success",
              message: syncStatus.isSyncing
                ? "جاري المزامنة..."
                : "مدير المزامنة جاهز",
              details: syncStatus,
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              id: `sync-error-${Date.now()}`,
              category: "sync",
              test: "فحص المزامنة",
              status: "error",
              message: `خطأ في فحص المزامنة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
              details: error,
              timestamp: new Date(),
            });
          }

          return results;
        },
      ],
    },
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const allResults: DiagnosticResult[] = [];
    const totalTests = testCategories.reduce(
      (acc, category) => acc + category.tests.length,
      0,
    );
    let completedTests = 0;

    for (const category of testCategories) {
      setCurrentCategory(category.name);

      for (const test of category.tests) {
        try {
          const testResults = await test();
          allResults.push(...testResults);
        } catch (error) {
          allResults.push({
            id: `category-error-${Date.now()}`,
            category: category.id,
            test: `خطأ في فئة ${category.name}`,
            status: "error",
            message: `خطأ غير متوقع: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
            details: error,
            timestamp: new Date(),
          });
        }

        completedTests++;
        setProgress((completedTests / totalTests) * 100);
        setResults([...allResults]);

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setCurrentCategory("");
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "running":
        return <Activity className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    const variants = {
      success: "default" as const,
      error: "destructive" as const,
      warning: "secondary" as const,
      running: "outline" as const,
    };

    const labels = {
      success: "نجح",
      error: "فشل",
      warning: "تحذير",
      running: "جاري التشغيل",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getCategoryStats = (categoryId: string): CategoryStats => {
    const categoryResults = results.filter((r) => r.category === categoryId);
    return {
      total: categoryResults.length,
      passed: categoryResults.filter((r) => r.status === "success").length,
      failed: categoryResults.filter((r) => r.status === "error").length,
      warnings: categoryResults.filter((r) => r.status === "warning").length,
    };
  };

  const overallStats = {
    total: results.length,
    passed: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    warnings: results.filter((r) => r.status === "warning").length,
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Database className="h-4 w-4" />
        تشخيص شامل للتخزين
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                تشخيص شامل للتخزين
              </CardTitle>
              <CardDescription>
                فحص شامل لجميع عمليات التخزين والمزامنة في النظام
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>

          {/* Overall Statistics */}
          {results.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overallStats.total}
                </div>
                <div className="text-sm text-blue-600">إجمالي الاختبارات</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overallStats.passed}
                </div>
                <div className="text-sm text-green-600">نجحت</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overallStats.failed}
                </div>
                <div className="text-sm text-red-600">فشلت</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {overallStats.warnings}
                </div>
                <div className="text-sm text-yellow-600">تحذيرات</div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isRunning ? "جاري التشخيص..." : "تشغيل التشخيص الشامل"}
            </Button>

            {results.length > 0 && (
              <Button variant="outline" onClick={() => setResults([])}>
                مسح النتائج
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>التقدم: {Math.round(progress)}%</span>
                <span>{currentCategory}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="members">الأعضاء</TabsTrigger>
                <TabsTrigger value="courses">الدورات</TabsTrigger>
                <TabsTrigger value="dietplans">النظم الغذائية</TabsTrigger>
                <TabsTrigger value="products">المنتجات</TabsTrigger>
                <TabsTrigger value="sales">المبيعات</TabsTrigger>
                <TabsTrigger value="sync">المزامنة</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testCategories.map((category) => {
                    const stats = getCategoryStats(category.id);
                    return (
                      <Card key={category.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            {category.icon}
                            {category.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>الإجمالي:</span>
                              <span>{stats.total}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                              <span>نجح:</span>
                              <span>{stats.passed}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600">
                              <span>فشل:</span>
                              <span>{stats.failed}</span>
                            </div>
                            <div className="flex justify-between text-sm text-yellow-600">
                              <span>تحذيرات:</span>
                              <span>{stats.warnings}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {testCategories.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="mt-4"
                >
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {results
                        .filter((r) => r.category === category.id)
                        .map((result) => (
                          <Card key={result.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(result.status)}
                                  <div>
                                    <div className="font-medium">
                                      {result.test}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {result.message}
                                    </div>
                                    {result.duration && (
                                      <div className="text-xs text-gray-500">
                                        المدة: {result.duration}ms
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(result.status)}
                                  <span className="text-xs text-gray-500">
                                    {result.timestamp.toLocaleTimeString(
                                      "ar-SA",
                                    )}
                                  </span>
                                </div>
                              </div>
                              {result.details && (
                                <Alert className="mt-3">
                                  <AlertDescription>
                                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                                      {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                  </AlertDescription>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
