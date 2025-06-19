import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Wifi, Cloud, Database, Sparkles, X } from "lucide-react";

export default function WelcomeMessage() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if this is the first time seeing the updated system
    const hasSeenUpdate = localStorage.getItem("has-seen-v2-update");
    if (!hasSeenUpdate) {
      setShowWelcome(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("has-seen-v2-update", "true");
    setShowWelcome(false);
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                تحديث جوهري للنظام!
              </h2>
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Version Badge */}
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 text-sm">
            النسخة 2.0 - نظام الأوفلاين والمزامنة الذكية
          </Badge>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="p-2 bg-blue-100 rounded-full">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-900">عمل أوفلاين</h3>
                <p className="text-sm text-gray-600">
                  استخدم النظام بدون إنترنت
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="p-2 bg-green-100 rounded-full">
                <Cloud className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-900">مزامنة تلقائية</h3>
                <p className="text-sm text-gray-600">
                  البيانات تتزامن مع السحابة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="p-2 bg-purple-100 rounded-full">
                <Wifi className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-900">بدون انقطاع</h3>
                <p className="text-sm text-gray-600">
                  العمل مستمر في جميع الظروف
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="p-2 bg-orange-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-900">أمان البيانات</h3>
                <p className="text-sm text-gray-600">حفظ محلي ونسخ احتياطية</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-center bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 leading-relaxed">
              يعتمد النظام الآن على <strong>قاعدة بيانات محلية</strong> مدمجة في
              المتصفح، مما يسمح بالعمل حتى بدون إنترنت. عند عودة الاتصال، يتم{" "}
              <strong>المزامنة التلقائية</strong> مع السحابة بشكل غير مرئي
              للمستخدم.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleDismiss}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 text-lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            رائع! ابدأ الاستخدام
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
