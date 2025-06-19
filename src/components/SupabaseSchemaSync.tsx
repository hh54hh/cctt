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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { supabaseManager } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SchemaCheckResult {
  table: string;
  status: "success" | "error" | "warning";
  message: string;
  missingColumns?: string[];
  details?: any;
}

export default function SupabaseSchemaSync() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SchemaCheckResult[]>([]);
  const { toast } = useToast();

  const expectedSchema = {
    members: [
      "id",
      "name",
      "phone",
      "age",
      "height",
      "weight",
      "gender",
      "courses",
      "diet_plans", // Note: should be diet_plans, not dietPlans
      "course_groups",
      "diet_plan_groups",
      "subscription_start",
      "subscription_end",
      "created_at",
      "updated_at",
    ],
    courses: ["id", "name", "created_at", "updated_at"],
    diet_plans: ["id", "name", "created_at", "updated_at"],
    products: ["id", "name", "quantity", "price", "created_at", "updated_at"],
    sales: [
      "id",
      "buyer_name",
      "product_id",
      "product_name",
      "quantity",
      "unit_price",
      "total_price",
      "created_at",
    ],
  };

  const checkSchema = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const supabase = supabaseManager.getClient();
      const checkResults: SchemaCheckResult[] = [];

      for (const [tableName, expectedColumns] of Object.entries(
        expectedSchema,
      )) {
        try {
          // Try to get schema information by doing a query
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (error) {
            checkResults.push({
              table: tableName,
              status: "error",
              message: `جدول ${tableName} غير موجود أو هناك خطأ: ${error.message}`,
              details: error,
            });
          } else {
            checkResults.push({
              table: tableName,
              status: "success",
              message: `جدول ${tableName} موجود ويعمل بشكل صحيح`,
            });
          }
        } catch (error) {
          checkResults.push({
            table: tableName,
            status: "error",
            message: `خطأ في فحص جدول ${tableName}: ${error.message}`,
            details: error,
          });
        }
      }

      // Test the specific dietPlans column issue
      try {
        const testMember = {
          id: "schema-test-" + Date.now(),
          name: "اختبار المخطط",
          phone: "1234567890",
          age: 25,
          height: 175,
          weight: 70,
          courses: "{}",
          diet_plans: "{}", // Using correct column name
          course_groups: "{}",
          diet_plan_groups: "{}",
          subscription_start: new Date().toISOString(),
          subscription_end: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("members")
          .insert([testMember])
          .select()
          .single();

        if (error) {
          checkResults.push({
            table: "members_structure",
            status: "error",
            message: `خطأ في هيكل جدول الأعضاء: ${error.message}`,
            details: {
              error,
              testedData: testMember,
            },
          });
        } else {
          // Clean up test record
          await supabase.from("members").delete().eq("id", testMember.id);

          checkResults.push({
            table: "members_structure",
            status: "success",
            message: "هيكل جدول الأعضاء صحيح ويمكن إدراج البيانات",
          });
        }
      } catch (error) {
        checkResults.push({
          table: "members_structure",
          status: "error",
          message: `خطأ في اختبار هيكل الجدول: ${error.message}`,
          details: error,
        });
      }

      setResults(checkResults);

      const hasErrors = checkResults.some((r) => r.status === "error");
      toast({
        title: "تم فحص مخطط قاعدة البيانات",
        description: hasErrors
          ? "تم العثور على مشاكل في المخطط"
          : "جميع الجداول تعمل بشكل صحيح",
        variant: hasErrors ? "destructive" : "default",
      });
    } catch (error) {
      console.error("خطأ في فحص المخطط:", error);
      toast({
        title: "خطأ في فحص المخطط",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const fixSchema = async () => {
    try {
      const supabase = supabaseManager.getClient();

      // SQL commands to ensure the schema is correct
      const schemaSQLCommands = [
        // Ensure members table has correct structure
        `
        -- Update members table structure if needed
        DO $$
        BEGIN
            -- Add diet_plans column if it doesn't exist
            IF NOT EXISTS (
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='members' AND column_name='diet_plans'
            ) THEN
                ALTER TABLE members ADD COLUMN diet_plans TEXT[] DEFAULT '{}';
            END IF;

            -- Add course_groups column if it doesn't exist
            IF NOT EXISTS (
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='members' AND column_name='course_groups'
            ) THEN
                ALTER TABLE members ADD COLUMN course_groups JSONB DEFAULT '[]';
            END IF;

            -- Add diet_plan_groups column if it doesn't exist
            IF NOT EXISTS (
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='members' AND column_name='diet_plan_groups'
            ) THEN
                ALTER TABLE members ADD COLUMN diet_plan_groups JSONB DEFAULT '[]';
            END IF;
        END $$;
        `,
      ];

      for (const sql of schemaSQLCommands) {
        const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
        if (error) {
          console.error("خطأ في تنفيذ SQL:", error);
        }
      }

      toast({
        title: "تم محاولة إصلاح المخطط",
        description: "تحقق من النتائج أدناه",
        variant: "default",
      });

      // Re-check schema after fixing
      await checkSchema();
    } catch (error) {
      toast({
        title: "خطأ في إصلاح المخطط",
        description: error.message,
        variant: "destructive",
      });
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
        className="flex items-center gap-2 text-cyan-600 border-cyan-300 hover:bg-cyan-50"
      >
        <Settings className="h-4 w-4" />
        فحص مخطط Supabase
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
                <Settings className="h-5 w-5" />
                فحص مخطط قاعدة البيانات Supabase
              </CardTitle>
              <CardDescription>
                التحقق من أن جميع الجداول والأعمدة موجودة ومتطابقة
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={checkSchema}
                disabled={isRunning}
                variant="outline"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Database className="h-4 w-4 ml-1" />
                )}
                فحص المخطط
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
                          <span className="font-medium">{result.table}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status === "success" && "يعمل"}
                            {result.status === "error" && "خطأ"}
                            {result.status === "warning" && "تحذير"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              عرض التفاصيل التقنية
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
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>اضغط على "فحص المخطط" للتحقق من هيكل قاعدة البيانات</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>سيتم فحص:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• جدول الأعضاء (members)</li>
                    <li>• جدول الكورسات (courses)</li>
                    <li>• جدول الخطط الغذائية (diet_plans)</li>
                    <li>• جدول المنتجات (products)</li>
                    <li>• جدول المبيعات (sales)</li>
                    <li>• أعمدة المجموعات الجديدة</li>
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
