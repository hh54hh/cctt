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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";
import { supabaseManager } from "@/lib/supabase";
import { getMembers, getMemberById } from "@/lib/storage-new";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  duration?: number;
}

export default function MembersSupabaseTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const runMembersSupabaseTest = async () => {
    setIsRunning(true);
    setResults([]);

    const startTime = Date.now();

    try {
      // 1. اختبار اتصال Supabase المباشر
      const supabaseStartTime = Date.now();
      try {
        const supabase = supabaseManager.getClient();
        const { data, error } = await supabase.from("members").select("count", {
          count: "exact",
          head: true,
        });

        if (error) throw error;

        setResults((prev) => [
          ...prev,
          {
            test: "اتصال Supabase المباشر",
            status: "success",
            message: "تم الاتصال بـ Supabase بنجاح",
            duration: Date.now() - supabaseStartTime,
          },
        ]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "اتصال Supabase المباشر",
            status: "error",
            message: `فشل الاتصال: ${error.message}`,
            details: error,
            duration: Date.now() - supabaseStartTime,
          },
        ]);
      }

      // 2. اختبار استرجاع الأعضاء من النظام المحلي
      const localStartTime = Date.now();
      try {
        const localMembers = await getMembers();
        setResults((prev) => [
          ...prev,
          {
            test: "استرجاع الأعضاء محلياً",
            status: "success",
            message: `تم استرجاع ${localMembers.length} عضو من قاعدة البيانات المحلية`,
            details: { count: localMembers.length, members: localMembers },
            duration: Date.now() - localStartTime,
          },
        ]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "استرجاع الأعضاء محلياً",
            status: "error",
            message: `فشل استرجاع الأعضاء: ${error.message}`,
            details: error,
            duration: Date.now() - localStartTime,
          },
        ]);
      }

      // 3. اختبار استرجاع الأعضاء مباشرة من Supabase
      const supabaseMembersStartTime = Date.now();
      try {
        const supabase = supabaseManager.getClient();
        const { data: supabaseMembers, error } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setResults((prev) => [
          ...prev,
          {
            test: "استرجاع الأعضاء من Supabase",
            status: "success",
            message: `تم استرجاع ${supabaseMembers?.length || 0} عضو من Supabase مباشرة`,
            details: {
              count: supabaseMembers?.length || 0,
              members: supabaseMembers || [],
            },
            duration: Date.now() - supabaseMembersStartTime,
          },
        ]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "استرجاع الأعضاء من Supabase",
            status: "error",
            message: `فشل استرجاع الأعضاء من Supabase: ${error.message}`,
            details: error,
            duration: Date.now() - supabaseMembersStartTime,
          },
        ]);
      }

      // 4. مقارنة البيانات المحلية مع Supabase
      const compareStartTime = Date.now();
      try {
        const localMembers = await getMembers();
        const supabase = supabaseManager.getClient();
        const { data: supabaseMembers, error } = await supabase
          .from("members")
          .select("*");

        if (error) throw error;

        const localCount = localMembers.length;
        const supabaseCount = supabaseMembers?.length || 0;
        const diff = Math.abs(localCount - supabaseCount);

        let status: "success" | "warning" | "error" = "success";
        let message = "";

        if (localCount === supabaseCount) {
          status = "success";
          message = `البيانات متطابقة تماماً (${localCount} عضو في كلا المكانين)`;
        } else if (diff <= 2) {
          status = "warning";
          message = `فرق بسيط: محلي ${localCount}، Supabase ${supabaseCount} (الفرق: ${diff})`;
        } else {
          status = "error";
          message = `فرق كبير: محلي ${localCount}، Supabase ${supabaseCount} (الفرق: ${diff})`;
        }

        setResults((prev) => [
          ...prev,
          {
            test: "مقارنة البيانات",
            status,
            message,
            details: {
              local: localCount,
              supabase: supabaseCount,
              difference: diff,
              localMembers: localMembers.map((m) => ({
                id: m.id,
                name: m.name,
              })),
              supabaseMembers: supabaseMembers?.map((m) => ({
                id: m.id,
                name: m.name,
              })),
            },
            duration: Date.now() - compareStartTime,
          },
        ]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "مقارنة البيانات",
            status: "error",
            message: `فشل مقارنة البيانات: ${error.message}`,
            details: error,
            duration: Date.now() - compareStartTime,
          },
        ]);
      }

      // 5. اختبار إنشاء عضو تجريبي جديد
      const createTestStartTime = Date.now();
      try {
        const testMember = {
          id: `test-member-${Date.now()}`,
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
              id: "test-group-1",
              title: "مجموعة اختبار",
              courseIds: ["course-1"],
              createdAt: new Date(),
            },
          ],
          dietPlanGroups: [],
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // حفظ العضو
        const { saveMember } = await import("@/lib/storage-new");
        await saveMember(testMember);

        // انتظار قليل للمزامنة
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // التحقق من الحفظ في Supabase
        const supabase = supabaseManager.getClient();
        const { data: savedMember, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", testMember.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setResults((prev) => [
          ...prev,
          {
            test: "إنشاء عضو تجريبي",
            status: savedMember ? "success" : "warning",
            message: savedMember
              ? "تم إنشاء العضو وحفظه في Supabase بنجاح"
              : "تم إنشاء العضو محلياً، جاري المزامنة مع Supabase",
            details: {
              testMember,
              savedInSupabase: !!savedMember,
              supabaseMember: savedMember,
            },
            duration: Date.now() - createTestStartTime,
          },
        ]);

        // حذف العضو التجريبي
        const { deleteMember } = await import("@/lib/storage-new");
        await deleteMember(testMember.id);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "إنشاء عضو تجريبي",
            status: "error",
            message: `فشل إنشاء العضو التجريبي: ${error.message}`,
            details: error,
            duration: Date.now() - createTestStartTime,
          },
        ]);
      }

      // 6. اختبار تفاصيل المجموعات للأعضاء الموجودين
      const groupsTestStartTime = Date.now();
      try {
        const localMembers = await getMembers();
        const membersWithGroups = localMembers.filter(
          (member) =>
            member.courseGroups?.length > 0 ||
            member.dietPlanGroups?.length > 0,
        );

        let groupsTestStatus: "success" | "warning" | "error" = "success";
        let groupsMessage = "";

        if (membersWithGroups.length === 0) {
          groupsTestStatus = "warning";
          groupsMessage = "لا يوجد أعضاء بمجموعات محفوظة";
        } else {
          groupsTestStatus = "success";
          groupsMessage = `تم العثور على ${membersWithGroups.length} عضو بمجموعات`;
        }

        // اختبار عضو واحد بالتفصيل
        if (membersWithGroups.length > 0) {
          const testMember = membersWithGroups[0];
          const memberDetails = await getMemberById(testMember.id);

          setResults((prev) => [
            ...prev,
            {
              test: "اختبار تفاصيل المجموعات",
              status: groupsTestStatus,
              message: groupsMessage,
              details: {
                totalMembers: localMembers.length,
                membersWithGroups: membersWithGroups.length,
                sampleMember: {
                  id: testMember.id,
                  name: testMember.name,
                  courseGroupsCount: testMember.courseGroups?.length || 0,
                  dietPlanGroupsCount: testMember.dietPlanGroups?.length || 0,
                  courseGroups: testMember.courseGroups,
                  dietPlanGroups: testMember.dietPlanGroups,
                },
                retrievedDetails: memberDetails,
              },
              duration: Date.now() - groupsTestStartTime,
            },
          ]);
        } else {
          setResults((prev) => [
            ...prev,
            {
              test: "اختبار تفاصيل المجموعات",
              status: groupsTestStatus,
              message: groupsMessage,
              details: {
                totalMembers: localMembers.length,
                membersWithGroups: 0,
              },
              duration: Date.now() - groupsTestStartTime,
            },
          ]);
        }
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            test: "اختبار تفاصيل المجموعات",
            status: "error",
            message: `فشل اختبار المجموعات: ${error.message}`,
            details: error,
            duration: Date.now() - groupsTestStartTime,
          },
        ]);
      }

      toast({
        title: "اكتمل اختبار صفحة الأعضاء",
        description: "تم فحص الربط مع Supabase بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("خطأ في اختبار صفحة الأعضاء:", error);
      toast({
        title: "خطأ في الاختبار",
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
        className="flex items-center gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
      >
        <Users className="h-4 w-4" />
        اختبار ربط صفحة الأعضاء
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden" dir="rtl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                اختبار ربط صفحة الأعضاء مع Supabase
              </CardTitle>
              <CardDescription>
                فحص مفصل للتأكد من أن صفحة الأعضاء مرتبطة بشكل صحيح مع قاعدة
                البيانات
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={runMembersSupabaseTest}
                disabled={isRunning}
                variant={results.length === 0 ? "default" : "outline"}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Database className="h-4 w-4 ml-1" />
                )}
                {isRunning ? "جاري الاختبار..." : "بدء الاختبار"}
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
        </CardHeader>

        <CardContent className="p-6">
          <ScrollArea className="h-[60vh]">
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getStatusIcon(result.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{result.test}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status === "success" && "نجح"}
                            {result.status === "error" && "فشل"}
                            {result.status === "warning" && "تحذير"}
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
                              className="mt-2 p-2 bg-gray-50 rounded text-left max-h-40 overflow-y-auto"
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>اضغط على "بدء الاختبار" لفحص ربط صفحة الأعضاء مع Supabase</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>سيتم اختبار:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• اتصال Supabase المباشر</li>
                    <li>• استرجاع الأعضاء محلياً ومن Supabase</li>
                    <li>• مقارنة البيانات بين المصدرين</li>
                    <li>• إنشاء عضو تجريبي واختبار المزامنة</li>
                    <li>• فحص تفاصيل المجموعات</li>
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
