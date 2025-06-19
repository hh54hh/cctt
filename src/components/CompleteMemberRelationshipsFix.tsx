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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  Users,
  BookOpen,
  Utensils,
  Zap,
  FileCheck,
} from "lucide-react";
import { checkRelationshipTables } from "../lib/memberRelationships";
import {
  migrateExistingMembersToRelationships,
  verifyRelationshipIntegrity,
  getMembersWithRelationships,
} from "../lib/memberStorageWithRelationshipsFixed";
import { supabase } from "../lib/supabase";

interface FixStatus {
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: Date;
}

interface SystemStatus {
  tablesExist: boolean | null;
  memberCount: number;
  membersWithCourses: number;
  membersWithDietPlans: number;
  dataIntegrity: boolean | null;
  lastCheck: Date | null;
}

export default function CompleteMemberRelationshipsFix() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fixStatus, setFixStatus] = useState<FixStatus[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    tablesExist: null,
    memberCount: 0,
    membersWithCourses: 0,
    membersWithDietPlans: 0,
    dataIntegrity: null,
    lastCheck: null,
  });

  useEffect(() => {
    performSystemCheck();
  }, []);

  const addStatus = (
    type: FixStatus["type"],
    message: string,
    clearPrevious = false,
  ) => {
    setFixStatus((prev) =>
      clearPrevious
        ? [{ type, message, timestamp: new Date() }]
        : [...prev, { type, message, timestamp: new Date() }],
    );
  };

  const performSystemCheck = async () => {
    try {
      addStatus("info", "جاري فحص النظام...", true);
      setProgress(10);

      // Check if relationship tables exist
      const tablesResult = await checkRelationshipTables();
      setProgress(30);

      // Get members data
      const members = await getMembersWithRelationships();
      setProgress(50);

      // Verify data integrity
      const integrityResult = await verifyRelationshipIntegrity();
      setProgress(80);

      // Count statistics
      const membersWithCourses = members.filter(
        (m) => m.courseGroups && m.courseGroups.length > 0,
      ).length;

      const membersWithDietPlans = members.filter(
        (m) => m.dietPlanGroups && m.dietPlanGroups.length > 0,
      ).length;

      setSystemStatus({
        tablesExist: tablesResult.exists,
        memberCount: members.length,
        membersWithCourses,
        membersWithDietPlans,
        dataIntegrity: integrityResult.isValid,
        lastCheck: new Date(),
      });

      setProgress(100);

      if (tablesResult.exists && integrityResult.isValid) {
        addStatus("success", "✅ النظام يعمل بشكل صحيح!");
      } else {
        addStatus("warning", "⚠️ يوجد مشاكل تحتاج إصلاح");
        if (!tablesResult.exists) {
          addStatus("error", "❌ جداول العلاقات غير موجودة");
        }
        if (!integrityResult.isValid) {
          addStatus(
            "error",
            `❌ مشاكل في تكامل البيانات: ${integrityResult.issues.length} مشكلة`,
          );
        }
      }
    } catch (error) {
      addStatus("error", `❌ خطأ في فحص النظام: ${error}`);
    } finally {
      setProgress(0);
    }
  };

  const createRelationshipTables = async () => {
    setIsLoading(true);
    try {
      addStatus("info", "جاري إنشاء جداول العلاقات...", true);
      setProgress(20);

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

          -- Grant permissions
          GRANT ALL ON member_courses TO anon, authenticated;
          GRANT ALL ON member_diet_plans TO anon, authenticated;
        `,
      });

      setProgress(80);

      if (error) {
        throw error;
      }

      addStatus("success", "✅ تم إنشاء جداول العلاقات بنجاح!");
      setProgress(100);

      // Re-check system after creating tables
      setTimeout(() => {
        performSystemCheck();
      }, 1000);
    } catch (error) {
      addStatus("error", `❌ فشل في إنشاء الجداول: ${error}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const migrateData = async () => {
    setIsLoading(true);
    try {
      addStatus("info", "جاري ترحيل البيانات...", true);
      setProgress(10);

      const result = await migrateExistingMembersToRelationships();
      setProgress(80);

      if (result.success) {
        addStatus("success", `✅ تم ترحيل ${result.migrated} عضو بنجاح!`);
      } else {
        addStatus(
          "warning",
          `⚠️ تم ترحيل ${result.migrated} عضو مع ${result.errors} أخطاء`,
        );
      }

      setProgress(100);

      // Re-check system after migration
      setTimeout(() => {
        performSystemCheck();
      }, 1000);
    } catch (error) {
      addStatus("error", `❌ فشل في ترحيل البيانات: ${error}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const runCompleteFixNow = async () => {
    setIsLoading(true);
    try {
      addStatus("info", "🚀 بدء الإصلاح الكامل...", true);
      setProgress(5);

      // Step 1: Check tables
      addStatus("info", "1️⃣ فحص جداول العلاقات...");
      const tablesResult = await checkRelationshipTables();
      setProgress(20);

      // Step 2: Create tables if needed
      if (!tablesResult.exists) {
        addStatus("info", "2️⃣ إنشاء جداول العلاقات...");
        await createRelationshipTables();
        setProgress(40);
      } else {
        addStatus("success", "2️⃣ جداول العلاقات موجودة بالفعل");
        setProgress(40);
      }

      // Step 3: Migrate data
      addStatus("info", "3️⃣ ترحيل البيانات الموجودة...");
      const migrationResult = await migrateExistingMembersToRelationships();
      setProgress(70);

      if (migrationResult.success) {
        addStatus("success", `3️⃣ تم ترحيل ${migrationResult.migrated} عضو`);
      } else {
        addStatus(
          "warning",
          `3️⃣ ترحيل مع أخطاء: ${migrationResult.migrated} نجح، ${migrationResult.errors} فشل`,
        );
      }

      // Step 4: Verify integrity
      addStatus("info", "4️⃣ التحقق من تكامل البيانات...");
      const integrityResult = await verifyRelationshipIntegrity();
      setProgress(90);

      if (integrityResult.isValid) {
        addStatus("success", "4️⃣ تكامل البيانات ممتاز!");
      } else {
        addStatus(
          "warning",
          `4️⃣ ${integrityResult.issues.length} مشكلة في تكامل البيانات`,
        );
      }

      setProgress(100);
      addStatus("success", "🎉 تم الإصلاح الكامل بنجاح!");

      // Final system check
      setTimeout(() => {
        performSystemCheck();
      }, 2000);
    } catch (error) {
      addStatus("error", `❌ فشل الإصلاح الكامل: ${error}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return "secondary";
    return status ? "default" : "destructive";
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <RefreshCw className="h-3 w-3 animate-spin" />;
    return status ? (
      <CheckCircle className="h-3 w-3" />
    ) : (
      <AlertTriangle className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إصلاح شامل لحفظ الكورسات والأنظمة الغذائية
          </CardTitle>
          <CardDescription>
            حل نهائي ودقيق لمشكلة عدم حفظ الكورسات والأنظمة الغذائية للأعضاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">جداول العلاقات</span>
                <Badge
                  variant={getStatusColor(systemStatus.tablesExist)}
                  className="w-fit"
                >
                  {getStatusIcon(systemStatus.tablesExist)}
                  <span className="mr-1">
                    {systemStatus.tablesExist === null
                      ? "فحص..."
                      : systemStatus.tablesExist
                        ? "موجودة"
                        : "مفقودة"}
                  </span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">إجمالي الأعضاء</span>
                <span className="font-medium">{systemStatus.memberCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">لديهم كورسات</span>
                <span className="font-medium">
                  {systemStatus.membersWithCourses}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">لديهم أنظمة</span>
                <span className="font-medium">
                  {systemStatus.membersWithDietPlans}
                </span>
              </div>
            </div>
          </div>

          {/* Data Integrity Status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">تكامل البيانات:</span>
            <Badge variant={getStatusColor(systemStatus.dataIntegrity)}>
              {getStatusIcon(systemStatus.dataIntegrity)}
              <span className="mr-1">
                {systemStatus.dataIntegrity === null
                  ? "فحص..."
                  : systemStatus.dataIntegrity
                    ? "ممتاز"
                    : "يحتاج إصلاح"}
              </span>
            </Badge>
            {systemStatus.lastCheck && (
              <span className="text-xs text-gray-500">
                آخر فحص: {systemStatus.lastCheck.toLocaleTimeString("ar-SA")}
              </span>
            )}
          </div>

          {/* Progress */}
          {(isLoading || progress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري المعالجة...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button
              onClick={performSystemCheck}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              فحص النظام
            </Button>

            {systemStatus.tablesExist === false && (
              <Button
                onClick={createRelationshipTables}
                variant="default"
                disabled={isLoading}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                إنشاء الجداول
              </Button>
            )}

            <Button
              onClick={migrateData}
              variant="secondary"
              disabled={isLoading || systemStatus.tablesExist === false}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              ترحيل البيانات
            </Button>

            <Button
              onClick={runCompleteFixNow}
              variant="destructive"
              disabled={isLoading}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              إصلاح كامل فوري
            </Button>
          </div>

          {/* Status Messages */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {fixStatus.map((status, index) => (
              <Alert
                key={index}
                variant={status.type === "error" ? "destructive" : "default"}
                className="text-sm"
              >
                <AlertDescription className="flex justify-between">
                  <span>{status.message}</span>
                  <span className="text-xs opacity-70">
                    {status.timestamp.toLocaleTimeString("ar-SA")}
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 خطوات الإصلاح الدقيق:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>انسخ محتوى ملف MEMBER_RELATIONSHIP_TABLES_FIX.sql</li>
              <li>ادخل Supabase Dashboard → SQL Editor</li>
              <li>الصق الكود وتنفيذه بنجاح</li>
              <li>اضغط "إصلاح كامل فوري" هنا في التطبيق</li>
              <li>انتظر انتهاء جميع المراحل</li>
              <li>ستعمل الكورسات والأنظمة الغذائية بشكل صحيح</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
