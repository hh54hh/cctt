import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Users, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubscriberCard from "@/components/SubscriberCard";
import { Link } from "react-router-dom";
import { db } from "@/lib/database";

// Initial mock data - will be replaced by localStorage data
const initialMockSubscribers = [
  {
    id: "1",
    name: "أحمد محمد علي",
    age: 25,
    weight: 75,
    height: 180,
    phone: "01234567890",
    notes: "مبتدئ في الرياضة",
    created_at: "2024-01-15T10:00:00Z",
    courses: [
      {
        id: "c1",
        name: "كورس المبتدئين",
        exercises: ["تمرين الضغط", "تمرين العقلة", "تمرين القرفصاء"],
      },
    ],
    diet: [
      {
        id: "d1",
        name: "نظام زيادة الوزن",
        items: ["البروتين", "الكربوهيدرات", "الفيتامينات"],
      },
    ],
  },
  {
    id: "2",
    name: "فاطمة أحمد سالم",
    age: 30,
    weight: 65,
    height: 165,
    phone: "01987654321",
    notes: "تريد فقدان الوزن",
    created_at: "2024-01-20T14:30:00Z",
    courses: [
      {
        id: "c2",
        name: "كورس الكارديو",
        exercises: ["الجري", "السباحة", "الدراجة"],
      },
    ],
    diet: [
      {
        id: "d2",
        name: "نظام فقدان الوزن",
        items: ["الخضروات", "البروتين الخفيف", "الفواكه"],
      },
    ],
  },
  {
    id: "3",
    name: "محمد حسن عبدالله",
    age: 28,
    weight: 85,
    height: 175,
    phone: "01555666777",
    notes: "رياضي محترف",
    created_at: "2024-02-01T09:15:00Z",
    courses: [
      {
        id: "c3",
        name: "كورس المتقدمين",
        exercises: ["رفع الأثقال", "تمارين القوة", "التحمل"],
      },
      {
        id: "c4",
        name: "كورس اللياقة",
        exercises: ["اليوغا", "البيلاتس", "التمدد"],
      },
    ],
    diet: [
      {
        id: "d3",
        name: "نظام بناء العضلات",
        items: ["البروتين العالي", "الكرياتين", "الأحماض الأمينية"],
      },
    ],
  },
  {
    id: "4",
    name: "سارة عبدالرحمن",
    age: 22,
    weight: 58,
    height: 160,
    phone: "01444555666",
    created_at: "2024-02-10T16:45:00Z",
    courses: [],
    diet: [],
  },
  {
    id: "5",
    name: "علي حسام الدين",
    age: 35,
    weight: 90,
    height: 185,
    phone: "01333444555",
    notes: "يعاني من آلام الظهر",
    created_at: "2024-02-15T11:20:00Z",
    courses: [
      {
        id: "c5",
        name: "كورس العلاج الطبيعي",
        exercises: ["تمارين الظهر", "التقوية", "العلاج الطبيعي"],
      },
    ],
    diet: [
      {
        id: "d4",
        name: "نظام مضاد للالتهابات",
        items: ["الأوميغا 3", "المكملات الطبيعية", "الخضروات الورقية"],
      },
    ],
  },
];

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState(initialMockSubscribers);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Function to reload subscribers
  const reloadSubscribers = async () => {
    try {
      const subscribersData = await db.subscribers.toArray();

      if (subscribersData.length > 0) {
        // Load complete subscriber data with courses and diet
        const enrichedSubscribers = await Promise.all(
          subscribersData.map(async (subscriber) => {
            // Get all groups for this subscriber
            const subscriberGroups = await db.groups
              .where("subscriber_id")
              .equals(subscriber.id!)
              .toArray();

            const courses = [];
            const diet = [];

            // Process each group and get its items
            for (const group of subscriberGroups) {
              const groupItems = await db.groupItems
                .where("group_id")
                .equals(group.id!)
                .toArray();

              const items = groupItems.map((item) => item.name);

              if (group.type === "course") {
                courses.push({
                  id: group.id!,
                  name: group.name,
                  exercises: items,
                });
              } else if (group.type === "diet") {
                diet.push({
                  id: group.id!,
                  name: group.name,
                  items: items,
                });
              }
            }

            return {
              ...subscriber,
              courses,
              diet,
            };
          }),
        );

        setSubscribers(enrichedSubscribers);
      } else {
        setSubscribers([]);
      }
    } catch (error) {
      console.error("Error reloading subscribers:", error);
    }
  };

  // Load subscribers on component mount
  useEffect(() => {
    reloadSubscribers();
  }, []);

  const filteredAndSortedSubscribers = useMemo(() => {
    let filtered = subscribers.filter((subscriber) =>
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        break;
      case "age":
        filtered.sort((a, b) => a.age - b.age);
        break;
      default:
        break;
    }

    return filtered;
  }, [subscribers, searchTerm, sortBy]);

  const handleDeleteSubscriber = async (id: string) => {
    try {
      // Delete from database (cascading delete will handle groups and group_items)
      await db.subscribers.delete(id);

      // Update local state
      const updatedSubscribers = subscribers.filter((sub) => sub.id !== id);
      setSubscribers(updatedSubscribers);

      // Also trigger sync for deletion
      await db.syncQueue.add({
        table_name: "subscribers",
        record_id: id,
        operation: "delete",
        data: { id },
        created_at: new Date().toISOString(),
        retries: 0,
      });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    }
  };

  const stats = {
    total: subscribers.length,
    withCourses: subscribers.filter((s) => s.courses.length > 0).length,
    withDiet: subscribers.filter((s) => s.diet.length > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المشتركين</h1>
          <p className="text-muted-foreground">
            إدارة وعرض جميع المشتركين في الصالة
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={reloadSubscribers}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Link to="/add-subscriber">
            <Button className="gym-button">
              <Plus className="w-4 h-4 mr-2" />
              إضافة مشترك جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscriber-specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المشتركين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مع كورسات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مع أنظمة غذائية
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withDiet}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن مشترك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">الأحدث</SelectItem>
            <SelectItem value="oldest">الأقدم</SelectItem>
            <SelectItem value="name">الاسم</SelectItem>
            <SelectItem value="age">العمر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscribers Grid */}
      {filteredAndSortedSubscribers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد مشتركين</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "لم يتم العثور على مشتركين مطابقين لبحثك"
              : "ابدأ بإضافة مشتركين جدد إلى الصالة"}
          </p>
          {!searchTerm && (
            <Link to="/add-subscriber">
              <Button className="gym-button">
                <Plus className="w-4 h-4 mr-2" />
                إضافة أول مشترك
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="responsive-grid">
          {filteredAndSortedSubscribers.map((subscriber) => (
            <SubscriberCard
              key={subscriber.id}
              subscriber={subscriber}
              onDelete={handleDeleteSubscriber}
            />
          ))}
        </div>
      )}
    </div>
  );
}
