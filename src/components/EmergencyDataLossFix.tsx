import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Database,
  Shield,
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

import { getMembers, updateMember } from "../lib/storage-new";
import { supabaseManager } from "../lib/supabase";
import { syncManager } from "../lib/sync-manager";
import type { Member } from "../lib/types";

interface DataLossReport {
  memberId: string;
  memberName: string;
  issue: "local_empty" | "sync_lost" | "schema_mismatch" | "fixed";
  localData: {
    courses: number;
    dietPlans: number;
    courseGroups: number;
    dietPlanGroups: number;
  };
  supabaseData: {
    courses: number;
    dietPlans: number;
    courseGroups: number;
    dietPlanGroups: number;
  };
  timestamp: Date;
}

export default function EmergencyDataLossFix() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [reports, setReports] = useState<DataLossReport[]>([]);
  const [autoMonitoring, setAutoMonitoring] = useState(false);

  // Auto-monitor for data loss every 30 seconds
  useEffect(() => {
    if (!autoMonitoring) return;

    const interval = setInterval(() => {
      runEmergencyDiagnostics();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoMonitoring]);

  const runEmergencyDiagnostics = async () => {
    setIsRunning(true);
    const newReports: DataLossReport[] = [];

    try {
      console.log("🚨 بدء تشخيص فقدان البيانات الطارئ...");

      // 1. Get all members from local storage
      const localMembers = await getMembers();
      console.log(`📊 العثور على ${localMembers.length} عضو محلياً`);

      // 2. Get members from Supabase
      const client = supabaseManager.getClient();
      const { data: supabaseMembers, error } = await client
        .from("members")
        .select("*");

      if (error) {
        console.error("❌ خطأ في قراءة البيانات من Supabase:", error);
        return;
      }

      console.log(
        `☁️ العثور على ${supabaseMembers?.length || 0} عضو في Supabase`,
      );

      // 3. Compare local vs Supabase data
      for (const localMember of localMembers) {
        const supabaseMember = supabaseMembers?.find(
          (m) => m.id === localMember.id,
        );

        const localCourses = Array.isArray(localMember.courses)
          ? localMember.courses.length
          : 0;
        const localDietPlans = Array.isArray(localMember.dietPlans)
          ? localMember.dietPlans.length
          : 0;
        const localCourseGroups = Array.isArray(localMember.courseGroups)
          ? localMember.courseGroups.length
          : 0;
        const localDietPlanGroups = Array.isArray(localMember.dietPlanGroups)
          ? localMember.dietPlanGroups.length
          : 0;

        let supabaseCourses = 0;
        let supabaseDietPlans = 0;
        let supabaseCourseGroups = 0;
        let supabaseDietPlanGroups = 0;

        if (supabaseMember) {
          supabaseCourses = Array.isArray(supabaseMember.courses)
            ? supabaseMember.courses.length
            : 0;
          supabaseDietPlans = Array.isArray(supabaseMember.diet_plans)
            ? supabaseMember.diet_plans.length
            : 0;

          // Safely parse JSON/array data from Supabase
          try {
            if (supabaseMember.course_groups) {
              if (Array.isArray(supabaseMember.course_groups)) {
                supabaseCourseGroups = supabaseMember.course_groups.length;
              } else if (typeof supabaseMember.course_groups === "string") {
                const parsed = JSON.parse(supabaseMember.course_groups);
                supabaseCourseGroups = Array.isArray(parsed)
                  ? parsed.length
                  : 0;
              } else if (typeof supabaseMember.course_groups === "object") {
                supabaseCourseGroups = Array.isArray(
                  supabaseMember.course_groups,
                )
                  ? supabaseMember.course_groups.length
                  : 0;
              }
            }
          } catch (e) {
            console.warn(
              "خطأ في تحليل course_groups:",
              supabaseMember.course_groups,
              e,
            );
            supabaseCourseGroups = 0;
          }

          try {
            if (supabaseMember.diet_plan_groups) {
              if (Array.isArray(supabaseMember.diet_plan_groups)) {
                supabaseDietPlanGroups = supabaseMember.diet_plan_groups.length;
              } else if (typeof supabaseMember.diet_plan_groups === "string") {
                const parsed = JSON.parse(supabaseMember.diet_plan_groups);
                supabaseDietPlanGroups = Array.isArray(parsed)
                  ? parsed.length
                  : 0;
              } else if (typeof supabaseMember.diet_plan_groups === "object") {
                supabaseDietPlanGroups = Array.isArray(
                  supabaseMember.diet_plan_groups,
                )
                  ? supabaseMember.diet_plan_groups.length
                  : 0;
              }
            }
          } catch (e) {
            console.warn(
              "خطأ في تحليل diet_plan_groups:",
              supabaseMember.diet_plan_groups,
              e,
            );
            supabaseDietPlanGroups = 0;
          }
        }

        // Detect data loss patterns
        let issueType: DataLossReport["issue"] = "fixed";

        // Check if local has data but Supabase doesn't
        if (
          (localCourses > 0 ||
            localDietPlans > 0 ||
            localCourseGroups > 0 ||
            localDietPlanGroups > 0) &&
          supabaseCourses === 0 &&
          supabaseDietPlans === 0 &&
          supabaseCourseGroups === 0 &&
          supabaseDietPlanGroups === 0
        ) {
          issueType = "sync_lost";
        }

        // Check if both local and Supabase are empty but member exists
        if (
          localCourses === 0 &&
          localDietPlans === 0 &&
          localCourseGroups === 0 &&
          localDietPlanGroups === 0 &&
          supabaseCourses === 0 &&
          supabaseDietPlans === 0 &&
          supabaseCourseGroups === 0 &&
          supabaseDietPlanGroups === 0
        ) {
          issueType = "local_empty";
        }

        // Check for mismatched data
        if (
          localCourses !== supabaseCourses ||
          localDietPlans !== supabaseDietPlans ||
          localCourseGroups !== supabaseCourseGroups ||
          localDietPlanGroups !== supabaseDietPlanGroups
        ) {
          issueType = "schema_mismatch";
        }

        // Only report if there's an issue
        if (issueType !== "fixed") {
          newReports.push({
            memberId: localMember.id,
            memberName: localMember.name,
            issue: issueType,
            localData: {
              courses: localCourses,
              dietPlans: localDietPlans,
              courseGroups: localCourseGroups,
              dietPlanGroups: localDietPlanGroups,
            },
            supabaseData: {
              courses: supabaseCourses,
              dietPlans: supabaseDietPlans,
              courseGroups: supabaseCourseGroups,
              dietPlanGroups: supabaseDietPlanGroups,
            },
            timestamp: new Date(),
          });
        }
      }

      setReports(newReports);

      if (newReports.length > 0) {
        console.warn(
          `⚠️ تم اكتشاف ${newReports.length} مشكلة في فقدان البيانات!`,
        );
      } else {
        console.log("✅ لا توجد مشاكل في فقدان البيانات");
      }
    } catch (error) {
      console.error("❌ خطأ في التشخيص الطارئ:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const fixDataLoss = async (memberId: string) => {
    try {
      console.log(`🔧 بدء إصلاح البيانات للعضو: ${memberId}`);

      // Get latest local data
      const localMembers = await getMembers();
      const localMember = localMembers.find((m) => m.id === memberId);

      if (!localMember) {
        console.error("❌ لم يتم العثور على العضو محلياً");
        return;
      }

      // Force sync with proper data transformation
      const fixedMember = {
        ...localMember,
        courses: Array.isArray(localMember.courses) ? localMember.courses : [],
        dietPlans: Array.isArray(localMember.dietPlans)
          ? localMember.dietPlans
          : [],
        courseGroups: Array.isArray(localMember.courseGroups)
          ? localMember.courseGroups
          : [],
        dietPlanGroups: Array.isArray(localMember.dietPlanGroups)
          ? localMember.dietPlanGroups
          : [],
        updatedAt: new Date(),
      };

      // Update locally first
      await updateMember(fixedMember);

      // Force sync to Supabase with debugging
      console.log("📤 إرسال البيانات المُصححة إلى Supabase...");
      await syncManager.syncMember(fixedMember);

      // Verify the fix
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const client = supabaseManager.getClient();
      const { data: verifyData } = await client
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (verifyData) {
        console.log("✅ تم التحقق من الإصلاح في Supabase:", verifyData);
      }

      // Re-run diagnostics to update the report
      await runEmergencyDiagnostics();
    } catch (error) {
      console.error("❌ خطأ في إصلاح البيانات:", error);
    }
  };

  const fixAllDataLoss = async () => {
    for (const report of reports) {
      if (report.issue !== "fixed") {
        await fixDataLoss(report.memberId);
        // Small delay between fixes
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const preventDataLoss = async () => {
    try {
      console.log("🛡️ تطبيق الحماية من فقدان البيانات...");

      // Enable real-time monitoring
      setAutoMonitoring(true);

      // Try to automatically apply some fixes
      try {
        const client = supabaseManager.getClient();

        // Test connection first
        const { data: testData, error: testError } = await client
          .from("members")
          .select("count")
          .limit(1);

        if (!testError) {
          console.log("✅ اتصال Supabase ناجح");

          // Apply a simple safe update
          const { error: updateError } = await client.rpc("sql", {
            sql: `
              UPDATE members
              SET
                course_groups = COALESCE(course_groups, '[]'::jsonb),
                diet_plan_groups = COALESCE(diet_plan_groups, '[]'::jsonb),
                courses = COALESCE(courses, '{}'::text[]),
                diet_plans = COALESCE(diet_plans, '{}'::text[])
              WHERE
                course_groups IS NULL
                OR diet_plan_groups IS NULL
                OR courses IS NULL
                OR diet_plans IS NULL;
            `,
          });

          if (!updateError) {
            console.log("✅ تم تطبيق بعض الإصلاحات تلقائياً");
          } else {
            console.warn(
              "⚠️ لم يتم تطبيق الإصلاحات التلقائية:",
              updateError.message,
            );
          }
        }
      } catch (autoFixError) {
        console.warn("⚠️ الإصلاح التلقائي فشل:", autoFixError);
      }

      // Show manual fix instructions
      const manualFixes = `
-- تشغيل هذا في Supabase SQL Editor:
-- استخدم EMERGENCY_DATA_LOSS_FIX_V2.sql للإصلاح الكامل

-- إصلاح سريع:
UPDATE members SET
  courses = COALESCE(courses, '{}'::text[]),
  diet_plans = COALESCE(diet_plans, '{}'::text[]),
  course_groups = COALESCE(course_groups, '[]'::jsonb),
  diet_plan_groups = COALESCE(diet_plan_groups, '[]'::jsonb)
WHERE courses IS NULL OR diet_plans IS NULL
   OR course_groups IS NULL OR diet_plan_groups IS NULL;
      `;

      console.log("📝 للإصلاح الكامل، شغل هذا في Supabase SQL Editor:");
      console.log(manualFixes);

      console.log("✅ تم تفعيل المراقبة التلقائية");
    } catch (error) {
      console.error("❌ خطأ في تطبيق الحماية:", error);
    }
  };

  const runInstantFix = async () => {
    try {
      console.log("⚡ تشغيل الإصلاح الفوري...");

      // Fix all issues immediately
      await fixAllDataLoss();

      // Wait a bit then re-check
      setTimeout(async () => {
        await runEmergencyDiagnostics();
      }, 3000);
    } catch (error) {
      console.error("❌ خطأ في الإصلاح الفوري:", error);
    }
  };

  const getIssueIcon = (issue: DataLossReport["issue"]) => {
    switch (issue) {
      case "sync_lost":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "local_empty":
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case "schema_mismatch":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "fixed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getIssueLabel = (issue: DataLossReport["issue"]) => {
    switch (issue) {
      case "sync_lost":
        return "فقدان مزامنة";
      case "local_empty":
        return "بيانات فارغة";
      case "schema_mismatch":
        return "عدم تطابق";
      case "fixed":
        return "تم الإصلاح";
    }
  };

  const getIssueDescription = (issue: DataLossReport["issue"]) => {
    switch (issue) {
      case "sync_lost":
        return "البيانات موجودة محلياً لكن مفقودة في Supabase";
      case "local_empty":
        return "لا توجد كورسات أو أنظمة غذائية";
      case "schema_mismatch":
        return "البيانات مختلفة بين المحلي والسحابي";
      case "fixed":
        return "البيانات متطابقة وصحيحة";
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="destructive"
        size="sm"
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        إصلاح طارئ لفقدان البيانات
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                إصلاح طارئ لفقدان الكورسات والأنظمة الغذائية
              </CardTitle>
              <CardDescription>
                تشخيص وإصلاح مشكلة اختفاء البيانات من الأعضاء
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>

          {/* Quick Stats */}
          {reports.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reports.filter((r) => r.issue === "sync_lost").length}
                </div>
                <div className="text-sm text-red-600">فقدان مزامنة</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {reports.filter((r) => r.issue === "local_empty").length}
                </div>
                <div className="text-sm text-orange-600">بيانات فارغة</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {reports.filter((r) => r.issue === "schema_mismatch").length}
                </div>
                <div className="text-sm text-yellow-600">عدم تطابق</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reports.filter((r) => r.issue === "fixed").length}
                </div>
                <div className="text-sm text-green-600">تم الإصلاح</div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex gap-4 mb-6 flex-wrap">
            <Button
              onClick={runEmergencyDiagnostics}
              disabled={isRunning}
              className="gap-2"
              variant="destructive"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isRunning ? "جاري التشخيص..." : "تشخيص طارئ"}
            </Button>

            {reports.length > 0 && (
              <>
                <Button
                  onClick={runInstantFix}
                  variant="destructive"
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  إصلاح فوري
                </Button>

                <Button
                  onClick={fixAllDataLoss}
                  variant="default"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إصلاح جميع المشاكل
                </Button>

                <Button
                  onClick={preventDataLoss}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  تفعيل الحماية
                </Button>
              </>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={autoMonitoring ? "default" : "outline"}>
                {autoMonitoring ? "🔄 مراقبة تلقائية" : "⏸️ مراقبة متوقفة"}
              </Badge>
            </div>
          </div>

          {/* Emergency Alert */}
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>تحذير:</strong> تم اكتشاف مشكلة في اختفاء الكورسات
              والأنظمة الغذائية من بيانات الأعضاء.
              <br />
              <strong>الإجراء المطلوب:</strong> استخدم "تشخيص طارئ" لمعرفة
              المشاكل ثم "إصلاح جميع المشاكل" لحلها.
            </AlertDescription>
          </Alert>

          {/* Results */}
          {reports.length > 0 && (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {reports.map((report, index) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getIssueIcon(report.issue)}
                          <div>
                            <div className="font-medium text-right">
                              {report.memberName}
                            </div>
                            <div className="text-sm text-gray-600 text-right">
                              {getIssueDescription(report.issue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.timestamp.toLocaleString("ar-SA")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              report.issue === "fixed"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {getIssueLabel(report.issue)}
                          </Badge>
                          {report.issue !== "fixed" && (
                            <Button
                              onClick={() => fixDataLoss(report.memberId)}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              إصلاح
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Data Comparison */}
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-800 mb-1">
                            📱 البيانات المحلية
                          </div>
                          <div className="space-y-1 text-blue-700">
                            <div>الكورسات: {report.localData.courses}</div>
                            <div>
                              النظم الغذائية: {report.localData.dietPlans}
                            </div>
                            <div>
                              مجموعات الكورسات: {report.localData.courseGroups}
                            </div>
                            <div>
                              مجموعات النظم: {report.localData.dietPlanGroups}
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-800 mb-1">
                            ☁��� بيانات Supabase
                          </div>
                          <div className="space-y-1 text-purple-700">
                            <div>الكورسات: {report.supabaseData.courses}</div>
                            <div>
                              النظم الغذائية: {report.supabaseData.dietPlans}
                            </div>
                            <div>
                              مجموعات الكورسات:{" "}
                              {report.supabaseData.courseGroups}
                            </div>
                            <div>
                              مجموعات النظم:{" "}
                              {report.supabaseData.dietPlanGroups}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* No Issues Found */}
          {!isRunning && reports.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>ممتاز!</strong> لم يتم العثور على أي مشاكل في فقدان
                البيانات. جميع الكورسات والأنظمة الغذائية محفوظة بشكل صحيح.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
