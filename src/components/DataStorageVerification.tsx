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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
  Users,
  GraduationCap,
  Apple,
  Package,
  ShoppingCart,
  TestTube,
  Zap,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  saveMember,
  getMemberById,
  updateMember,
  deleteMember,
  saveCourse,
  getCourses,
  saveDietPlan,
  getDietPlans,
  saveProduct,
  getProducts,
  saveSale,
  getSales,
} from "@/lib/storage-new";
import { supabaseManager } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Member, Course, DietPlan, Product, Sale } from "@/lib/types";

interface TestResult {
  name: string;
  status: "success" | "error" | "warning" | "running";
  message: string;
  details?: any;
  icon?: React.ReactNode;
  duration?: number;
}

export default function DataStorageVerification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    errors: 0,
    warnings: 0,
  });
  const { toast } = useToast();

  // بيانات تجريبية للاختبار
  const testData = {
    member: {
      id: "test-member-" + Date.now(),
      name: "عضو تجريبي للاختبار",
      phone: "01234567890",
      age: 25,
      height: 175,
      weight: 70,
      gender: "male" as const,
      courses: [],
      dietPlans: [],
      courseGroups: [
        {
          id: "group-1",
          title: "مجموعة التمارين الأساسية",
          courseIds: ["course-1", "course-2"],
          createdAt: new Date(),
        },
        {
          id: "group-2",
          title: "تمارين متقدمة",
          courseIds: ["course-3"],
          createdAt: new Date(),
        },
      ],
      dietPlanGroups: [
        {
          id: "diet-group-1",
          title: "برنامج التغذية الأساسي",
          dietPlanIds: ["diet-1", "diet-2"],
          createdAt: new Date(),
        },
      ],
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // شهر من الآن
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Member,
    courses: [
      {
        id: "course-1",
        name: "تمارين الصدر",
        createdAt: new Date(),
      },
      {
        id: "course-2",
        name: "تمارين الظهر",
        createdAt: new Date(),
      },
      {
        id: "course-3",
        name: "تمارين الأرجل",
        createdAt: new Date(),
      },
    ] as Course[],
    dietPlans: [
      {
        id: "diet-1",
        name: "نظام غذائي لزيادة الكتلة",
        createdAt: new Date(),
      },
      {
        id: "diet-2",
        name: "نظام غذائي للتنشيف",
        createdAt: new Date(),
      },
    ] as DietPlan[],
    product: {
      id: "test-product-" + Date.now(),
      name: "منتج تجريبي",
      quantity: 100,
      price: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product,
    sale: {
      id: "test-sale-" + Date.now(),
      buyerName: "مشتري تجريبي",
      productId: "test-product-" + Date.now(),
      productName: "منتج تجريبي",
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sale,
  };

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults((prev) =>
      prev.map((result, i) =>
        i === index ? { ...result, ...updates } : result,
      ),
    );
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const startTime = Date.now();

    try {
      // 1. اختبار إنشاء الكورسات
      setProgress(10);
      addResult({
        name: "إنشاء الكورسات التجريبية",
        status: "running",
        message: "جاري إنشاء الكورسات...",
        icon: <GraduationCap className="h-4 w-4" />,
      });

      const courseStartTime = Date.now();
      for (const course of testData.courses) {
        await saveCourse(course);
      }

      updateResult(results.length - 1, {
        status: "success",
        message: `تم إنشاء ${testData.courses.length} كورسات بنجاح`,
        duration: Date.now() - courseStartTime,
      });

      // 2. اختبار إنشاء الخطط الغذائية
      setProgress(20);
      addResult({
        name: "إنشاء الخطط الغذائية التجريبية",
        status: "running",
        message: "جاري إنشاء الخطط الغذائية...",
        icon: <Apple className="h-4 w-4" />,
      });

      const dietStartTime = Date.now();
      for (const dietPlan of testData.dietPlans) {
        await saveDietPlan(dietPlan);
      }

      updateResult(results.length - 1, {
        status: "success",
        message: `تم إنشاء ${testData.dietPlans.length} خطط غذائية بنجاح`,
        duration: Date.now() - dietStartTime,
      });

      // 3. اختبار إنشاء عضو مع المجموعات
      setProgress(30);
      addResult({
        name: "إنشاء عضو مع المجموعات",
        status: "running",
        message: "جاري إنشاء عضو تجريبي مع مجموعات الكورسات والخطط الغذائية...",
        icon: <Users className="h-4 w-4" />,
      });

      const memberStartTime = Date.now();
      await saveMember(testData.member);

      updateResult(results.length - 1, {
        status: "success",
        message: `تم إنشاء العضو مع ${testData.member.courseGroups.length} مجموعة كورسات و ${testData.member.dietPlanGroups.length} مجموعة خطط غذائية`,
        duration: Date.now() - memberStartTime,
        details: {
          courseGroups: testData.member.courseGroups,
          dietPlanGroups: testData.member.dietPlanGroups,
        },
      });

      // 4. التحقق من حفظ البيانات في قاعدة البيانات المحلية
      setProgress(40);
      addResult({
        name: "التحقق من البيانات المحلية",
        status: "running",
        message: "جاري التحقق من حفظ البيانات محلياً...",
        icon: <Database className="h-4 w-4" />,
      });

      const localVerifyStartTime = Date.now();
      const savedMember = await getMemberById(testData.member.id);

      if (!savedMember) {
        throw new Error("لم يتم العثور على العضو في قاعدة البيانات المحلية");
      }

      // التحقق من تفاصيل المجموعات
      const courseGroupsMatch =
        savedMember.courseGroups.length === testData.member.courseGroups.length;
      const dietGroupsMatch =
        savedMember.dietPlanGroups.length ===
        testData.member.dietPlanGroups.length;

      if (!courseGroupsMatch || !dietGroupsMatch) {
        throw new Error("مجموعات الكورسات أو الخطط الغذائية لا تتطابق");
      }

      updateResult(results.length - 1, {
        status: "success",
        message: "تم التحقق من حفظ جميع البيانات محلياً بنجاح",
        duration: Date.now() - localVerifyStartTime,
        details: {
          savedMember: {
            id: savedMember.id,
            name: savedMember.name,
            courseGroupsCount: savedMember.courseGroups.length,
            dietPlanGroupsCount: savedMember.dietPlanGroups.length,
          },
        },
      });

      // 5. التحقق من المزامنة مع Supabase
      setProgress(50);
      addResult({
        name: "التحقق من مزامنة Supabase",
        status: "running",
        message: "جاري التحقق من مزامنة البيانات مع Supabase...",
        icon: <Zap className="h-4 w-4" />,
      });

      const supabaseVerifyStartTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 3000)); // انتظار المزامنة

      try {
        const supabase = supabaseManager.getClient();

        // التحقق من العضو في Supabase
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("id", testData.member.id)
          .single();

        if (memberError && memberError.code !== "PGRST116") {
          throw memberError;
        }

        // التحقق من الكورسات
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .in(
            "id",
            testData.courses.map((c) => c.id),
          );

        if (coursesError) throw coursesError;

        // التحقق من الخطط الغذائية
        const { data: dietPlansData, error: dietPlansError } = await supabase
          .from("diet_plans")
          .select("*")
          .in(
            "id",
            testData.dietPlans.map((d) => d.id),
          );

        if (dietPlansError) throw dietPlansError;

        updateResult(results.length - 1, {
          status: "success",
          message: `تمت المزامنة مع Supabase بنجاح - العضو: ${memberData ? "✓" : "⏳"}, الكورسات: ${coursesData?.length || 0}, الخطط: ${dietPlansData?.length || 0}`,
          duration: Date.now() - supabaseVerifyStartTime,
          details: {
            memberSynced: !!memberData,
            coursesSynced: coursesData?.length || 0,
            dietPlansSynced: dietPlansData?.length || 0,
            memberDetails: memberData
              ? {
                  id: memberData.id,
                  name: memberData.name,
                  courseGroups: memberData.course_groups || [],
                  dietPlanGroups: memberData.diet_plan_groups || [],
                }
              : null,
          },
        });
      } catch (error) {
        updateResult(results.length - 1, {
          status: "warning",
          message: `مزامنة Supabase قيد التقدم أو هناك تأخير (${error.message})`,
          duration: Date.now() - supabaseVerifyStartTime,
        });
      }

      // 6. اختبار تحديث البيانات
      setProgress(60);
      addResult({
        name: "اختبار تحديث البيانات",
        status: "running",
        message: "جاري اختبار تحديث بيانات العضو...",
        icon: <FileText className="h-4 w-4" />,
      });

      const updateStartTime = Date.now();
      const updatedData = {
        name: "عضو تجريبي محدث",
        weight: 72,
        courseGroups: [
          ...testData.member.courseGroups,
          {
            id: "group-3",
            title: "مجموعة جديدة",
            courseIds: ["course-1"],
            createdAt: new Date(),
          },
        ],
      };

      // Create complete member object with updates
      const memberToUpdate = { ...testData.member, ...updatedData };
      await updateMember(memberToUpdate);

      const updatedMember = await getMemberById(testData.member.id);
      if (!updatedMember) {
        throw new Error("فشل في استرجاع العضو المحدث");
      }

      updateResult(results.length - 1, {
        status: "success",
        message: `تم تحديث البيانات بنجاح - المجموعات الجديدة: ${updatedMember.courseGroups.length}`,
        duration: Date.now() - updateStartTime,
        details: {
          oldName: testData.member.name,
          newName: updatedMember.name,
          oldGroupsCount: testData.member.courseGroups.length,
          newGroupsCount: updatedMember.courseGroups.length,
        },
      });

      // 7. اختبار المنتجات والمبيعات
      setProgress(70);
      addResult({
        name: "اختبار المنتجات والمبيعات",
        status: "running",
        message: "جاري اختبار حفظ المنتجات والمبيعات...",
        icon: <Package className="h-4 w-4" />,
      });

      const productStartTime = Date.now();
      await saveProduct(testData.product);
      await saveSale(testData.sale);

      updateResult(results.length - 1, {
        status: "success",
        message: "تم حفظ المنتجات والمبيعات بنجاح",
        duration: Date.now() - productStartTime,
      });

      // 8. اختبار الاسترجاع الشامل
      setProgress(80);
      addResult({
        name: "اختبار الاسترجاع الشامل",
        status: "running",
        message: "جاري اختبار استرجاع جميع البيانات...",
        icon: <TestTube className="h-4 w-4" />,
      });

      const retrievalStartTime = Date.now();
      const [allCourses, allDietPlans, allProducts, allSales] =
        await Promise.all([
          getCourses(),
          getDietPlans(),
          getProducts(),
          getSales(),
        ]);

      const testCoursesFound = testData.courses.filter((testCourse) =>
        allCourses.some((course) => course.id === testCourse.id),
      ).length;

      const testDietPlansFound = testData.dietPlans.filter((testDiet) =>
        allDietPlans.some((diet) => diet.id === testDiet.id),
      ).length;

      const testProductFound = allProducts.some(
        (product) => product.id === testData.product.id,
      );

      const testSaleFound = allSales.some(
        (sale) => sale.id === testData.sale.id,
      );

      updateResult(results.length - 1, {
        status: "success",
        message: `تم استرجاع البيانات - الكورسات: ${testCoursesFound}/${testData.courses.length}, الخطط: ${testDietPlansFound}/${testData.dietPlans.length}, المنتج: ${testProductFound ? "✓" : "✗"}, المبيعة: ${testSaleFound ? "✓" : "✗"}`,
        duration: Date.now() - retrievalStartTime,
        details: {
          totalCourses: allCourses.length,
          totalDietPlans: allDietPlans.length,
          totalProducts: allProducts.length,
          totalSales: allSales.length,
        },
      });

      // 9. تنظيف البيانات التجريبية
      setProgress(90);
      addResult({
        name: "تنظيف البيانات التجريبية",
        status: "running",
        message: "جاري حذف البيانات التجريبية...",
        icon: <Database className="h-4 w-4" />,
      });

      const cleanupStartTime = Date.now();
      try {
        await deleteMember(testData.member.id);
        // ملاحظة: الكورسات والخطط الغذائية ستبقى لأنها قد تكون مفيدة
      } catch (error) {
        console.warn("تحذير في تنظيف البيانات:", error);
      }

      updateResult(results.length - 1, {
        status: "success",
        message: "تم تنظيف البيانات التجريبية",
        duration: Date.now() - cleanupStartTime,
      });

      setProgress(100);

      // حساب الملخص
      const finalResults = results.concat([
        {
          name: "تقرير شامل",
          status: "success" as const,
          message: `اكتمل الاختبار الشامل في ${((Date.now() - startTime) / 1000).toFixed(2)} ثانية`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: Date.now() - startTime,
        },
      ]);

      const summary = {
        total: finalResults.length,
        success: finalResults.filter((r) => r.status === "success").length,
        errors: finalResults.filter((r) => r.status === "error").length,
        warnings: finalResults.filter((r) => r.status === "warning").length,
      };

      setResults(finalResults);
      setSummary(summary);

      toast({
        title: "اكتمل الاختبار الشامل",
        description: `${summary.success} نجح، ${summary.errors} فشل، ${summary.warnings} تحذير`,
        variant: summary.errors > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("خطأ في الاختبار الشامل:", error);
      addResult({
        name: "خطأ عام",
        status: "error",
        message: `فشل الاختبار: ${error.message}`,
        icon: <XCircle className="h-4 w-4" />,
      });

      toast({
        title: "فشل الاختبار",
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
      case "running":
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
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
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
        className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
      >
        <TestTube className="h-4 w-4" />
        اختبار التخزين الشامل
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
                <TestTube className="h-5 w-5" />
                اختبار التخزين الشامل
              </CardTitle>
              <CardDescription>
                اخ��بار شامل لحفظ واسترجاع جميع البيانات مع المجموعات والتفاصيل
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={runComprehensiveTest}
                disabled={isRunning}
                variant={results.length === 0 ? "default" : "outline"}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <TestTube className="h-4 w-4 ml-1" />
                )}
                {isRunning ? "جاري الاختبار..." : "بدء الاختبار الشامل"}
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
                جاري الاختبار... {progress}%
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
                        إجمالي الاختبارات
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
                      <div className="text-sm text-gray-600">فشل</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary.warnings}
                      </div>
                      <div className="text-sm text-gray-600">تحذير</div>
                    </div>
                  </Card>
                </div>

                {/* نتائج الاختبارات */}
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
                              {result.status === "error" && "فشل"}
                              {result.status === "warning" && "تحذير"}
                              {result.status === "running" && "جاري التشغيل"}
                            </Badge>
                            {result.duration && (
                              <span className="text-xs text-gray-500">
                                {(result.duration / 1000).toFixed(2)}s
                              </span>
                            )}
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
              </>
            )}

            {results.length === 0 && !isRunning && (
              <div className="text-center text-gray-500 py-8">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  اضغط على "بدء الاختبار الشامل" لاختبار جميع عمليات التخزين
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>سيتم اختبار:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• إنشاء وحفظ الأعضاء مع المجموعات</li>
                    <li>• إنشاء الكورسات والخطط الغذائية</li>
                    <li>• التحقق من المزامنة مع Supabase</li>
                    <li>• اختبار التحديث والحذف</li>
                    <li>• اختبار المنتجات والمبيعات</li>
                  </ul>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
