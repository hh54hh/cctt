import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Plus,
  GraduationCap,
  Apple,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/lib/auth";
import { offlineManager } from "@/lib/offline-manager";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState(0);

  // Function to actually test internet connectivity
  const testActualConnectivity = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Test with a small request to check actual internet connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://httpbin.org/get", {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log("Connectivity test failed:", error);
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      // Double-check with actual connectivity test
      const actuallyOnline = await testActualConnectivity();
      setIsOnline(actuallyOnline);

      if (actuallyOnline) {
        offlineManager.syncPendingOperations();
      }
    };

    const handleOffline = () => setIsOnline(false);

    const updatePendingOps = async () => {
      const ops = await offlineManager.getPendingOperations();
      setPendingOps(ops.length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dataRefreshNeeded", updatePendingOps);

    // Initial connectivity check
    const initialConnectivityCheck = async () => {
      const actuallyOnline = await testActualConnectivity();
      setIsOnline(actuallyOnline);
    };

    initialConnectivityCheck();

    // Check pending operations periodically
    updatePendingOps();
    const pendingOpsInterval = setInterval(updatePendingOps, 30000); // Every 30 seconds

    // Periodic connectivity check (every 2 minutes when navigator says we're online)
    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const actuallyOnline = await testActualConnectivity();
        setIsOnline(actuallyOnline);
      }
    }, 120000); // Every 2 minutes

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dataRefreshNeeded", updatePendingOps);
      clearInterval(pendingOpsInterval);
      clearInterval(connectivityInterval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    {
      name: "المشتركين",
      href: "/dashboard/members",
      icon: Users,
      current: location.pathname === "/dashboard/members",
    },
    {
      name: "إضافة مشترك",
      href: "/dashboard/add-member",
      icon: Plus,
      current: location.pathname === "/dashboard/add-member",
    },
    {
      name: "الكورسات",
      href: "/dashboard/courses",
      icon: GraduationCap,
      current: location.pathname === "/dashboard/courses",
    },
    {
      name: "الأنظمة الغذائية",
      href: "/dashboard/diet-plans",
      icon: Apple,
      current: location.pathname === "/dashboard/diet-plans",
    },
    {
      name: "المبيعات",
      href: "/dashboard/inventory",
      icon: ShoppingCart,
      current: location.pathname === "/dashboard/inventory",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Online/Offline Status Bar */}
      {!isOnline && (
        <div
          className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium"
          dir="rtl"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>وضع عدم الاتصال - البيانات محفوظة محلياً</span>
            {pendingOps > 0 && (
              <span className="bg-amber-600 px-2 py-1 rounded-full text-xs">
                {pendingOps} عملية معلقة
              </span>
            )}
          </div>
        </div>
      )}

      {isOnline && pendingOps > 0 && (
        <div
          className="bg-blue-500 text-white text-center py-2 px-4 text-sm font-medium"
          dir="rtl"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4 animate-pulse" />
            <span>جاري مزامنة {pendingOps} عملية معلقة...</span>
          </div>
        </div>
      )}

      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/assets/f91a990b079c48309bb2a3ebf32314b6/photo_2025-06-17_16-27-55-183bb1?format=webp&width=80"
                alt="شعار صالة حسام"
                className="w-12 h-12 rounded-full object-cover border-2 border-orange-400 shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">صالة حسام</h1>
                <p className="text-sm text-gray-600">لكمال الأجسام والرشاقة</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={item.current ? "default" : "ghost"}
                      className={`flex items-center gap-2 ${
                        item.current
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 ml-2"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4" dir="rtl">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={item.current ? "default" : "ghost"}
                        className={`w-full justify-start flex items-center gap-3 ${
                          item.current
                            ? "bg-orange-500 text-white"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 mt-4"
                >
                  <LogOut className="w-5 h-5 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <img
              src="https://cdn.builder.io/api/v1/assets/f91a990b079c48309bb2a3ebf32314b6/photo_2025-06-17_16-27-55-183bb1?format=webp&width=32"
              alt="شعار صالة حسام"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span>صالة حسام لكمال الأجسام والرشاقة © 2025</span>
            {!isOnline && (
              <span className="text-amber-600 font-medium">
                • وضع عدم الاتصال
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
