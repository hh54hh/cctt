import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import {
  emergencyStop,
  testSupabaseConnection,
  getSimpleMembers,
  saveSimpleMember,
} from "../lib/simpleMemberStorage";

export default function EmergencyRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [supabaseWorking, setSupabaseWorking] = useState<boolean | null>(null);

  const addStatus = (message: string) => {
    setStatus((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleEmergencyStop = () => {
    try {
      addStatus("تطبيق إيقاف طارئ...");
      emergencyStop();
      addStatus("✅ تم الإيقاف الطارئ بنجاح");
    } catch (error) {
      addStatus(`❌ خطأ في الإيقاف الطارئ: ${error}`);
    }
  };

  const handleTestConnection = async () => {
    try {
      addStatus("اختبار اتصال Supabase...");
      const working = await testSupabaseConnection();
      setSupabaseWorking(working);
      addStatus(
        working ? "✅ Supabase يعمل بشكل صحيح" : "❌ مشكلة في Supabase",
      );
    } catch (error) {
      addStatus(`❌ خطأ في اختبار الاتصال: ${error}`);
      setSupabaseWorking(false);
    }
  };

  const handleFullRecovery = async () => {
    setIsRecovering(true);
    setStatus([]);

    try {
      // Step 1: Emergency stop
      addStatus("1️⃣ تطبيق إيقاف طارئ...");
      emergencyStop();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Test Supabase
      addStatus("2️⃣ اختبار اتصال قاعدة البيانات...");
      const working = await testSupabaseConnection();
      setSupabaseWorking(working);

      if (!working) {
        addStatus("❌ مشكلة في اتصال قاعدة البيانات");
        return;
      }

      // Step 3: Test loading members
      addStatus("3️⃣ اختبار تحميل الأعضاء...");
      const members = await getSimpleMembers();
      addStatus(`✅ تم تحميل ${members.length} عضو بنجاح`);

      // Step 4: Cleanup
      addStatus("4️⃣ تنظيف الذاكرة...");
      if ((window as any).gc) {
        (window as any).gc();
      }

      addStatus("🎉 تم الاسترداد الطارئ بنجاح!");
    } catch (error) {
      addStatus(`❌ فشل الاسترداد الطارئ: ${error}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleReloadPage = () => {
    addStatus("إعادة تحميل الصفحة...");
    window.location.reload();
  };

  const clearStatus = () => {
    setStatus([]);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            استرداد طارئ للموقع
          </CardTitle>
          <CardDescription>
            حل فوري لمشكلة عدم استجابة الموقع وعدم حفظ الكورسات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Critical Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              🚨 إذا كان الموقع لا يستجيب، استخدم الحلول الطارئة أدناه
            </AlertDescription>
          </Alert>

          {/* Connection Status */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">حالة قاعدة البيانات:</span>
            {supabaseWorking === null && (
              <span className="text-gray-500">غير محددة</span>
            )}
            {supabaseWorking === true && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                تعمل بشكل صحيح
              </span>
            )}
            {supabaseWorking === false && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                يوجد مشكلة
              </span>
            )}
          </div>

          {/* Emergency Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={handleEmergencyStop}
              variant="destructive"
              disabled={isRecovering}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              إيقاف طارئ
            </Button>

            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={isRecovering}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              اختبار الاتصال
            </Button>

            <Button
              onClick={handleFullRecovery}
              variant="default"
              disabled={isRecovering}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              استرداد كامل
            </Button>

            <Button
              onClick={handleReloadPage}
              variant="secondary"
              disabled={isRecovering}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تحميل
            </Button>
          </div>

          {/* Status Log */}
          {status.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">سجل العمليات:</h3>
                <Button onClick={clearStatus} variant="ghost" size="sm">
                  مسح
                </Button>
              </div>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {status.map((msg, index) => (
                  <div key={index} className="mb-1">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              🆘 إرشادات الطوارئ:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>
                <strong>إذا كان الموقع متجمد:</strong> اضغط "إيقاف طارئ" ثم
                "استرداد كامل"
              </li>
              <li>
                <strong>إذا لم تُحفظ الكورسات:</strong> اضغط "اختبار الاتصال" ثم
                جرب الحفظ مرة أخرى
              </li>
              <li>
                <strong>إذا لم تنجح الحلول:</strong> اضغط "إعادة تحميل" كحل أخير
              </li>
              <li>
                <strong>للوقاية:</strong> تجنب النقر السريع المتكرر على نفس الزر
              </li>
            </ol>
          </div>

          {/* Console Commands */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              💻 أوامر وحدة التحكم الطارئة:
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-yellow-800">لإيقاف طارئ:</span>
                <code className="block mt-1 p-2 bg-yellow-100 rounded text-xs">
                  emergencyRecovery()
                </code>
              </div>
              <div>
                <span className="text-yellow-800">لإعادة تحميل:</span>
                <code className="block mt-1 p-2 bg-yellow-100 rounded text-xs">
                  location.reload()
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
