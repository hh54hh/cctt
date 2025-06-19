import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { clearAllData } from "@/lib/storage-new";
import { useToast } from "@/hooks/use-toast";

export default function ClearDataComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearData = async () => {
    if (password !== "112233") {
      toast({
        title: "رمز خاطئ",
        description: "الرمز المدخل غير صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsClearing(true);

    try {
      await clearAllData();
      toast({
        title: "تم التفريغ بنجاح",
        description: "تم تفريغ جميع بيانات الأعضاء والكورسات بنجاح",
        variant: "default",
      });
      setIsOpen(false);
      setPassword("");

      // Refresh the page to show empty data
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "خطأ في التفريغ",
        description: "حدث خطأ أثناء تفريغ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPassword("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          <Trash2 className="h-4 w-4" />
          تفريغ البيانات
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            تفريغ جميع البيانات
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            هذا الإجراء سيقوم بحذف جميع بيانات الأعضاء والكورسات والخطط الغذائية
            نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              أدخل رمز التأكيد:
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز التأكيد"
              className="text-center"
              dir="ltr"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={handleCancel} disabled={isClearing}>
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearData}
            disabled={isClearing || !password.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isClearing ? "جاري التفريغ..." : "تفريغ البيانات"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
