import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  GraduationCap,
  Apple,
  Package,
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
import {
  logout,
  getMembers,
  getCourses,
  getDietPlans,
} from "@/lib/storage-new";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "الأعضاء", href: "/dashboard", icon: Users },
  { name: "إضافة مشترك", href: "/dashboard/add-member", icon: UserPlus },
  { name: "الكورسات", href: "/dashboard/courses", icon: GraduationCap },
  { name: "الأنظمة الغذائية", href: "/dashboard/diet-plans", icon: Apple },
  { name: "المخزن", href: "/dashboard/inventory", icon: Package },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBackupDownload = async () => {
    try {
      const [members, courses, dietPlans] = await Promise.all([
        getMembers(),
        getCourses(),
        getDietPlans(),
      ]);

      const backupData = {
        members,
        courses,
        dietPlans,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gym-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("حدث خطأ أثناء إنشاء النسخة الاحتياطية");
    }
  };

  const handleBackupPrint = async () => {
    try {
      const [members, courses, dietPlans] = await Promise.all([
        getMembers(),
        getCourses(),
        getDietPlans(),
      ]);

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>النسخة الاحتياطية - صالة حسام</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title { background: #f5f5f5; padding: 10px; border: 1px solid #000; font-weight: bold; font-size: 18px; }
            .item { border: 1px solid #ccc; padding: 10px; margin: 5px 0; }
            .member-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            .member-courses, .member-diets { margin-top: 10px; }
            @media print { body { font-size: 12px; } .header { page-break-after: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>النسخة الاحتياطية الكاملة - صالة حسام لكمال الأجسام والرشاقة</h1>
            <p>تاريخ الإنشاء: ${new Date().toLocaleDateString("ar-SA")}</p>
          </div>

          <div class="section">
            <div class="section-title">الأعضاء (${members.length})</div>
            ${members
              .map(
                (member) => `
              <div class="item">
                <div class="member-info">
                  <div><strong>الاسم:</strong> ${member.name}</div>
                  <div><strong>الهاتف:</strong> ${member.phone}</div>
                  <div><strong>العمر:</strong> ${member.age}</div>
                  <div><strong>تاريخ الانضمام:</strong> ${new Date(member.createdAt).toLocaleDateString("ar-SA")}</div>
                </div>
                ${
                  member.courses && member.courses.length > 0
                    ? `
                  <div class="member-courses">
                    <strong>الكورسات:</strong> ${member.courses
                      .map(
                        (courseId) =>
                          courses.find((c) => c.id === courseId)?.name ||
                          courseId,
                      )
                      .join(", ")}
                  </div>
                `
                    : ""
                }
                ${
                  member.dietPlans && member.dietPlans.length > 0
                    ? `
                  <div class="member-diets">
                    <strong>الأنظمة الغذائية:</strong> ${member.dietPlans
                      .map(
                        (dietId) =>
                          dietPlans.find((d) => d.id === dietId)?.name ||
                          dietId,
                      )
                      .join(", ")}
                  </div>
                `
                    : ""
                }
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">الكورسات (${courses.length})</div>
            ${courses
              .map(
                (course) => `
              <div class="item">
                <strong>${course.name}</strong> - أضيف في ${new Date(course.createdAt).toLocaleDateString("ar-SA")}
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">الأنظمة الغذائية (${dietPlans.length})</div>
            ${dietPlans
              .map(
                (diet) => `
              <div class="item">
                <strong>${diet.name}</strong> - أضيف في ${new Date(diet.createdAt).toLocaleDateString("ar-SA")}
              </div>
            `,
              )
              .join("")}
          </div>

          <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #666;">
            صمم البرنامج بواسطة حمزه احمد للتواصل واتساب ٠٧٨٠٠٦٥٧٨٢٢
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("Error creating backup print:", error);
      alert("حدث خطأ أثناء إنشاء نسخة الطباعة");
    }
  };

  const isActivePath = (href: string) => {
    if (href === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/members"
      );
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-900">صالة حسام</h1>
                <p className="text-sm text-gray-600">لكمال الأجسام والرشاقة</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                        : "text-gray-700 hover:text-orange-600 hover:bg-orange-50",
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                  >
                    <Settings className="h-4 w-4" />
                    الضبط
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleBackupDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    تنزيل نسخة احتياطية (JSON)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBackupPrint}>
                    <FileText className="h-4 w-4 mr-2" />
                    طباعة النسخة الاحتياطية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 text-sm font-medium",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                        : "text-gray-700 hover:text-orange-600 hover:bg-orange-50",
                    )}
                    onClick={() => {
                      navigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    handleBackupDownload();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Download className="h-4 w-4" />
                  تنزيل نسخة احتياطية
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    handleBackupPrint();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  طباعة النسخة الاحتياطية
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
