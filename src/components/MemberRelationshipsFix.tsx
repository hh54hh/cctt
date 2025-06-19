import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Database,
  CheckCircle,
  Users,
  BookOpen,
  Utensils,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  checkRelationshipTables,
  getAllMembersWithRelationships,
  updateMemberWithRelationships,
  MemberWithRelationships,
} from "../lib/memberRelationships";
import { getMembers, getCourses, getDietPlans } from "../lib/storage-new";
import { supabase } from "../lib/supabase";

interface FixStatus {
  type: "success" | "warning" | "error" | "info";
  message: string;
}

export default function MemberRelationshipsFix() {
  const [isLoading, setIsLoading] = useState(false);
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [fixStatus, setFixStatus] = useState<FixStatus[]>([]);
  const [progress, setProgress] = useState(0);
  const [membersData, setMembersData] = useState<{
    total: number;
    withCourses: number;
    withDietPlans: number;
    fixed: number;
  }>({
    total: 0,
    withCourses: 0,
    withDietPlans: 0,
    fixed: 0,
  });

  useEffect(() => {
    checkTables();
    loadMembersStats();
  }, []);

  const checkTables = async () => {
    try {
      const result = await checkRelationshipTables();
      setTablesExist(result.exists);

      if (!result.exists) {
        setFixStatus([
          {
            type: "error",
            message: result.message,
          },
        ]);
      } else {
        setFixStatus([
          {
            type: "success",
            message: result.message,
          },
        ]);
      }
    } catch (error) {
      setTablesExist(false);
      setFixStatus([
        {
          type: "error",
          message: `خطأ في فحص الجداول: ${error}`,
        },
      ]);
    }
  };

  const loadMembersStats = async () => {
    try {
      const members = await getMembers();

      const stats = {
        total: members.length,
        withCourses: members.filter(
          (m) => m.courseGroups && m.courseGroups.length > 0,
        ).length,
        withDietPlans: members.filter(
          (m) => m.dietPlanGroups && m.dietPlanGroups.length > 0,
        ).length,
        fixed: 0,
      };

      setMembersData(stats);
    } catch (error) {
      console.error("Error loading members stats:", error);
    }
  };

  const createTables = async () => {
    setIsLoading(true);
    setProgress(10);

    try {
      setFixStatus([
        {
          type: "info",
          message: "جاري إنشاء جداول العلاقات...",
        },
      ]);

      // Execute the relationship tables creation SQL
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          -- Create member_courses junction table
          CREATE TABLE IF NOT EXISTS member_courses (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              member_id TEXT NOT NULL,
              course_id TEXT NOT NULL,
              course_name TEXT NOT NULL,
              assigned_date TIMESTAMPTZ DEFAULT NOW(),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(member_id, course_id)
          );
          
          -- Create member_diet_plans junction table
          CREATE TABLE IF NOT EXISTS member_diet_plans (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              member_id TEXT NOT NULL,
              diet_plan_id TEXT NOT NULL,
              diet_plan_name TEXT NOT NULL,
              assigned_date TIMESTAMPTZ DEFAULT NOW(),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(member_id, diet_plan_id)
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_member_courses_member_id ON member_courses(member_id);
          CREATE INDEX IF NOT EXISTS idx_member_courses_course_id ON member_courses(course_id);
          CREATE INDEX IF NOT EXISTS idx_member_diet_plans_member_id ON member_diet_plans(member_id);
          CREATE INDEX IF NOT EXISTS idx_member_diet_plans_diet_plan_id ON member_diet_plans(diet_plan_id);
        `,
      });

      setProgress(50);

      if (error) {
        throw error;
      }

      setProgress(100);
      setTablesExist(true);
      setFixStatus((prev) => [
        ...prev,
        {
          type: "success",
          message: "تم إنشاء جداول العلاقات بنجاح!",
        },
      ]);
    } catch (error) {
      console.error("Error creating tables:", error);
      setFixStatus((prev) => [
        ...prev,
        {
          type: "error",
          message: `فشل في إنشاء الجداول: ${error}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const migrateExistingData = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      setFixStatus([
        {
          type: "info",
          message: "جاري ترحيل البيانات الموجودة...",
        },
      ]);

      // Get all members with their current data
      const members = await getMembers();
      const courses = await getCourses();
      const dietPlans = await getDietPlans();

      const courseMap = new Map(courses.map((c) => [c.id, c.name]));
      const dietPlanMap = new Map(dietPlans.map((d) => [d.id, d.name]));

      let processedCount = 0;
      let fixedCount = 0;

      for (const member of members) {
        try {
          const courseIds: string[] = [];
          const dietPlanIds: string[] = [];

          // Extract course IDs from various formats
          if (member.courseGroups && Array.isArray(member.courseGroups)) {
            member.courseGroups.forEach((cg) => {
              if (typeof cg === "string") {
                courseIds.push(cg);
              } else if (cg && typeof cg === "object" && cg.id) {
                courseIds.push(cg.id);
              }
            });
          }

          // Extract diet plan IDs from various formats
          if (member.dietPlanGroups && Array.isArray(member.dietPlanGroups)) {
            member.dietPlanGroups.forEach((dg) => {
              if (typeof dg === "string") {
                dietPlanIds.push(dg);
              } else if (dg && typeof dg === "object" && dg.id) {
                dietPlanIds.push(dg.id);
              }
            });
          }

          // Filter valid IDs
          const validCourseIds = courseIds.filter((id) => courseMap.has(id));
          const validDietPlanIds = dietPlanIds.filter((id) =>
            dietPlanMap.has(id),
          );

          if (validCourseIds.length > 0 || validDietPlanIds.length > 0) {
            const success = await updateMemberWithRelationships(
              member,
              validCourseIds,
              validDietPlanIds,
            );

            if (success) {
              fixedCount++;
            }
          }

          processedCount++;
          setProgress((processedCount / members.length) * 100);
        } catch (error) {
          console.error(`Error processing member ${member.id}:`, error);
        }
      }

      setMembersData((prev) => ({ ...prev, fixed: fixedCount }));

      setFixStatus((prev) => [
        ...prev,
        {
          type: "success",
          message: `تم ترحيل البيانات بنجاح! تم إصلاح ${fixedCount} عضو من أصل ${processedCount}`,
        },
      ]);
    } catch (error) {
      console.error("Error migrating data:", error);
      setFixStatus((prev) => [
        ...prev,
        {
          type: "error",
          message: `فشل في ترحيل البيانات: ${error}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setProgress(0);
      await loadMembersStats();
    }
  };

  const runFullFix = async () => {
    if (!tablesExist) {
      await createTables();
      // Wait a moment for tables to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (tablesExist !== false) {
      await migrateExistingData();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إصلاح علاقات الأعضاء - الكورسات والأنظمة الغذائية
          </CardTitle>
          <CardDescription>
            أداة لإصلاح مشكلة عدم حفظ الكورسات والأنظمة الغذائية للأعضاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">حالة جداول العلاقات</h3>
              <div className="flex items-center gap-2">
                {tablesExist === null && (
                  <Badge variant="secondary">جاري الفحص...</Badge>
                )}
                {tablesExist === true && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    موجودة
                  </Badge>
                )}
                {tablesExist === false && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    غير موجودة
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">إحصائيات الأعضاء</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  المجموع: {membersData.total}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  لديهم كورسات: {membersData.withCourses}
                </div>
                <div className="flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  لديهم أنظمة: {membersData.withDietPlans}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  تم إصلاحهم: {membersData.fixed}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري المعالجة...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={checkTables}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              فحص الجداول
            </Button>

            {!tablesExist && (
              <Button
                onClick={createTables}
                variant="default"
                disabled={isLoading}
                className="w-full"
              >
                إنشاء الجداول
              </Button>
            )}

            {tablesExist && (
              <Button
                onClick={migrateExistingData}
                variant="default"
                disabled={isLoading}
                className="w-full"
              >
                ترحيل البيانات
              </Button>
            )}

            <Button
              onClick={runFullFix}
              variant="destructive"
              disabled={isLoading}
              className="w-full"
            >
              الإصلاح الكامل
            </Button>
          </div>

          {/* Status Messages */}
          <div className="space-y-2">
            {fixStatus.map((status, index) => (
              <Alert
                key={index}
                variant={status.type === "error" ? "destructive" : "default"}
              >
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">تعليمات الإصلاح:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>انسخ محتوى ملف MEMBER_RELATIONSHIP_TABLES_FIX.sql</li>
              <li>ادخل إلى Supabase Dashboard → SQL Editor</li>
              <li>الصق الكود وتأكد من تنفيذه بنجاح</li>
              <li>اضغط "فحص الجداول" للتأكد من إنشاء الجداول</li>
              <li>اضغط "ترحيل البيانات" لنقل البيانات الحالية</li>
              <li>أو اضغط "الإصلاح الكامل" لتنفيذ كل شيء تلقائياً</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
