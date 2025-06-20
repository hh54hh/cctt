import { useEffect, useState } from "react";
import {
  Users,
  Dumbbell,
  Utensils,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  totalSubscribers: number;
  totalCoursePoints: number;
  totalDietItems: number;
  totalProducts: number;
  totalSales: number;
  todayRevenue: number;
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    totalSubscribers: 0,
    totalCoursePoints: 0,
    totalDietItems: 0,
    totalProducts: 0,
    totalSales: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    // Load data from localStorage
    const subscribers = JSON.parse(
      localStorage.getItem("gym_subscribers") || "[]",
    );
    const coursePoints = JSON.parse(
      localStorage.getItem("gym_course_points") || "[]",
    );
    const dietItems = JSON.parse(
      localStorage.getItem("gym_diet_items") || "[]",
    );
    const products = JSON.parse(localStorage.getItem("gym_products") || "[]");
    const sales = JSON.parse(localStorage.getItem("gym_sales") || "[]");

    // Calculate today's revenue
    const today = new Date().toDateString();
    const todayRevenue = sales
      .filter((sale: any) => new Date(sale.created_at).toDateString() === today)
      .reduce((sum: number, sale: any) => sum + sale.total_amount, 0);

    setData({
      totalSubscribers: subscribers.length,
      totalCoursePoints: coursePoints.length,
      totalDietItems: dietItems.length,
      totalProducts: products.length,
      totalSales: sales.length,
      todayRevenue,
    });
  }, []);

  const stats = [
    {
      title: "إجمالي المشتركين",
      value: data.totalSubscribers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "نقاط الكورسات",
      value: data.totalCoursePoints,
      icon: Dumbbell,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "العناصر الغذائية",
      value: data.totalDietItems,
      icon: Utensils,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "المنتجات",
      value: data.totalProducts,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "إجمالي المبيعات",
      value: data.totalSales,
      icon: Receipt,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "إيرادات اليوم",
      value: `${data.todayRevenue.toFixed(2)} ر.س`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="gym-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
