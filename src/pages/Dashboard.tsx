import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  BookOpen,
  UtensilsCrossed,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import SyncStatus from "@/components/SyncStatus";
import { db } from "@/lib/database";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCourses: 0,
    totalDietItems: 0,
    totalProducts: 0,
    todaySales: 0,
    lowStockProducts: 0,
  });

  const [recentMembers, setRecentMembers] = useState<any[]>([]);

  useEffect(() => {
    const calculateStats = () => {
      // Calculate stats
      const subscribers = db.getSubscribers();
      const courses = db.getCoursePoints();
      const dietItems = db.getDietItems();
      const products = db.getProducts();
      const sales = db.getSales();

      // Calculate today's sales
      const today = new Date().toISOString().split("T")[0];
      const todaySales = sales
        .filter((sale) => sale.date.startsWith(today))
        .reduce((total, sale) => total + sale.total_price, 0);

      // Find low stock products (quantity < 5)
      const lowStockProducts = products.filter(
        (product) => product.quantity < 5,
      ).length;

      setStats({
        totalMembers: subscribers.length,
        totalCourses: courses.length,
        totalDietItems: dietItems.length,
        totalProducts: products.length,
        todaySales,
        lowStockProducts,
      });

      // Get recent members (last 5)
      const recent = subscribers
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);
      setRecentMembers(recent);
    };

    // Initialize sample data if needed
    const initData = async () => {
      try {
        console.log("🚀 تهيئة البيانات في Dashboard...");
        await db.initializeSampleData();
        // Recalculate stats after data is loaded
        calculateStats();
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    // Listen for data loaded events
    const handleDataLoaded = () => {
      console.log("📊 إعادة حساب الإحصائيات بعد تحميل البيانات...");
      calculateStats();
    };

    window.addEventListener("data-loaded-from-supabase", handleDataLoaded);
    window.addEventListener("gym-sync-completed", handleDataLoaded);

    initData();
    calculateStats(); // Initial calculation

    return () => {
      window.removeEventListener("data-loaded-from-supabase", handleDataLoaded);
      window.removeEventListener("gym-sync-completed", handleDataLoaded);
    };
  }, []);

  const quickActions = [
    {
      title: "إضافة مشترك جديد",
      description: "إضافة عضو جديد مع الخطة التدريبية",
      icon: UserPlus,
      link: "/add-member",
      color: "bg-green-500",
    },
    {
      title: "عرض المشتركين",
      description: "إدارة ومراجعة بيانات الأعضاء",
      icon: Users,
      link: "/members",
      color: "bg-blue-500",
    },
    {
      title: "مكتبة التمارين",
      description: "إدارة التمارين والبرامج التدريبية",
      icon: BookOpen,
      link: "/courses",
      color: "bg-purple-500",
    },
    {
      title: "المخزن والمبيعات",
      description: "إدارة المنتجات وعمليات البيع",
      icon: Package,
      link: "/products",
      color: "bg-orange-500",
    },
  ];

  const statCards = [
    {
      title: "إجمالي المشتركين",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "التمارين المتاحة",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "العناصر الغذائية",
      value: stats.totalDietItems,
      icon: UtensilsCrossed,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "المنتجات المتوفرة",
      value: stats.totalProducts,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              لوحة التحكم
            </h1>
            <p className="text-gray-600 mt-1">
              مرحباً بك في نظام إدارة صالة حسام جم
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Sync Status */}
        <SyncStatus />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="gym-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sales and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Sales */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                مبيعات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.todaySales} ر.س
                </div>
                <p className="text-gray-600">إجمالي المبيعات لليوم</p>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                تنبيهات المخزن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                {stats.lowStockProducts > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {stats.lowStockProducts}
                    </div>
                    <p className="text-gray-600">منتجات تحتاج إعادة تخزين</p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-3"
                      size="sm"
                    >
                      <Link to="/products">عرض المنتجات</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-2xl text-green-600 mb-2">✓</div>
                    <p className="text-gray-600">جميع المنتجات متوفرة</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className="group p-4 rounded-lg border border-gray-200 hover:border-gym-primary transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div
                        className={`p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-gym-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card className="gym-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>المشتركين الجدد</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/members">عرض الكل</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMembers.length > 0 ? (
              <div className="space-y-3">
                {recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gym-primary text-white rounded-full flex items-center justify-center font-medium">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600">{member.phone}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(member.created_at).toLocaleDateString("ar-EG")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد مشتركين حتى الآن</p>
                <Button asChild className="mt-3" size="sm">
                  <Link to="/add-member">إضافة أول مشترك</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
