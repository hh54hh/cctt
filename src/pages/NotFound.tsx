import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Home,
  ArrowLeft,
  AlertTriangle,
  Users,
  Plus,
  GraduationCap,
  Apple,
} from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  // Check if it's a common route that should be redirected
  const shouldRedirect = [
    "/add-member",
    "/members",
    "/courses",
    "/diet-plans",
  ].includes(location.pathname);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="text-center space-y-6 max-w-lg">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-800">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            الصفحة غير موجودة
          </h2>
          <p className="text-gray-600">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
        </div>

        {shouldRedirect && (
          <Alert className="border-blue-200 bg-blue-50 text-right">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>ملاحظة:</strong> يبدو أنك تحاول الوصول إلى صفحة صحيحة لكن
              بمسار قديم. استخدم الأزرار أدناه للانتقال للصفحة الصحيحة.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to="/dashboard">
              <Home className="w-4 h-4 ml-2" />
              الصفحة الرئيسية
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/members">
              <Users className="w-4 h-4 ml-2" />
              المشتركين
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/add-member">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مشترك
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/courses">
              <GraduationCap className="w-4 h-4 ml-2" />
              الكورسات
            </Link>
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            المسار المطلوب:{" "}
            <code className="bg-gray-200 px-2 py-1 rounded text-xs">
              {location.pathname}
            </code>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            نظام إدارة صالة حسام - جميع المسارات تبدأ بـ /dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
