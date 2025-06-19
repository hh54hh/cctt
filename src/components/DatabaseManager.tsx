import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { exportAllData, importAllData, clearAllData } from "@/lib/storage-new";

export default function DatabaseManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportAllData();

      // Create and download file
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage("تم تصدير البيانات بنجاح!");
      setMessageType("success");
    } catch (error) {
      setMessage("فشل في تصدير البيانات");
      setMessageType("error");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage("يرجى اختيار ملف للاستيراد");
      setMessageType("error");
      return;
    }

    try {
      setIsImporting(true);
      const fileContent = await importFile.text();
      await importAllData(fileContent);

      setMessage("تم استيراد البيانات بنجاح!");
      setMessageType("success");
      setImportFile(null);

      // Reload page to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage("فشل في استيراد البيانات - تأكد من صحة الملف");
      setMessageType("error");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();

      setMessage("تم حذف جميع البيانات بنجاح!");
      setMessageType("success");

      // Reload page to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage("فشل في حذف البيانات");
      setMessageType("error");
      console.error("Clear data error:", error);
    } finally {
      setIsClearing(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          إدارة قاعدة البيانات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Data */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 h-12"
            variant="outline"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تصدير البيانات
              </>
            )}
          </Button>

          {/* Import Data */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
              >
                <Upload className="h-4 w-4" />
                استيراد البيانات
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-right">
                  استيراد البيانات
                </DialogTitle>
                <DialogDescription className="text-right">
                  اختر ملف النسخة الاحتياطية لاستيراد البيانات.
                  <br />
                  <span className="text-orange-600 font-medium">
                    تحذير: سيتم استبدال جميع البيانات الحالية!
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-file" className="text-right block">
                    اختر ملف النسخة الاحتياطية
                  </Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="text-right"
                  />
                </div>

                {importFile && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700 text-sm">
                        {importFile.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <DialogTrigger asChild>
                  <Button variant="outline">إلغاء</Button>
                </DialogTrigger>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الاستيراد...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      استيراد
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clear All Data */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4" />
                حذف جميع البيانات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right text-red-600">
                  حذف جميع البيانات
                </AlertDialogTitle>
                <AlertDialogDescription className="text-right">
                  هل أنت متأكد من حذف جميع البيانات؟
                  <br />
                  <span className="text-red-600 font-bold">
                    سيتم حذف جميع الأعضاء والكورسات والأنظمة الغذائية والمنتجات
                    والمبيعات!
                  </span>
                  <br />
                  لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  disabled={isClearing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isClearing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الحذف...
                    </>
                  ) : (
                    "حذف جميع البيانات"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">معلومات مهمة:</h4>
          <ul className="space-y-1 text-right">
            <li>• يتم حفظ النسخة الاحتياطية بصيغة JSON</li>
            <li>• تحتوي النسخة الاحتياطية على جميع البيانات والإعدادات</li>
            <li>• يُنصح بإنشاء نسخة احتياطية دورياً</li>
            <li>• البيانات محفوظة محلياً في متصفحك</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
