import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  Apple,
  Database,
  Search,
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
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Import storage functions
import {
  saveMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getCourses,
  getDietPlans,
  saveCourse,
  saveDietPlan,
} from "../lib/storage-new";
import { syncManager } from "../lib/sync-manager";
import { supabaseManager } from "../lib/supabase";
import type {
  Member,
  Course,
  DietPlan,
  CourseGroup,
  DietPlanGroup,
} from "../lib/types";

interface TestResult {
  id: string;
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  timestamp: Date;
}

export default function MemberGroupsStorageDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testMember, setTestMember] = useState<Member | null>(null);

  // Generate test data
  const generateTestMember = (): Member => {
    const timestamp = Date.now();
    return {
      id: `test-member-groups-${timestamp}`,
      name: "عضو تجريبي للمجموعات",
      phone: `05${Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(8, "0")}`,
      age: 25,
      height: 175,
      weight: 70,
      gender: "male" as const,
      courses: ["course-1", "course-2"], // الكورسات الفردية
      dietPlans: ["diet-1", "diet-2"], // النظم الغذائية الفردية
      courseGroups: [
        {
          id: `group-courses-${timestamp}`,
          title: "مجموعة كورسات تجريبية",
          courseIds: ["course-3", "course-4", "course-5"],
          createdAt: new Date(),
        },
        {
          id: `group-courses-2-${timestamp}`,
          title: "مجموعة كورسات ثانية",
          courseIds: ["course-6", "course-7"],
          createdAt: new Date(),
        },
      ] as CourseGroup[],
      dietPlanGroups: [
        {
          id: `group-diet-${timestamp}`,
          title: "مجموعة أنظمة غذائية تجريبية",
          dietPlanIds: ["diet-3", "diet-4"],
          createdAt: new Date(),
        },
        {
          id: `group-diet-2-${timestamp}`,
          title: "مجموعة أنظمة غذائية ثانية",
          dietPlanIds: ["diet-5"],
          createdAt: new Date(),
        },
      ] as DietPlanGroup[],
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const addResult = (result: Omit<TestResult, "id" | "timestamp">) => {
    const newResult: TestResult = {
      ...result,
      id: `result-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setResults((prev) => [...prev, newResult]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setTestMember(null);

    try {
      // إنشاء كورسات وأنظمة غذائية تجريبية أولاً
      await setupTestData();

      // اختبار حفظ عضو مع مجموعات
      await testSaveMemberWithGroups();

      // اختبار استرجاع العضو والتحقق من المجموعات
      await testRetrieveMemberWithGroups();

      // اختبار تحديث المجموعات
      await testUpdateMemberGroups();

      // اختبار المزامنة مع Supabase
      await testSupabaseSync();

      // اختبار التحقق من البيانات في Supabase مباشرة
      await testSupabaseDirectRead();

      // تنظيف البيانات التجريبية
      await cleanupTestData();
    } catch (error) {
      addResult({
        test: "خطأ عام في التشخيص",
        status: "error",
        message: `خطأ غير متوقع: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const setupTestData = async () => {
    addResult({
      test: "إعداد البيانات التجريبية",
      status: "success",
      message: "تم إنشاء الكورسات والأنظمة الغذائية التجريبية",
    });

    // إنشاء كورسات تجريبية
    const testCourses = [
      { id: "course-1", name: "كورس 1", createdAt: new Date() },
      { id: "course-2", name: "كورس 2", createdAt: new Date() },
      { id: "course-3", name: "كورس 3", createdAt: new Date() },
      { id: "course-4", name: "كورس 4", createdAt: new Date() },
      { id: "course-5", name: "كورس 5", createdAt: new Date() },
      { id: "course-6", name: "كورس 6", createdAt: new Date() },
      { id: "course-7", name: "كورس 7", createdAt: new Date() },
    ];

    // إنشاء أنظمة غذائية تجريبية
    const testDietPlans = [
      { id: "diet-1", name: "نظام غذائي 1", createdAt: new Date() },
      { id: "diet-2", name: "نظام غذائي 2", createdAt: new Date() },
      { id: "diet-3", name: "نظام غذائي 3", createdAt: new Date() },
      { id: "diet-4", name: "نظام غذائي 4", createdAt: new Date() },
      { id: "diet-5", name: "نظام غذائي 5", createdAt: new Date() },
    ];

    try {
      // حفظ الكورسات
      for (const course of testCourses) {
        await saveCourse(course);
      }

      // حفظ الأنظمة الغذائية
      for (const dietPlan of testDietPlans) {
        await saveDietPlan(dietPlan);
      }

      addResult({
        test: "إنشاء البيانات المرجعية",
        status: "success",
        message: `تم إنشاء ${testCourses.length} كورسات و ${testDietPlans.length} أنظمة غذائية`,
      });
    } catch (error) {
      addResult({
        test: "إنشاء البيانات المرجعية",
        status: "error",
        message: `فشل في إنشاء البيانات: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const testSaveMemberWithGroups = async () => {
    try {
      const member = generateTestMember();
      setTestMember(member);

      await saveMember(member);

      addResult({
        test: "حفظ عضو مع مجموعات",
        status: "success",
        message: `تم حفظ العضو مع ${member.courseGroups.length} مجموعة كورسات و ${member.dietPlanGroups.length} مجموعة أنظمة غذائية`,
        details: {
          memberID: member.id,
          courseGroups: member.courseGroups,
          dietPlanGroups: member.dietPlanGroups,
          individualCourses: member.courses,
          individualDietPlans: member.dietPlans,
        },
      });
    } catch (error) {
      addResult({
        test: "حفظ عضو مع مجموعات",
        status: "error",
        message: `فشل في حفظ العضو: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const testRetrieveMemberWithGroups = async () => {
    if (!testMember) {
      addResult({
        test: "استرجاع العضو مع المجموعات",
        status: "error",
        message: "لا يوجد عضو تجريبي للاختبار",
      });
      return;
    }

    try {
      // اختبار استرجاع العضو بـ ID
      const retrievedMember = await getMemberById(testMember.id);

      if (!retrievedMember) {
        addResult({
          test: "استرجاع العضو مع المجموعات",
          status: "error",
          message: "فشل في العثور على العضو المحفوظ",
        });
        return;
      }

      // التحقق من وجود المجموعات
      const courseGroupsMatch =
        JSON.stringify(retrievedMember.courseGroups) ===
        JSON.stringify(testMember.courseGroups);
      const dietPlanGroupsMatch =
        JSON.stringify(retrievedMember.dietPlanGroups) ===
        JSON.stringify(testMember.dietPlanGroups);
      const coursesMatch =
        JSON.stringify(retrievedMember.courses) ===
        JSON.stringify(testMember.courses);
      const dietPlansMatch =
        JSON.stringify(retrievedMember.dietPlans) ===
        JSON.stringify(testMember.dietPlans);

      if (
        courseGroupsMatch &&
        dietPlanGroupsMatch &&
        coursesMatch &&
        dietPlansMatch
      ) {
        addResult({
          test: "استرجاع العضو مع المجموعات",
          status: "success",
          message: "تم استرجاع العضو مع جميع المجموعات بنجاح",
          details: {
            courseGroups: retrievedMember.courseGroups.length,
            dietPlanGroups: retrievedMember.dietPlanGroups.length,
            courses: retrievedMember.courses.length,
            dietPlans: retrievedMember.dietPlans.length,
          },
        });
      } else {
        addResult({
          test: "استرجاع العضو مع المجموعات",
          status: "error",
          message: "البيانات المسترجعة لا تطابق البيانات المحفوظة",
          details: {
            courseGroupsMatch,
            dietPlanGroupsMatch,
            coursesMatch,
            dietPlansMatch,
            saved: {
              courseGroups: testMember.courseGroups,
              dietPlanGroups: testMember.dietPlanGroups,
              courses: testMember.courses,
              dietPlans: testMember.dietPlans,
            },
            retrieved: {
              courseGroups: retrievedMember.courseGroups,
              dietPlanGroups: retrievedMember.dietPlanGroups,
              courses: retrievedMember.courses,
              dietPlans: retrievedMember.dietPlans,
            },
          },
        });
      }
    } catch (error) {
      addResult({
        test: "استرجاع العضو مع المجموعات",
        status: "error",
        message: `خطأ في استرجاع العضو: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const testUpdateMemberGroups = async () => {
    if (!testMember) {
      addResult({
        test: "تحديث مجموعات العضو",
        status: "error",
        message: "لا يوجد عضو تجريبي للاختبار",
      });
      return;
    }

    try {
      // إضافة مجموعة جديدة
      const updatedMember = {
        ...testMember,
        courseGroups: [
          ...testMember.courseGroups,
          {
            id: `new-group-${Date.now()}`,
            title: "مجموعة جديدة",
            courseIds: ["course-1", "course-2"],
            createdAt: new Date(),
          },
        ],
        dietPlanGroups: [
          ...testMember.dietPlanGroups,
          {
            id: `new-diet-group-${Date.now()}`,
            title: "مجموعة نظام غذائي جديد",
            dietPlanIds: ["diet-1"],
            createdAt: new Date(),
          },
        ],
        updatedAt: new Date(),
      };

      await updateMember(updatedMember);

      // التحقق من التحديث
      const retrievedUpdated = await getMemberById(testMember.id);
      if (retrievedUpdated) {
        if (
          retrievedUpdated.courseGroups.length ===
            updatedMember.courseGroups.length &&
          retrievedUpdated.dietPlanGroups.length ===
            updatedMember.dietPlanGroups.length
        ) {
          addResult({
            test: "تحديث مجموعات العضو",
            status: "success",
            message: `تم تحديث المجموعات بنجاح - ${retrievedUpdated.courseGroups.length} مجموعة كورسات، ${retrievedUpdated.dietPlanGroups.length} مجموعة أنظمة غذائية`,
            details: {
              oldCourseGroupsCount: testMember.courseGroups.length,
              newCourseGroupsCount: retrievedUpdated.courseGroups.length,
              oldDietGroupsCount: testMember.dietPlanGroups.length,
              newDietGroupsCount: retrievedUpdated.dietPlanGroups.length,
            },
          });

          // تحديث testMember للاختبارات التالية
          setTestMember(retrievedUpdated);
        } else {
          addResult({
            test: "تحديث مجموعات العضو",
            status: "error",
            message: "فشل في تحديث المجموعات",
            details: {
              expected: {
                courseGroups: updatedMember.courseGroups.length,
                dietPlanGroups: updatedMember.dietPlanGroups.length,
              },
              actual: {
                courseGroups: retrievedUpdated.courseGroups.length,
                dietPlanGroups: retrievedUpdated.dietPlanGroups.length,
              },
            },
          });
        }
      }
    } catch (error) {
      addResult({
        test: "تحديث مجموعات العضو",
        status: "error",
        message: `خطأ في تحديث المجموعات: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const testSupabaseSync = async () => {
    if (!testMember) {
      addResult({
        test: "مزامنة Supabase",
        status: "error",
        message: "لا يوجد عضو تجريبي للاختبار",
      });
      return;
    }

    try {
      // محاولة مزامنة العضو مع Supabase
      await syncManager.syncMember(testMember);

      addResult({
        test: "مزامنة Supabase",
        status: "success",
        message: "تم إرسال العضو للمزامنة مع Supabase",
        details: {
          memberID: testMember.id,
          syncTime: new Date().toISOString(),
        },
      });

      // إنتظار قصير للمزامنة
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      addResult({
        test: "مزامنة Supabase",
        status: "error",
        message: `خطأ في المزامنة: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const testSupabaseDirectRead = async () => {
    if (!testMember) {
      addResult({
        test: "قراءة مباشرة من Supabase",
        status: "error",
        message: "لا يوجد عضو تجريبي للاختبار",
      });
      return;
    }

    try {
      const client = supabaseManager.getClient();
      const { data, error } = await client
        .from("members")
        .select("*")
        .eq("id", testMember.id)
        .single();

      if (error) {
        addResult({
          test: "قراءة مباشرة من Supabase",
          status: "error",
          message: `خطأ في قراءة البيانات من Supabase: ${error.message}`,
          details: error,
        });
        return;
      }

      if (!data) {
        addResult({
          test: "قراءة مباشرة من Supabase",
          status: "warning",
          message:
            "لا توجد بيانات في Supabase للعضو (ربما لم تتم المزامنة بعد)",
        });
        return;
      }

      // التحقق من وجود البيانات الصحيحة
      const hasCoursesData = data.courses && Array.isArray(data.courses);
      const hasDietPlansData =
        data.diet_plans && Array.isArray(data.diet_plans);
      const hasCourseGroupsData = data.course_groups;
      const hasDietPlanGroupsData = data.diet_plan_groups;

      addResult({
        test: "قراءة مباشرة من Supabase",
        status: "success",
        message: "تم العثور على العضو في Supabase",
        details: {
          memberData: data,
          hasCoursesData,
          hasDietPlansData,
          hasCourseGroupsData,
          hasDietPlanGroupsData,
          coursesCount: hasCoursesData ? data.courses.length : 0,
          dietPlansCount: hasDietPlansData ? data.diet_plans.length : 0,
        },
      });

      // التحقق من تطابق البيانات
      if (hasCoursesData && hasDietPlansData) {
        const coursesMatch =
          JSON.stringify(data.courses.sort()) ===
          JSON.stringify(testMember.courses.sort());
        const dietPlansMatch =
          JSON.stringify(data.diet_plans.sort()) ===
          JSON.stringify(testMember.dietPlans.sort());

        if (coursesMatch && dietPlansMatch) {
          addResult({
            test: "تطابق البيانات مع Supabase",
            status: "success",
            message: "البيانات الفردية تتطابق مع Supabase",
          });
        } else {
          addResult({
            test: "تطابق البيانات مع Supabase",
            status: "warning",
            message: "البيانات الفردية لا تتطابق مع Supabase",
            details: {
              coursesMatch,
              dietPlansMatch,
              local: {
                courses: testMember.courses,
                dietPlans: testMember.dietPlans,
              },
              supabase: { courses: data.courses, diet_plans: data.diet_plans },
            },
          });
        }
      }

      // فحص المجموعات
      if (hasCourseGroupsData || hasDietPlanGroupsData) {
        addResult({
          test: "فحص مجموعات البيانات في Supabase",
          status: "success",
          message: "توجد بيانات مجموعات في Supabase",
          details: {
            courseGroups: data.course_groups,
            dietPlanGroups: data.diet_plan_groups,
          },
        });
      } else {
        addResult({
          test: "فحص مجموعات البيانات في Supabase",
          status: "warning",
          message: "لا توجد بيانات مجموعات في Supabase",
          details: {
            availableFields: Object.keys(data),
          },
        });
      }
    } catch (error) {
      addResult({
        test: "قراءة مباشرة من Supabase",
        status: "error",
        message: `خطأ في الاتصال بـ Supabase: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  };

  const cleanupTestData = async () => {
    try {
      if (testMember) {
        await deleteMember(testMember.id);
        addResult({
          test: "تنظيف البيانات التجريبية",
          status: "success",
          message: "تم حذف العضو التجريبي",
        });
      }
    } catch (error) {
      addResult({
        test: "تنظيف البيانات التجريبية",
        status: "warning",
        message: `تحذير في التنظيف: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "default" as const,
      error: "destructive" as const,
      warning: "secondary" as const,
    };

    const labels = {
      success: "نجح",
      error: "فشل",
      warning: "تحذير",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const stats = {
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
        <Users className="h-4 w-4" />
        تشخيص مجموعات الأعضاء
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                تشخيص تخزين مجموعات الأعضاء
              </CardTitle>
              <CardDescription>
                فحص شامل لتخزين الكورسات والأنظمة الغذائية مع بيانات الأعضاء
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>

          {/* Statistics */}
          {results.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-600">إجمالي الاختبارات</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.passed}
                </div>
                <div className="text-sm text-green-600">نجحت</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </div>
                <div className="text-sm text-red-600">فشلت</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.warnings}
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
                <Database className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isRunning ? "جاري التشخيص..." : "تشغيل تشخيص المجموعات"}
            </Button>

            {results.length > 0 && (
              <Button variant="outline" onClick={() => setResults([])}>
                مسح النتائج
              </Button>
            )}
          </div>

          {/* Test Member Info */}
          {testMember && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>العضو التجريبي:</strong> {testMember.name} (ID:{" "}
                {testMember.id})
                <br />
                <strong>المجموعات:</strong> {testMember.courseGroups.length}{" "}
                مجموعة كورسات، {testMember.dietPlanGroups.length} مجموعة أنظمة
                غذائية
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {results.map((result) => (
                  <Card key={result.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{result.test}</div>
                            <div className="text-sm text-gray-600">
                              {result.message}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          <span className="text-xs text-gray-500">
                            {result.timestamp.toLocaleTimeString("ar-SA")}
                          </span>
                        </div>
                      </div>
                      {result.details && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-40">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
