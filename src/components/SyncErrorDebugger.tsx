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
  Bug,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { syncManager } from "@/lib/sync-manager";
import { getMembers } from "@/lib/storage-new";
import { useToast } from "@/hooks/use-toast";

interface SyncTestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  duration?: number;
}

export default function SyncErrorDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SyncTestResult[]>([]);
  const { toast } = useToast();

  const runSyncDebugTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Get a member to sync
      const startTime = Date.now();
      setResults([
        {
          test: "جاري البحث عن عضو للاختبار",
          status: "warning",
          message: "جاري البحث عن أعضاء للاختبار...",
        },
      ]);

      const members = await getMembers();

      if (members.length === 0) {
        setResults((prev) => [
          ...prev,
          {
            test: "لا يوجد أعضاء للاختبار",
            status: "warning",
            message:
              "لا يوجد أعضاء في قاعدة البيانات للاختبار. أنشئ عضو أولاً.",
            duration: Date.now() - startTime,
          },
        ]);
        return;
      }

      const testMember = members[0];

      setResults((prev) => [
        ...prev.slice(0, -1),
        {
          test: "تم العثور على عضو للاختبار",
          status: "success",
          message: `تم العثور على العضو: ${testMember.name}`,
          details: {
            id: testMember.id,
            name: testMember.name,
            courseGroups: testMember.courseGroups?.length || 0,
            dietPlanGroups: testMember.dietPlanGroups?.length || 0,
          },
          duration: Date.now() - startTime,
        },
      ]);

      // Test 2: Try to sync the member
      const syncStartTime = Date.now();
      setResults((prev) => [
        ...prev,
        {
          test: "اختبار مزامنة العضو",
          status: "warning",
          message: "جاري محاولة مزامنة العضو...",
        },
      ]);

      try {
        await syncManager.syncMember(testMember);

        setResults((prev) => [
          ...prev.slice(0, -1),
          {
            test: "اختبار مزامنة العضو",
            status: "success",
            message: `تمت مزامنة العضو بنجاح: ${testMember.name}`,
            duration: Date.now() - syncStartTime,
          },
        ]);
      } catch (error) {
        const errorMessage =
          error?.message || error?.toString() || "Unknown sync error";

        setResults((prev) => [
          ...prev.slice(0, -1),
          {
            test: "اختبار مزامنة العضو",
            status: "error",
            message: `فشل في مزامنة العضو: ${errorMessage}`,
            details: {
              error: error,
              errorMessage: errorMessage,
              member: {
                id: testMember.id,
                name: testMember.name,
              },
            },
            duration: Date.now() - syncStartTime,
          },
        ]);
      }

      // Test 3: Test sync status
      const statusStartTime = Date.now();
      const syncStatus = syncManager.getSyncStatus();

      setResults((prev) => [
        ...prev,
        {
          test: "حالة نظام المزامنة",
          status: syncStatus.onlineStatus ? "success" : "warning",
          message: `حالة الاتصال: ${syncStatus.onlineStatus ? "متصل" : "غير متصل"}`,
          details: syncStatus,
          duration: Date.now() - statusStartTime,
        },
      ]);

      // Test 4: Force full sync
      const fullSyncStartTime = Date.now();
      setResults((prev) => [
        ...prev,
        {
          test: "اختبار المزامنة الشاملة",
          status: "warning",
          message: "جاري إجراء مزامنة شاملة...",
        },
      ]);

      try {
        const syncResults = await syncManager.forceSyncNow();

        setResults((prev) => [
          ...prev.slice(0, -1),
          {
            test: "اختبار المزامنة الشاملة",
            status: "success",
            message: `تمت المزامنة الشاملة بنجاح. تم مزامنة ${syncResults.length} جدول.`,
            details: syncResults,
            duration: Date.now() - fullSyncStartTime,
          },
        ]);
      } catch (error) {
        const errorMessage =
          error?.message || error?.toString() || "Unknown full sync error";

        setResults((prev) => [
          ...prev.slice(0, -1),
          {
            test: "اختبار المزامنة الشاملة",
            status: "error",
            message: `فشل في المزامنة الشاملة: ${errorMessage}`,
            details: error,
            duration: Date.now() - fullSyncStartTime,
          },
        ]);
      }

      toast({
        title: "اكتمل اختبار تشخيص أخطاء المزامنة",
        description: "تحقق من النتائج لمعرفة تفاصيل المشاكل",
        variant: "default",
      });
    } catch (error) {
      console.error("خطأ في اختبار تشخيص المزامنة:", error);
      setResults((prev) => [
        ...prev,
        {
          test: "خطأ عام في الاختبار",
          status: "error",
          message: `خطأ عام: ${error?.message || error}`,
          details: error,
        },
      ]);

      toast({
        title: "خطأ في اختبار التشخيص",
        description: error?.message || error?.toString() || "خطأ غير معروف",
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
        return <Bug className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
      >
        <Bug className="h-4 w-4" />
        تشخيص أخطاء المزامنة
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
                <Bug className="h-5 w-5" />
                تشخيص أخطاء المزامنة
              </CardTitle>
              <CardDescription>
                اختبار شامل لتشخيص مشاكل المزامنة مع عرض تفاصيل الأخطاء
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={runSyncDebugTest}
                disabled={isRunning}
                variant={results.length === 0 ? "default" : "outline"}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Bug className="h-4 w-4 ml-1" />
                )}
                {isRunning ? "جاري التشخيص..." : "بدء التشخيص"}
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
                            {result.status === "warning" && "جاري التشغيل"}
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
                <Bug className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  اضغط على "بدء التشخيص" لاختبار نظام المزامنة وتشخيص الأخطاء
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>سيتم اختبار:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• البحث عن أعضاء للاختبار</li>
                    <li>• مزامنة عضو واحد بالتفصيل</li>
                    <li>• حالة نظام المزامنة</li>
                    <li>• المزامنة الشاملة</li>
                    <li>• عرض رسائل الأخطاء التفصيلية</li>
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
