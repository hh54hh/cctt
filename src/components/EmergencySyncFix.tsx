import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, CheckCircle, Loader2 } from "lucide-react";
import { getMembers } from "@/lib/storage-new";
import { supabaseManager } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EmergencySyncFix() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string>("جاري التحقق...");
  const [localCount, setLocalCount] = useState(0);
  const [supabaseCount, setSupabaseCount] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAndFix();
  }, []);

  const checkAndFix = async () => {
    setIsRunning(true);
    try {
      // 1. فحص البيانات المحلية
      const localMembers = await getMembers();
      setLocalCount(localMembers.length);
      setStatus(`تم العثور على ${localMembers.length} عضو محلياً`);

      if (localMembers.length === 0) {
        setStatus("لا يوجد أعضاء للمزامنة");
        setIsRunning(false);
        return;
      }

      // 2. فحص Supabase
      const supabase = supabaseManager.getClient();

      // التحقق من وجود الجدول أولاً
      let { count: currentCount, error: countError } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      if (countError) {
        setStatus("❌ خطأ في الوصول لجدول members - سيتم إنشاؤه");

        // إنشاء الجدول إذا لم يكن موجوداً
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS members (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              phone TEXT NOT NULL,
              age INTEGER NOT NULL,
              height INTEGER NOT NULL,
              weight INTEGER NOT NULL,
              gender TEXT,
              courses TEXT DEFAULT '[]',
              diet_plans TEXT DEFAULT '[]',
              course_groups JSONB DEFAULT '[]',
              diet_plan_groups JSONB DEFAULT '[]',
              subscription_start TIMESTAMPTZ,
              subscription_end TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            GRANT ALL ON members TO anon;
            GRANT ALL ON members TO authenticated;
          `,
        });

        if (createError) {
          console.log(
            "Info: Table might already exist or RPC not available:",
            createError,
          );
        }

        // إعادة المحاولة
        const { count: newCount } = await supabase
          .from("members")
          .select("*", { count: "exact", head: true });
        currentCount = newCount || 0;
      }

      setSupabaseCount(currentCount || 0);
      setStatus(
        `Supabase: ${currentCount || 0} أعضاء، محلي: ${localMembers.length}`,
      );

      // 3. إذا كان العدد مختلف، ابدأ المزامنة الفورية
      if ((currentCount || 0) < localMembers.length) {
        setStatus("🔄 بدء المزامنة الإجبارية الفورية...");

        let syncedCount = 0;
        let errorCount = 0;

        for (const member of localMembers) {
          try {
            // تحويل البيانات للتنسيق الصحيح
            const supabaseMember = {
              id: member.id,
              name: member.name,
              phone: member.phone,
              age: member.age,
              height: member.height,
              weight: member.weight,
              gender: member.gender || null,
              courses:
                member.courses && member.courses.length > 0
                  ? `{${member.courses.map((c) => `"${c}"`).join(",")}}`
                  : "{}",
              diet_plans:
                member.dietPlans && member.dietPlans.length > 0
                  ? `{${member.dietPlans.map((d) => `"${d}"`).join(",")}}`
                  : "{}",
              course_groups: Array.isArray(member.courseGroups)
                ? JSON.stringify(member.courseGroups)
                : "[]",
              diet_plan_groups: Array.isArray(member.dietPlanGroups)
                ? JSON.stringify(member.dietPlanGroups)
                : "[]",
              subscription_start: member.subscriptionStart
                ? new Date(member.subscriptionStart).toISOString()
                : null,
              subscription_end: member.subscriptionEnd
                ? new Date(member.subscriptionEnd).toISOString()
                : null,
              created_at: member.createdAt
                ? new Date(member.createdAt).toISOString()
                : new Date().toISOString(),
              updated_at: member.updatedAt
                ? new Date(member.updatedAt).toISOString()
                : new Date().toISOString(),
            };

            // إدراج/تحديث العضو
            const { error } = await supabase
              .from("members")
              .upsert([supabaseMember], {
                onConflict: "id",
                ignoreDuplicates: false,
              });

            if (error) {
              const errorMessage =
                error?.message || error?.toString() || "خطأ غير معروف";
              console.error(
                `❌ خطأ في مزامنة العضو ${member.name}:`,
                errorMessage,
              );
              console.error("🔍 تفاصيل الخطأ الكاملة:", error);
              errorCount++;
            } else {
              console.log(`✅ تمت مزامنة العضو ${member.name}`);
              syncedCount++;
            }

            setStatus(
              `جاري المزامنة... ${syncedCount + errorCount}/${localMembers.length}`,
            );
          } catch (error) {
            const errorMessage =
              error?.message || error?.toString() || "خطأ في المعالجة";
            console.error(
              `❌ خطأ في معالجة العضو ${member.name}:`,
              errorMessage,
            );
            console.error("🔍 تفاصيل خطأ المعالجة:", error);
            errorCount++;
          }
        }

        // 4. التحقق النهائي
        const { count: finalCount } = await supabase
          .from("members")
          .select("*", { count: "exact", head: true });

        setSupabaseCount(finalCount || 0);

        if (syncedCount > 0) {
          setStatus(`✅ تمت المزامنة! ${syncedCount} نجح، ${errorCount} فشل`);
          setIsFixed(true);

          toast({
            title: "تمت المزامنة بنجاح! 🎉",
            description: `تم رفع ${syncedCount} عضو إلى Supabase`,
            variant: "default",
          });
        } else {
          setStatus(`❌ فشلت المزامنة - ${errorCount} أخطاء`);
          toast({
            title: "فشلت المزامنة",
            description: "تحقق من الإعدادات أو الصلاحيات",
            variant: "destructive",
          });
        }
      } else {
        setStatus("✅ البيانات متزامنة بالفعل");
        setIsFixed(true);
      }
    } catch (error) {
      const errorMessage =
        error?.message || error?.toString() || "خطأ غير معروف في المزامنة";
      console.error("❌ خطأ في المزامنة الطارئة:", errorMessage);
      console.error("🔍 تفاصيل الخطأ العام:", error);
      setStatus(`❌ خطأ: ${errorMessage}`);
      toast({
        title: "خطأ في الإصلاح الطارئ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          إصلاح طارئ لمزامنة Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-blue-600">{localCount}</div>
            <div className="text-sm text-gray-600">أعضاء محلياً</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-green-600">
              {supabaseCount}
            </div>
            <div className="text-sm text-gray-600">أعضاء في Supabase</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white rounded border">
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : isFixed ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm">{status}</span>
        </div>

        {!isFixed && !isRunning && (
          <Button
            onClick={checkAndFix}
            className="w-full bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Zap className="h-4 w-4 ml-1" />
            إعادة المحاولة الآن
          </Button>
        )}

        {isFixed && (
          <div className="p-3 bg-green-100 border border-green-200 rounded text-green-800 text-sm">
            🎉 تم الإصلاح! الآن البيانات متزامنة مع Supabase
          </div>
        )}
      </CardContent>
    </Card>
  );
}
