import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, RefreshCw } from "lucide-react";
import { supabaseManager } from "@/lib/supabase";

export default function ConnectionFixNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "success" | "error" | "testing"
  >("testing");

  useEffect(() => {
    // Test connection on component mount
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("testing");

    try {
      const supabase = supabaseManager.getClient();
      const { data, error } = await supabase
        .from("members")
        .select("count", { count: "exact", head: true });

      if (error) throw error;

      setConnectionStatus("success");
      setIsVisible(true);

      // Hide notification after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
      setIsVisible(true);
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert
        className={`border-2 ${connectionStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
      >
        <div className="flex items-center gap-2">
          {connectionStatus === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : connectionStatus === "testing" ? (
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={`text-sm ${connectionStatus === "success" ? "text-green-800" : "text-red-800"}`}
          >
            {connectionStatus === "success" && (
              <div>
                <strong>تم إصلاح مشكلة الاتصال! ✅</strong>
                <br />
                صفحة الأعضاء الآن مرتبطة بنجاح مع Supabase
              </div>
            )}
            {connectionStatus === "error" && (
              <div>
                <strong>لا يزال هناك مشكلة في الاتصال ❌</strong>
                <br />
                تحقق من الإنترنت أو إعدادات Supabase
              </div>
            )}
            {connectionStatus === "testing" && (
              <div>
                <strong>جاري اختبار الاتصال... 🔄</strong>
              </div>
            )}
          </AlertDescription>
        </div>
        <div className="flex justify-end mt-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={testConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
