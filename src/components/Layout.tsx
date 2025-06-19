import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  BookOpen,
  UtensilsCrossed,
  Package,
  LogOut,
  Menu,
  X,
  Timer,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import DiagnosticButton from "./DiagnosticButton";
import QuickStatusIndicator from "./QuickStatusIndicator";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, sessionTimeRemaining } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/",
      label: "لوحة التحكم",
      icon: Dumbbell,
    },
    {
      path: "/members",
      label: "المشتركين",
      icon: Users,
    },
    {
      path: "/add-member",
      label: "إضافة مشترك",
      icon: UserPlus,
    },
    {
      path: "/courses",
      label: "مكتبة التمارين",
      icon: BookOpen,
    },
    {
      path: "/diet",
      label: "مكتبة الغذاء",
      icon: UtensilsCrossed,
    },
    {
      path: "/products",
      label: "المخزن والمبيعات",
      icon: Package,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 rtl">
      {/* Mobile menu overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gym-primary rounded-full flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">حسام جم</h1>
                <p className="text-sm text-gray-500">كمال الأجسام</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Session info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">وقت الجلسة:</span>
            <Badge
              variant={sessionTimeRemaining < 60 ? "destructive" : "secondary"}
            >
              {Math.floor(sessionTimeRemaining / 60)}ساعة{" "}
              {sessionTimeRemaining % 60}دقيقة
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">حالة النظام:</span>
            <QuickStatusIndicator />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gym-primary text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gym-primary rounded-full flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">حسام جم</h1>
            </div>
            <div className="flex items-center gap-3">
              <QuickStatusIndicator />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>

        {/* Diagnostic Button - Fixed position on all pages */}
        <DiagnosticButton />
      </div>
    </div>
  );
};

export default Layout;
