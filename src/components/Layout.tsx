import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Users,
  UserPlus,
  Dumbbell,
  Utensils,
  Store,
  Receipt,
  Menu,
  X,
  LogOut,
  Home,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OfflineStatus from "./OfflineStatus";
import LowStockAlert from "./LowStockAlert";
import SyncStatus from "./SyncStatus";

const navigation = [
  { name: "المشتركين", href: "/subscribers", icon: Users },
  { name: "إضافة مشترك", href: "/add-subscriber", icon: UserPlus },
  { name: "الكورسات", href: "/courses", icon: Dumbbell },
  { name: "الأنظمة الغذائية", href: "/diet", icon: Utensils },
  { name: "المخزن", href: "/store", icon: Store },
  { name: "المبيعات", href: "/sales", icon: Receipt },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Status */}
      <OfflineStatus />

      {/* Low Stock Alert */}
      <LowStockAlert />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "sidebar-responsive bg-sidebar border-l border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  صالة حسام جم
                </h1>
                <p className="text-sm text-sidebar-foreground/60">
                  نظام إدارة الصالة
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="arabic">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="arabic">الإعدادات</span>
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="arabic">تسجيل خروج</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content-with-sidebar min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold truncate">
                نظام إدارة صالة حسام جم
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                مرحباً بك في نظام الإدارة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <SyncStatus compact />
            <div className="text-xs sm:text-sm text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString("ar-EG", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-foreground">
                ح
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
