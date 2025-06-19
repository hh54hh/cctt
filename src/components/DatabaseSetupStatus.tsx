import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertTriangle,
  Database,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { checkConnection, setupSupabaseSchema } from "@/lib/supabase";

export default function DatabaseSetupStatus() {
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null,
  );
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const isConnected = await checkConnection();
      setConnectionStatus(isConnected);

      if (isConnected) {
        // Try to setup schema
        await setupSupabaseSchema();
      }
    } catch (error) {
      setConnectionStatus(false);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (connectionStatus === null) return "bg-gray-500";
    return connectionStatus ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = () => {
    if (isChecking) return "جاري الفحص...";
    if (connectionStatus === null) return "غير معروف";
    return connectionStatus ? "متصل ومُعد" : "غير متصل";
  };

  if (connectionStatus === true) {
    // Database is working, don't show anything
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Database className="h-5 w-5" />
            حالة قاعدة البيانات
            <Badge className={`${getStatusColor()} text-white ml-auto`}>
              {getStatusText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectionStatus === false && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                قاعدة البيانات غير متاحة. النظام يعمل أوفلاين فقط.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === null && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                جاري فحص الاتصال بقاعدة البيانات...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkDatabaseStatus}
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              إعادة فحص
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              دليل الإعداد
            </Button>
          </div>

          {showSetupGuide && (
            <div className="bg-white rounded-lg p-4 border text-sm space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                خطوات إعداد قاعدة البيانات:
              </h4>

              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>
                  اذهب إلى{" "}
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>افتح مشروع: efxciplzfivwgdyrayjm</li>
                <li>اذهب إلى SQL Editor</li>
                <li>انسخ محتوى ملف supabase-schema.sql</li>
                <li>قم بتشغيل الاستعلامات</li>
              </ol>

              <div className="bg-blue-50 p-2 rounded text-xs">
                <strong>ملاحظة:</strong> حتى بدون قاعدة البيانات، النظام يعمل
                بكامل وظائفه محلياً!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
