import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  GraduationCap,
  Apple,
  Package,
  Activity,
  LogOut,
  Dumbbell,
  Menu,
  X,
  Settings,
  Download,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { logout, GYM_NAME, getLoginDuration } from "@/lib/auth-new";
import {
  getSubscribers,
  getCoursePoints,
  getDietItems,
  getProducts,
  getSales,
} from "@/lib/database-new";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "المشتركين", href: "/dashboard/subscribers", icon: Users },
  { name: "إضافة مشترك", href: "/dashboard/add-subscriber", icon: UserPlus },
  { name: "إدارة التمارين", href: "/dashboard/courses", icon: GraduationCap },
  {
    name: "إدارة الأنظمة الغذائية",
    href: "/dashboard/diet-plans",
    icon: Apple,
  },
  { name: "المخزون", href: "/dashboard/inventory", icon: Package },
  { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
  { name: "فحص النظام", href: "/dashboard/diagnostics", icon: Activity },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard/subscribers") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/subscribers"
      );
    }
    return location.pathname === href;
  };

  const handleBackupDownload = async () => {
    try {
      const subscribers = await getSubscribers();
      const coursePoints = await getCoursePoints();
      const dietItems = await getDietItems();
      const products = await getProducts();
      const sales = await getSales();

      const backup = {
        timestamp: new Date().toISOString(),
        gym_name: GYM_NAME,
        version: "2.0",
        data: {
          subscribers,
          coursePoints,
          dietItems,
          products,
          sales,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${GYM_NAME}-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating backup:", error);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
      dir="rtl"
    >
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 bg-white/90 backdrop-blur-sm shadow-xl border-l border-orange-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{GYM_NAME}</h1>
                <p className="text-xs text-gray-600">نظام إدارة الصالة</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-right",
                    isActive(item.href)
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-orange-100",
                  )}
                  onClick={() => {
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-orange-200 space-y-4">
            {/* Session Info */}
            <div className="text-center text-sm text-gray-600">
              <p>مدة الجلسة: {getLoginDuration()}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 ml-1" />
                    أدوات
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleBackupDownload}>
                    <Download className="h-4 w-4 ml-2" />
                    تحميل نسخة احتياطية
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()}>
                    <FileText className="h-4 w-4 ml-2" />
                    طباعة الصفحة
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pr-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-orange-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg font-semibold text-gray-900">{GYM_NAME}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
