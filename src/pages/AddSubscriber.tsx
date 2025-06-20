import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Edit, Trash2, User, Dumbbell, Apple } from "lucide-react";
import { syncService } from "@/lib/sync";
import type { CoursePoint, DietItem, Subscriber } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";

interface GroupData {
  id: string;
  title: string;
  type: "course" | "diet";
  items: { id: string; name: string }[];
}

export default function AddSubscriber() {
  const navigate = useNavigate();
  const [subscriberData, setSubscriberData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    phone: "",
    notes: "",
  });

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [groupType, setGroupType] = useState<"course" | "diet">("course");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const fetchCoursePoints = async () => {
    try {
      const data = await syncService.getRecords("course_points");
      setCoursePoints(data || []);
    } catch (error) {
      console.error("Error fetching course points:", error);
    }
  };

  const fetchDietItems = async () => {
    try {
      const data = await syncService.getRecords("diet_items");
      setDietItems(data || []);
    } catch (error) {
      console.error("Error fetching diet items:", error);
    }
  };

  useEffect(() => {
    fetchCoursePoints();
    fetchDietItems();
  }, []);

  const handleAddGroup = () => {
    if (selectedItems.length === 0) {
      toast.error("يرجى اختيار عناصر للمجموعة");
      return;
    }

    const availableItems = groupType === "course" ? coursePoints : dietItems;
    const groupItems = selectedItems.map((id) => {
      const item = availableItems.find((item) => item.id === id);
      return { id, name: item?.name || "" };
    });

    const newGroup: GroupData = {
      id: Date.now().toString(),
      title:
        groupTitle ||
        (groupType === "course" ? "مجموعة تمارين" : "مجموعة غذائية"),
      type: groupType,
      items: groupItems,
    };

    setGroups([...groups, newGroup]);
    setGroupTitle("");
    setSelectedItems([]);
    setIsAddGroupModalOpen(false);
    toast.success("تم إضافة المجموعة بنجاح");
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter((group) => group.id !== groupId));
    toast.success("تم حذف المجموعة");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!subscriberData.name || !subscriberData.phone) {
        toast.error("يرجى ملء الحقول المطلوبة");
        setIsLoading(false);
        return;
      }

      // Insert subscriber
      const subscriberId = await syncService.createRecord("subscribers", {
        name: subscriberData.name,
        age: parseInt(subscriberData.age) || 0,
        weight: parseFloat(subscriberData.weight) || 0,
        height: parseFloat(subscriberData.height) || 0,
        phone: subscriberData.phone,
        notes: subscriberData.notes,
      });

      // Insert groups
      for (const group of groups) {
        const groupId = await syncService.createRecord("groups", {
          subscriber_id: subscriberId,
          title: group.title,
          type: group.type,
        });

        // Insert group items
        for (const item of group.items) {
          await syncService.createRecord("group_items", {
            group_id: groupId,
            name: item.name,
          });
        }
      }

      toast.success("تم إضافة المشترك بنجاح");
      navigate("/subscribers");
    } catch (error) {
      toast.error("خطأ في حفظ البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const availableItems = groupType === "course" ? coursePoints : dietItems;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إضافة مشترك جديد</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Subscriber Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات المشترك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                value={subscriberData.name}
                onChange={(e) =>
                  setSubscriberData({ ...subscriberData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                type="number"
                value={subscriberData.age}
                onChange={(e) =>
                  setSubscriberData({ ...subscriberData, age: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="weight">الوزن (كيلو)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={subscriberData.weight}
                onChange={(e) =>
                  setSubscriberData({
                    ...subscriberData,
                    weight: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="height">الطول (سم)</Label>
              <Input
                id="height"
                type="number"
                value={subscriberData.height}
                onChange={(e) =>
                  setSubscriberData({
                    ...subscriberData,
                    height: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={subscriberData.phone}
                onChange={(e) =>
                  setSubscriberData({
                    ...subscriberData,
                    phone: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">الملاحظات</Label>
              <Textarea
                id="notes"
                value={subscriberData.notes}
                onChange={(e) =>
                  setSubscriberData({
                    ...subscriberData,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              مجموعات الكورسات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog
              open={isAddGroupModalOpen && groupType === "course"}
              onOpenChange={(open) => {
                if (!open) setIsAddGroupModalOpen(false);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setGroupType("course");
                    setIsAddGroupModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مجموعة كورسات
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مجموعة كورسات</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="courseTitle">
                      عنوان المجموعة (اختياري)
                    </Label>
                    <Input
                      id="courseTitle"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder="مثال: اليوم الأول"
                    />
                  </div>

                  <div>
                    <Label>اختيار التمارين</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={item.id}
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(
                                  selectedItems.filter((id) => id !== item.id),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={item.id} className="flex-1 text-sm">
                            {item.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddGroup}
                      className="flex-1"
                    >
                      إضافة
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddGroupModalOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {groups
                .filter((group) => group.type === "course")
                .map((group) => (
                  <div key={group.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{group.title}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGroup(group.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((item) => (
                        <Badge key={item.id} variant="secondary">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Diet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5" />
              الأنظمة الغذائية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog
              open={isAddGroupModalOpen && groupType === "diet"}
              onOpenChange={(open) => {
                if (!open) setIsAddGroupModalOpen(false);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setGroupType("diet");
                    setIsAddGroupModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مجموعة غذائية
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مجموعة غذائية</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dietTitle">عنوان المجموعة (اختياري)</Label>
                    <Input
                      id="dietTitle"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder="مثال: الفطور"
                    />
                  </div>

                  <div>
                    <Label>اختيار العناصر الغذائية</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={item.id}
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(
                                  selectedItems.filter((id) => id !== item.id),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={item.id} className="flex-1 text-sm">
                            {item.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddGroup}
                      className="flex-1"
                    >
                      إضافة
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddGroupModalOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {groups
                .filter((group) => group.type === "diet")
                .map((group) => (
                  <div key={group.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{group.title}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGroup(group.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((item) => (
                        <Badge key={item.id} variant="secondary">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="lg:col-span-3">
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/subscribers")}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-emerald-600"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ كل البيانات"}
            </Button>
          </div>
        </div>
      </form>

      {/* نظام التشخيص */}
      <DatabaseDiagnostics />
    </div>
  );
}
