import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "../lib/supabase";

interface FixStatus {
  type: "success" | "warning" | "error" | "info";
  message: string;
}

export default function SalesTableSyncFix() {
  const [isFixing, setIsFixing] = useState(false);
  const [fixStatus, setFixStatus] = useState<FixStatus[]>([]);
  const [hasUpdatedAtColumn, setHasUpdatedAtColumn] = useState<boolean | null>(
    null,
  );

  const checkSalesTableStructure = async () => {
    try {
      setFixStatus([
        {
          type: "info",
          message: "جاري فحص هيكل جدول المبيعات...",
        },
      ]);

      // Check if updated_at column exists
      const { data, error } = await supabase
        .from("sales")
        .select("updated_at")
        .limit(1);

      if (error && error.message.includes("updated_at")) {
        setHasUpdatedAtColumn(false);
        setFixStatus((prev) => [
          ...prev,
          {
            type: "error",
            message: "العمود updated_at مفقود من جدول المبيعات",
          },
        ]);
      } else {
        setHasUpdatedAtColumn(true);
        setFixStatus((prev) => [
          ...prev,
          {
            type: "success",
            message: "جدول المبيعات يحتوي على العمود updated_at",
          },
        ]);
      }
    } catch (error) {
      setHasUpdatedAtColumn(false);
      setFixStatus((prev) => [
        ...prev,
        {
          type: "error",
          message: `خطأ في فحص جدول المبيعات: ${error}`,
        },
      ]);
    }
  };

  const fixSalesTable = async () => {
    setIsFixing(true);

    try {
      setFixStatus([
        {
          type: "info",
          message: "جاري إصلاح جدول المبيعات...",
        },
      ]);

      // Add updated_at column to sales table
      const { error: alterError } = await supabase.rpc("exec_sql", {
        sql: `
          -- Add updated_at column to sales table
          ALTER TABLE sales 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
          
          -- Update existing records to have updated_at value
          UPDATE sales 
          SET updated_at = created_at 
          WHERE updated_at IS NULL;
        `,
      });

      if (alterError) {
        throw alterError;
      }

      setFixStatus((prev) => [
        ...prev,
        {
          type: "success",
          message: "تم إضافة العمود updated_at إلى جدول المبيعات",
        },
      ]);

      // Create trigger for automatic updates
      const { error: triggerError } = await supabase.rpc("exec_sql", {
        sql: `
          -- Create or replace the update function
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          -- Drop existing trigger if exists
          DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
          
          -- Create trigger for sales table
          CREATE TRIGGER update_sales_updated_at
              BEFORE UPDATE ON sales
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
        `,
      });

      if (triggerError) {
        console.warn("Warning creating trigger:", triggerError);
        setFixStatus((prev) => [
          ...prev,
          {
            type: "warning",
            message: "تم إضافة العمود ولكن فشل في إنشاء الـ Trigger",
          },
        ]);
      } else {
        setFixStatus((prev) => [
          ...prev,
          {
            type: "success",
            message: "تم إنشاء الـ Trigger لتحديث updated_at تلقائياً",
          },
        ]);
      }

      setHasUpdatedAtColumn(true);

      setFixStatus((prev) => [
        ...prev,
        {
          type: "success",
          message:
            "✅ تم إصلاح جدول المبيعات بنجاح! يمكن الآن مزامنة المبيعات بدون أخطاء",
        },
      ]);
    } catch (error) {
      console.error("Error fixing sales table:", error);
      setFixStatus((prev) => [
        ...prev,
        {
          type: "error",
          message: `فشل في إصلاح جدول المبيعات: ${error}`,
        },
      ]);
    } finally {
      setIsFixing(false);
    }
  };

  React.useEffect(() => {
    checkSalesTableStructure();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إصلاح خطأ مزامنة المبيعات
          </CardTitle>
          <CardDescription>
            إصلاح خطأ: "Could not find the 'updated_at' column of 'sales'"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">حالة جدول المبيعات:</span>
            {hasUpdatedAtColumn === null && (
              <Badge variant="secondary">جاري الفحص...</Badge>
            )}
            {hasUpdatedAtColumn === true && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                جاهز
              </Badge>
            )}
            {hasUpdatedAtColumn === false && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                يتطلب إصلاح
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={checkSalesTableStructure}
              variant="outline"
              disabled={isFixing}
            >
              فحص الجدول
            </Button>

            {hasUpdatedAtColumn === false && (
              <Button onClick={fixSalesTable} disabled={isFixing}>
                إصلاح الجدول
              </Button>
            )}
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
            <h3 className="font-medium text-blue-900 mb-2">تفسير المشكلة:</h3>
            <p className="text-sm text-blue-800 mb-2">
              كود المزامنة يحاول تحديث العمود "updated_at" في جدول المبيعات،
              ولكن هذا العمود غير موجود في قاعدة البيانات.
            </p>
            <p className="text-sm text-blue-800">
              الحل: إضافة العمود "updated_at" إلى جدول المبيعات مع قيمة افتراضية
              وإنشاء Trigger لتحديثه تلقائياً.
            </p>
          </div>

          {/* Manual Fix Instructions */}
          {hasUpdatedAtColumn === false && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">
                الإصلاح اليدوي (اختياري):
              </h3>
              <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                <li>انسخ محتوى ملف SALES_TABLE_FIX.sql</li>
                <li>ادخل إلى Supabase Dashboard → SQL Editor</li>
                <li>الصق الكود وتنفيذه</li>
                <li>اضغط "فحص الجدول" للتأكد من الإصلاح</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
