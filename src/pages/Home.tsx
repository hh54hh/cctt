import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Dumbbell,
  Apple,
  TrendingUp,
  Calendar,
  Star,
  Package,
} from "lucide-react";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";

export default function Home() {
  const quickActions = [
    {
      title: "عرض المشتركين",
      description: "عرض جميع المشتركين وإدارة بياناتهم",
      icon: Users,
      path: "/subscribers",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "إضافة مشترك جديد",
      description: "إضافة مشترك جديد مع الخطة التدريبية والغذائية",
      icon: UserPlus,
      path: "/add-subscriber",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "إدارة الكورسات",
      description: "إدارة مكتبة التمارين والكورسات التدريبية",
      icon: Dumbbell,
      path: "/courses",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "الأنظمة الغذائية",
      description: "إدارة مكتبة العناصر والوجبات الغذائية",
      icon: Apple,
      path: "/diet",
      color: "from-green-500 to-green-600",
    },
    {
      title: "المخزن",
      description: "إدارة المنتجات والمبيعات",
      icon: Package,
      path: "/store",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const stats = [
    { label: "إجمالي المشتركين", value: "0", icon: Users },
    { label: "الكورسات المتاحة", value: "0", icon: Dumbbell },
    { label: "العناصر الغذائية", value: "0", icon: Apple },
    { label: "المنتجات في المخزن", value: "0", icon: Package },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          مرحباً بك في صالة حسام جم
        </h1>
        <p className="text-gray-600 text-lg">
          نظام إدارة شامل للمشتركين والبرامج التدريبية
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          الإجراءات السريعة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-200 border-0 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to={action.path}>
                    <Button className="w-full" variant="outline">
                      الانتقال إلى الصفحة
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            النشاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد أنشطة حديثة</p>
            <p className="text-sm">ابدأ بإضافة مشتركين جدد لرؤية النشاط هنا</p>
          </div>
        </CardContent>
      </Card>

      {/* نظام التشخيص */}
      <DatabaseDiagnostics />
    </div>
  );
}
