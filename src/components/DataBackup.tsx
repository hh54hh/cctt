import { useState } from "react";
import {
  Download,
  Upload,
  Database,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dataManager } from "@/lib/database";
import { toast } from "sonner";

export default function DataBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Export all data
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await dataManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hussam-gym-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير النسخة الاحتياطية بنجاح");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("فشل في تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to localStorage (alternative backup)
  const handleExportToLocalStorage = () => {
    try {
      const gymData = {
        subscribers: localStorage.getItem("gym_subscribers"),
        coursePoints: localStorage.getItem("gym_course_points"),
        dietItems: localStorage.getItem("gym_diet_items"),
        products: localStorage.getItem("gym_products"),
        sales: localStorage.getItem("gym_sales"),
        attendance: localStorage.getItem("gym_attendance"),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(gymData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hussam-gym-localStorage-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير النسخة الاحتياطية من التخزين المحلي");
    } catch (error) {
      console.error("LocalStorage export failed:", error);
      toast.error("فشل في تصدير البيانات من التخزين المحلي");
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file);
      } else {
        toast.error("يرجى اختيار ملف JSON فقط");
        event.target.value = "";
      }
    }
  };

  // Import data
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف للاستيراد");
      return;
    }

    setIsImporting(true);
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data || typeof data !== "object") {
        throw new Error("ملف غير صالح");
      }

      // Check if it's IndexedDB export or localStorage export
      if (data.subscribers && Array.isArray(data.subscribers)) {
        // IndexedDB export
        await dataManager.importData(data);
        toast.success("تم استيراد البيانات من IndexedDB بنجاح");
      } else if (data.subscribers && typeof data.subscribers === "string") {
        // localStorage export
        await importFromLocalStorageBackup(data);
        toast.success("تم استيراد البيانات من التخزين المحلي بنجاح");
      } else {
        throw new Error("تنسيق ملف غير مدعوم");
      }

      // Refresh page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("فشل في استيراد البيانات: " + (error as Error).message);
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  // Import from localStorage backup
  const importFromLocalStorageBackup = async (data: any) => {
    try {
      if (data.subscribers)
        localStorage.setItem("gym_subscribers", data.subscribers);
      if (data.coursePoints)
        localStorage.setItem("gym_course_points", data.coursePoints);
      if (data.dietItems)
        localStorage.setItem("gym_diet_items", data.dietItems);
      if (data.products) localStorage.setItem("gym_products", data.products);
      if (data.sales) localStorage.setItem("gym_sales", data.sales);
      if (data.attendance)
        localStorage.setItem("gym_attendance", data.attendance);

      // Also sync with IndexedDB
      const parsedData = {
        subscribers: data.subscribers ? JSON.parse(data.subscribers) : [],
        coursePoints: data.coursePoints ? JSON.parse(data.coursePoints) : [],
        dietItems: data.dietItems ? JSON.parse(data.dietItems) : [],
        products: data.products ? JSON.parse(data.products) : [],
        sales: data.sales ? JSON.parse(data.sales) : [],
      };

      await dataManager.importData(parsedData);
    } catch (error) {
      throw new Error("فشل في معالجة بيانات التخزين المحلي");
    }
  };

  // Clear all data
  const handleClearData = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!",
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        "تأكيد أخير: سيتم حذف جميع المشتركين والكورسات والمنتجات والمبيعات. هل تريد المتابعة؟",
      )
    ) {
      return;
    }

    try {
      // Clear localStorage
      localStorage.removeItem("gym_subscribers");
      localStorage.removeItem("gym_course_points");
      localStorage.removeItem("gym_diet_items");
      localStorage.removeItem("gym_products");
      localStorage.removeItem("gym_sales");
      localStorage.removeItem("gym_attendance");

      // Clear IndexedDB
      await dataManager.importData({
        subscribers: [],
        groups: [],
        groupItems: [],
        coursePoints: [],
        dietItems: [],
        products: [],
        sales: [],
      });

      toast.success("تم حذف جميع البيانات");

      // Refresh page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Clear data failed:", error);
      toast.error("فشل في حذف البيانات");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          إدارة البيانات والنسخ الاحتياطية
        </h2>
        <p className="text-muted-foreground">
          تصدير واستيراد وإدارة بيانات النظام
        </p>
      </div>

      {/* Export Section */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            تصدير البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="gym-button"
            >
              {isExporting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  تصدير من قاعدة البيانات
                </>
              )}
            </Button>

            <Button onClick={handleExportToLocalStorage} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              تصدير من التخزين المحلي
            </Button>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              سيتم تحميل ملف JSON يحتوي على جميع بيانات النظام (المشتركين،
              الكورسات، المنتجات، المبيعات).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-primary" />
            استيراد البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-file">اختيار ملف النسخة الاحتياطية</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">الملف المحدد:</p>
              <p className="text-sm text-muted-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                الحجم: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full gym-button"
          >
            {isImporting ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                استيراد البيانات
              </>
            )}
          </Button>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تحذير:</strong> استيراد البيانات سيؤدي إلى استبدال جميع
              البيانات الحالية. تأكد من عمل نسخة احتياطية قبل الاستيراد.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Clear Data Section */}
      <Card className="gym-card border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            منطقة الخطر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            حذف جميع البيانات نهائياً من النظام. هذا الإجراء لا يمكن التراجع
            عنه.
          </p>

          <Button
            onClick={handleClearData}
            variant="destructive"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            حذف جميع البيانات
          </Button>

          <Alert className="border-destructive bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تحذير شديد:</strong> سيتم حذف جميع المشتركين، الكورسات،
              المنتجات، المبيعات وسجلات الحضور. تأكد من عمل نسخة احتياطية أولاً.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
