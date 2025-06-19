import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, X, User, Dumbbell, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import { db } from "@/lib/database";

interface Group {
  title: string;
  type: "course" | "diet";
  items: string[];
}

const AddMember = () => {
  const navigate = useNavigate();

  // Member information
  const [memberInfo, setMemberInfo] = useState({
    name: "",
    phone: "",
    age: "",
    weight: "",
    height: "",
    notes: "",
  });

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);

  // Available items
  const [coursePoints] = useState(() => db.getCoursePoints());
  const [dietItems] = useState(() => db.getDietItems());

  // New group form
  const [newGroup, setNewGroup] = useState({
    title: "",
    type: "course" as "course" | "diet",
    selectedItems: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleMemberInfoChange = (field: string, value: string) => {
    setMemberInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelection = (itemId: string, checked: boolean) => {
    setNewGroup((prev) => ({
      ...prev,
      selectedItems: checked
        ? [...prev.selectedItems, itemId]
        : prev.selectedItems.filter((id) => id !== itemId),
    }));
  };

  const addGroup = () => {
    if (!newGroup.title.trim() || newGroup.selectedItems.length === 0) {
      setError("يجب إدخال عنوان المجموعة واختيار عنصر واحد على الأقل");
      return;
    }

    setGroups((prev) => [
      ...prev,
      {
        title: newGroup.title,
        type: newGroup.type,
        items: newGroup.selectedItems,
      },
    ]);

    setNewGroup({
      title: "",
      type: "course",
      selectedItems: [],
    });
    setError("");
  };

  const removeGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!memberInfo.name.trim() || !memberInfo.phone.trim()) {
      setError("يجب إدخال الاسم ورقم الهاتف على الأقل");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Starting member creation process...");

      // Create subscriber first
      const subscriber = await db.createSubscriber({
        name: memberInfo.name.trim(),
        phone: memberInfo.phone.trim(),
        age: parseInt(memberInfo.age) || 0,
        weight: parseFloat(memberInfo.weight) || 0,
        height: parseFloat(memberInfo.height) || 0,
        notes: memberInfo.notes.trim(),
      });

      console.log("Subscriber created:", subscriber.id);

      // Create groups and group items sequentially to avoid foreign key issues
      for (const group of groups) {
        console.log("Creating group:", group.title);

        const createdGroup = await db.createGroup({
          subscriber_id: subscriber.id,
          title: group.title.trim(),
          type: group.type,
        });

        console.log("Group created:", createdGroup.id);

        // Create group items one by one
        for (const itemId of group.items) {
          console.log("Creating group item for item:", itemId);

          await db.createGroupItem({
            group_id: createdGroup.id,
            item_id: itemId,
          });
        }
      }

      console.log("Member creation completed successfully");
      navigate("/members");
    } catch (error) {
      let userFriendlyMessage = "حدث خطأ أثناء حفظ البيانات";

      if (error instanceof Error) {
        console.error("Error saving member:", error);

        // Provide user-friendly error messages
        if (
          error.message.includes("relation") &&
          error.message.includes("does not exist")
        ) {
          userFriendlyMessage =
            "خطأ في قاعدة البيانات: الجداول غير موجودة. يرجى تنفيذ سكربت قاعدة البيانات.";
        } else if (
          error.message.includes("JWT") ||
          error.message.includes("Invalid API key")
        ) {
          userFriendlyMessage = "خطأ في الاتصال: مفتاح API غير صحيح.";
        } else if (error.message.includes("CORS")) {
          userFriendlyMessage = "خطأ في الاتصال: مشكلة في إعدادات CORS.";
        } else if (error.message.includes("Network")) {
          userFriendlyMessage = "خطأ في الشبكة: تحقق من اتصال الإنترنت.";
        } else if (error.message.includes("foreign key")) {
          userFriendlyMessage = "خطأ في العلاقات: مشكلة في ربط البيانات.";
        } else {
          userFriendlyMessage = `خطأ: ${error.message}`;
        }
      }

      setError(userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItems = newGroup.type === "course" ? coursePoints : dietItems;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            إضافة مشترك جديد
          </h1>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gym-button"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                حفظ المشترك
              </div>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Try to trigger diagnostic
                    const diagnosticButton = document.querySelector(
                      "[data-diagnostic-button]",
                    ) as HTMLButtonElement;
                    if (diagnosticButton) {
                      diagnosticButton.click();
                    }
                  }}
                  className="mt-2"
                >
                  تشخيص المشكلة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Member Information */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                معلومات المشترك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم *
                </label>
                <Input
                  value={memberInfo.name}
                  onChange={(e) =>
                    handleMemberInfoChange("name", e.target.value)
                  }
                  placeholder="اسم المشترك"
                  className="gym-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <Input
                  value={memberInfo.phone}
                  onChange={(e) =>
                    handleMemberInfoChange("phone", e.target.value)
                  }
                  placeholder="05xxxxxxxx"
                  className="gym-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العمر
                  </label>
                  <Input
                    type="number"
                    value={memberInfo.age}
                    onChange={(e) =>
                      handleMemberInfoChange("age", e.target.value)
                    }
                    placeholder="25"
                    className="gym-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوزن (كجم)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={memberInfo.weight}
                    onChange={(e) =>
                      handleMemberInfoChange("weight", e.target.value)
                    }
                    placeholder="70.5"
                    className="gym-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطول (سم)
                  </label>
                  <Input
                    type="number"
                    value={memberInfo.height}
                    onChange={(e) =>
                      handleMemberInfoChange("height", e.target.value)
                    }
                    placeholder="175"
                    className="gym-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <Textarea
                  value={memberInfo.notes}
                  onChange={(e) =>
                    handleMemberInfoChange("notes", e.target.value)
                  }
                  placeholder="أي ملاحظات إضافية..."
                  rows={4}
                  className="gym-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Training Groups */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                مجموعات التمارين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new group form */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان المجموعة
                    </label>
                    <Input
                      value={newGroup.title}
                      onChange={(e) =>
                        setNewGroup((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="مثال: تمارين الصدر والكتف"
                      className="gym-input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        newGroup.type === "course" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setNewGroup((prev) => ({
                          ...prev,
                          type: "course",
                          selectedItems: [],
                        }))
                      }
                      className="flex-1"
                    >
                      تمارين
                    </Button>
                    <Button
                      type="button"
                      variant={newGroup.type === "diet" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setNewGroup((prev) => ({
                          ...prev,
                          type: "diet",
                          selectedItems: [],
                        }))
                      }
                      className="flex-1"
                    >
                      غذاء
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {currentItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <Checkbox
                          id={item.id}
                          checked={newGroup.selectedItems.includes(item.id)}
                          onCheckedChange={(checked) =>
                            handleItemSelection(item.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={item.id}
                          className="text-sm cursor-pointer"
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-600">
                            {item.description}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={addGroup}
                    size="sm"
                    className="w-full gym-button-secondary"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة المجموعة
                  </Button>
                </div>
              </div>

              {/* Existing groups */}
              <div className="space-y-3">
                {groups.map((group, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            group.type === "course" ? "default" : "secondary"
                          }
                        >
                          {group.type === "course" ? "تمارين" : "غذاء"}
                        </Badge>
                        <span className="font-medium">{group.title}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGroup(index)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.items.length} عنصر محدد
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Diet Groups */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-green-600" />
                مجموعات الغذاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groups
                  .filter((g) => g.type === "diet")
                  .map((group, index) => (
                    <div
                      key={`diet-${index}`}
                      className="p-3 border border-gray-200 rounded-lg bg-green-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{group.title}</span>
                        <Badge variant="secondary">غذاء</Badge>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((itemId) => {
                          const item = dietItems.find((d) => d.id === itemId);
                          return item ? (
                            <div key={itemId} className="text-sm">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 mr-2">
                                - {item.description}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}

                {groups
                  .filter((g) => g.type === "course")
                  .map((group, index) => (
                    <div
                      key={`course-${index}`}
                      className="p-3 border border-gray-200 rounded-lg bg-purple-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{group.title}</span>
                        <Badge>تمارين</Badge>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((itemId) => {
                          const item = coursePoints.find(
                            (c) => c.id === itemId,
                          );
                          return item ? (
                            <div key={itemId} className="text-sm">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600 mr-2">
                                - {item.description}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}

                {groups.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لم يتم إضافة أي مجموعات بعد</p>
                    <p className="text-sm">
                      استخدم القسم الأوسط لإضافة المجموعات
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AddMember;
