import React, { useState } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  CheckCircle,
  XCircle,
  Wrench,
  Users,
  AlertTriangle,
} from "lucide-react";

import { getMembers, updateMember } from "../lib/storage-new";
import { syncManager } from "../lib/sync-manager";
import { supabaseManager } from "../lib/supabase";
import type { Member } from "../lib/types";

interface FixResult {
  memberId: string;
  memberName: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function MemberGroupsQuickFix() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    fixed: 0,
    errors: 0,
    warnings: 0,
  });

  const runQuickFix = async () => {
    setIsRunning(true);
    setResults([]);
    setStats({ total: 0, fixed: 0, errors: 0, warnings: 0 });

    try {
      // الحصول على جميع الأعضاء
      const members = await getMembers();
      console.log(`🔧 بدء إصلاح ${members.length} عضو...`);

      const fixResults: FixResult[] = [];
      let fixed = 0;
      let errors = 0;
      let warnings = 0;

      for (const member of members) {
        try {
          let needsUpdate = false;
          const updatedMember = { ...member };

          // إصلاح courseGroups إذا لم تكن array صحيحة
          if (!Array.isArray(member.courseGroups)) {
            updatedMember.courseGroups = [];
            needsUpdate = true;
          }

          // إصلاح dietPlanGroups إذا لم تكن array صحيحة
          if (!Array.isArray(member.dietPlanGroups)) {
            updatedMember.dietPlanGroups = [];
            needsUpdate = true;
          }

          // إصلاح courses إذا لم تكن array صحيحة
          if (!Array.isArray(member.courses)) {
            updatedMember.courses = [];
            needsUpdate = true;
          }

          // إصلاح dietPlans إذا لم تكن array صحيحة
          if (!Array.isArray(member.dietPlans)) {
            updatedMember.dietPlans = [];
            needsUpdate = true;
          }

          if (needsUpdate) {
            // تحديث العضو محلياً
            await updateMember(updatedMember);

            // مزامنة مع Supabase
            try {
              await syncManager.syncMember(updatedMember);
              fixResults.push({
                memberId: member.id,
                memberName: member.name,
                status: "success",
                message: "تم إصلاح ومزامنة البيانات بنجاح",
                details: {
                  courseGroups: updatedMember.courseGroups.length,
                  dietPlanGroups: updatedMember.dietPlanGroups.length,
                  courses: updatedMember.courses.length,
                  dietPlans: updatedMember.dietPlans.length,
                },
              });
              fixed++;
            } catch (syncError) {
              fixResults.push({
                memberId: member.id,
                memberName: member.name,
                status: "warning",
                message: "تم إصلاح البيانات محلياً لكن فشلت المزامنة",
                details: {
                  syncError:
                    syncError instanceof Error
                      ? syncError.message
                      : String(syncError),
                },
              });
              warnings++;
            }
          } else {
            fixResults.push({
              memberId: member.id,
              memberName: member.name,
              status: "success",
              message: "البيانات سليمة - لا تحتاج إصلاح",
              details: {
                courseGroups: member.courseGroups.length,
                dietPlanGroups: member.dietPlanGroups.length,
                courses: member.courses.length,
                dietPlans: member.dietPlans.length,
              },
            });
          }
        } catch (error) {
          fixResults.push({
            memberId: member.id,
            memberName: member.name,
            status: "error",
            message: `خطأ في الإصلاح: ${error instanceof Error ? error.message : String(error)}`,
            details: { error },
          });
          errors++;
        }
      }

      setResults(fixResults);
      setStats({
        total: members.length,
        fixed,
        errors,
        warnings,
      });

      console.log(
        `✅ انتهى الإصلاح: ${fixed} مُصلح، ${errors} أخطاء، ${warnings} تحذيرات`,
      );
    } catch (error) {
      console.error("خطأ في عملية الإصلاح:", error);
      setResults([
        {
          memberId: "error",
          memberName: "خطأ عام",
          status: "error",
          message: `فشل في تشغيل الإصلاح: ${error instanceof Error ? error.message : String(error)}`,
          details: { error },
        },
      ]);
      setStats({ total: 0, fixed: 0, errors: 1, warnings: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  const testSupabaseDirectly = async () => {
    try {
      console.log("🔍 اختبار Supabase مباشرة...");
      const client = supabaseManager.getClient();
      const { data, error } = await client
        .from("members")
        .select("id, name, course_groups, diet_plan_groups")
        .limit(5);

      if (error) {
        console.error("خطأ في Supabase:", error);
        return;
      }

      console.log("✅ بيانات Supabase:", data);

      // عرض البيانات في console للمراجعة
      data?.forEach((member: any) => {
        console.log(`العضو ${member.name}:`, {
          courseGroups: member.course_groups,
          dietPlanGroups: member.diet_plan_groups,
        });
      });
    } catch (error) {
      console.error("خطأ في اختبار Supabase:", error);
    }
  };

  const getStatusIcon = (status: FixResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: FixResult["status"]) => {
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wrench className="h-4 w-4" />
        إصلاح سريع للمجموعات
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
                <Wrench className="h-5 w-5" />
                إصلاح سريع لمجموعات الأعضاء
              </CardTitle>
              <CardDescription>
                إصلاح مشاكل تخزين courseGroups و dietPlanGroups
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
                <div className="text-sm text-blue-600">إجمالي الأعضاء</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.fixed}
                </div>
                <div className="text-sm text-green-600">تم إصلاحها</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.errors}
                </div>
                <div className="text-sm text-red-600">أخطاء</div>
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
              onClick={runQuickFix}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Wrench className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {isRunning ? "جاري الإصلاح..." : "تشغيل الإصلاح السريع"}
            </Button>

            <Button
              onClick={testSupabaseDirectly}
              variant="outline"
              disabled={isRunning}
            >
              اختبار Supabase
            </Button>

            {results.length > 0 && (
              <Button variant="outline" onClick={() => setResults([])}>
                مسح النتائج
              </Button>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ما يفعله هذا الإصلاح:</strong>
              <br />• يتحقق من أن courseGroups و dietPlanGroups هي arrays ص��يحة
              <br />• يصلح أي بيانات معطوبة أو مفقودة
              <br />• يزامن البيانات المُصححة مع Supabase
              <br />• يعرض تقرير مفصل عن النتائج
            </AlertDescription>
          </Alert>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.memberName}</div>
                          <div className="text-sm text-gray-600">
                            {result.message}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {result.memberId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.status)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
