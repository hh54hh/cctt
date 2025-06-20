import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Dumbbell,
  Utensils,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createRecord, SUPABASE_TABLES } from "@/lib/syncService";
import { db } from "@/lib/database";
import { toast } from "sonner";

interface CourseGroup {
  id: string;
  name: string;
  exercises: string[];
}

interface DietGroup {
  id: string;
  name: string;
  items: string[];
}

interface CoursePoint {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface DietItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function AddSubscriber() {
  const navigate = useNavigate();

  // Available data from database
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [dietItems, setDietItems] = useState<DietItem[]>([]);

  // Subscriber info state
  const [subscriberInfo, setSubscriberInfo] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    phone: "",
    notes: "",
  });

  // Courses state
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");

  // Diet state
  const [dietGroups, setDietGroups] = useState<DietGroup[]>([]);
  const [newDietName, setNewDietName] = useState("");
  const [selectedDietItems, setSelectedDietItems] = useState<string[]>([]);
  const [dietSearchTerm, setDietSearchTerm] = useState("");

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [savedSteps, setSavedSteps] = useState({
    info: false,
    courses: false,
    diet: false,
  });

  // Load available data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load course points from database
        const coursePointsData = await db.coursePoints.toArray();
        if (coursePointsData.length > 0) {
          setCoursePoints(coursePointsData);
        }

        // Load diet items from database
        const dietItemsData = await db.dietItems.toArray();
        if (dietItemsData.length > 0) {
          setDietItems(dietItemsData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Handle subscriber info save
  const handleSaveInfo = async () => {
    if (
      !subscriberInfo.name ||
      !subscriberInfo.age ||
      !subscriberInfo.weight ||
      !subscriberInfo.height
    ) {
      toast.error("يرجى ملء جميع الحقول الأساسية");
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSavedSteps((prev) => ({ ...prev, info: true }));
    toast.success("تم حفظ معلومات المشترك");
    setIsSaving(false);
  };

  // Handle course group addition
  const handleAddCourseGroup = () => {
    if (selectedExercises.length === 0) {
      toast.error("يرجى اختيار التمارين");
      return;
    }

    const groupName =
      newCourseName.trim() || `مجموعة ${courseGroups.length + 1}`;

    const newGroup: CourseGroup = {
      id: Date.now().toString(),
      name: groupName,
      exercises: [...selectedExercises],
    };

    setCourseGroups((prev) => [...prev, newGroup]);
    setNewCourseName("");
    setSelectedExercises([]);
    setExerciseSearchTerm("");
    toast.success("تم إضافة مجموعة الكورسات");
  };

  // Handle diet group addition
  const handleAddDietGroup = () => {
    if (selectedDietItems.length === 0) {
      toast.error("يرجى اختيار العناصر الغذائية");
      return;
    }

    const groupName =
      newDietName.trim() || `نظام غذائي ${dietGroups.length + 1}`;

    const newGroup: DietGroup = {
      id: Date.now().toString(),
      name: groupName,
      items: [...selectedDietItems],
    };

    setDietGroups((prev) => [...prev, newGroup]);
    setNewDietName("");
    setSelectedDietItems([]);
    setDietSearchTerm("");
    toast.success("تم إضافة المجموعة الغذائية");
  };

  // Handle final save
  const handleFinalSave = async () => {
    if (!savedSteps.info) {
      toast.error("يرجى حفظ معلومات المشترك أولاً");
      return;
    }

    setIsSaving(true);

    try {
      // Create subscriber record
      const subscriberId = await createRecord(SUPABASE_TABLES.subscribers, {
        name: subscriberInfo.name,
        age: parseInt(subscriberInfo.age),
        weight: parseFloat(subscriberInfo.weight),
        height: parseFloat(subscriberInfo.height),
        phone: subscriberInfo.phone,
        notes: subscriberInfo.notes || "",
      });

      // Create course groups and their items
      for (const courseGroup of courseGroups) {
        const groupId = await createRecord(SUPABASE_TABLES.groups, {
          subscriber_id: subscriberId,
          name: courseGroup.name,
          type: "course",
        });

        // Create group items for exercises
        for (const exercise of courseGroup.exercises) {
          await createRecord(SUPABASE_TABLES.groupItems, {
            group_id: groupId,
            name: exercise,
            description: "",
          });
        }
      }

      // Create diet groups and their items
      for (const dietGroup of dietGroups) {
        const groupId = await createRecord(SUPABASE_TABLES.groups, {
          subscriber_id: subscriberId,
          name: dietGroup.name,
          type: "diet",
        });

        // Create group items for diet items
        for (const dietItem of dietGroup.items) {
          await createRecord(SUPABASE_TABLES.groupItems, {
            group_id: groupId,
            name: dietItem,
            description: "",
          });
        }
      }

      setSavedSteps({ info: true, courses: true, diet: true });

      setTimeout(() => {
        navigate("/subscribers");
      }, 1500);
    } catch (error) {
      console.error("Error saving subscriber:", error);
      toast.error("حدث خطأ أثناء حفظ المشترك");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExercise = (exercise: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exercise)
        ? prev.filter((e) => e !== exercise)
        : [...prev, exercise],
    );
  };

  const toggleDietItem = (item: string) => {
    setSelectedDietItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/subscribers")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">إضافة مشترك جديد</h1>
            <p className="text-muted-foreground">
              إنشاء ملف شخصي كامل للمشترك مع الكورسات والأنظمة الغذائية
            </p>
          </div>
        </div>
        <Button
          className="gym-button"
          onClick={handleFinalSave}
          disabled={isSaving || !savedSteps.info}
        >
          {isSaving ? "جاري الحفظ..." : "حفظ المشترك"}
          <Save className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Progress Indicators */}
      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <div
          className={`flex items-center gap-2 ${savedSteps.info ? "text-success" : "text-muted-foreground"}`}
        >
          {savedSteps.info ? (
            <Check className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="text-sm">معلومات المشترك</span>
        </div>
        <div
          className={`flex items-center gap-2 ${courseGroups.length > 0 ? "text-success" : "text-muted-foreground"}`}
        >
          <Dumbbell className="w-4 h-4" />
          <span className="text-sm">الكورسات ({courseGroups.length})</span>
        </div>
        <div
          className={`flex items-center gap-2 ${dietGroups.length > 0 ? "text-success" : "text-muted-foreground"}`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-sm">
            الأنظمة الغذائية ({dietGroups.length})
          </span>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Column 1: Subscriber Info */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              معلومات المشترك
              {savedSteps.info && <Check className="w-5 h-5 text-success" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                value={subscriberInfo.name}
                onChange={(e) =>
                  setSubscriberInfo((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="أدخل الاسم الكامل"
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">العمر *</Label>
                <Input
                  id="age"
                  type="number"
                  value={subscriberInfo.age}
                  onChange={(e) =>
                    setSubscriberInfo((prev) => ({
                      ...prev,
                      age: e.target.value,
                    }))
                  }
                  placeholder="العمر"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">الوزن (كغ) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={subscriberInfo.weight}
                  onChange={(e) =>
                    setSubscriberInfo((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }))
                  }
                  placeholder="الوزن"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">الطول (سم) *</Label>
              <Input
                id="height"
                type="number"
                value={subscriberInfo.height}
                onChange={(e) =>
                  setSubscriberInfo((prev) => ({
                    ...prev,
                    height: e.target.value,
                  }))
                }
                placeholder="الطول"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={subscriberInfo.phone}
                onChange={(e) =>
                  setSubscriberInfo((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="رقم الهاتف"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={subscriberInfo.notes}
                onChange={(e) =>
                  setSubscriberInfo((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="أي ملاحظات خاصة..."
                className="text-right"
                rows={3}
              />
            </div>

            <Button
              className="w-full gym-button"
              onClick={handleSaveInfo}
              disabled={isSaving || savedSteps.info}
            >
              {savedSteps.info ? "تم الحفظ" : "حفظ المعلومات"}
              {savedSteps.info ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Column 2: Courses */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-primary" />
              الكورسات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Course Group Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label>اسم مجموعة الكورسات (اختياري)</Label>
                <Input
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="سيتم إنشاء اسم تلقائي إذا ترك فارغاً"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>البحث عن التمارين</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={exerciseSearchTerm}
                    onChange={(e) => setExerciseSearchTerm(e.target.value)}
                    placeholder="ابحث عن تمرين..."
                    className="pr-10 text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اختيار التمارين ({selectedExercises.length} محدد)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {coursePoints
                    .filter(
                      (point) =>
                        point.name
                          .toLowerCase()
                          .includes(exerciseSearchTerm.toLowerCase()) ||
                        point.description
                          .toLowerCase()
                          .includes(exerciseSearchTerm.toLowerCase()) ||
                        point.category
                          .toLowerCase()
                          .includes(exerciseSearchTerm.toLowerCase()),
                    )
                    .map((coursePoint) => (
                      <div
                        key={coursePoint.id}
                        onClick={() => toggleExercise(coursePoint.name)}
                        className={`p-3 border-b last:border-b-0 cursor-pointer transition-all hover:bg-muted/50 ${
                          selectedExercises.includes(coursePoint.name)
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {coursePoint.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {coursePoint.category}
                              </Badge>
                              {selectedExercises.includes(coursePoint.name) && (
                                <Badge variant="default" className="text-xs">
                                  محدد ✓
                                </Badge>
                              )}
                            </div>
                            {coursePoint.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {coursePoint.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {coursePoints.filter(
                    (point) =>
                      point.name
                        .toLowerCase()
                        .includes(exerciseSearchTerm.toLowerCase()) ||
                      point.description
                        .toLowerCase()
                        .includes(exerciseSearchTerm.toLowerCase()) ||
                      point.category
                        .toLowerCase()
                        .includes(exerciseSearchTerm.toLowerCase()),
                  ).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      لا توجد تمارين مطابقة للبحث
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAddCourseGroup}
                className="w-full"
                variant="outline"
                disabled={selectedExercises.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة مجموعة كورسات ({selectedExercises.length} تمرين)
              </Button>
            </div>

            {/* Course Groups List */}
            <div className="space-y-3">
              {courseGroups.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  لم يتم إضافة مجموعات كورسات بعد
                </div>
              ) : (
                courseGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {group.exercises.length} تمرين
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCourseGroups((prev) =>
                            prev.filter((g) => g.id !== group.id),
                          )
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.exercises.map((exercise, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {exercise}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Diet */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-gym-orange" />
              الأنظمة الغذائية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Diet Group Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label>اسم المجموعة الغذائية (اختياري)</Label>
                <Input
                  value={newDietName}
                  onChange={(e) => setNewDietName(e.target.value)}
                  placeholder="سيتم إنشاء اسم تلقائي إذا ترك فارغاً"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>البحث عن العناصر الغذائية</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={dietSearchTerm}
                    onChange={(e) => setDietSearchTerm(e.target.value)}
                    placeholder="ابحث عن عنصر غذائي..."
                    className="pr-10 text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  اختيار العناصر الغذائية ({selectedDietItems.length} محدد)
                </Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {dietItems
                    .filter(
                      (item) =>
                        item.name
                          .toLowerCase()
                          .includes(dietSearchTerm.toLowerCase()) ||
                        item.description
                          .toLowerCase()
                          .includes(dietSearchTerm.toLowerCase()) ||
                        item.category
                          .toLowerCase()
                          .includes(dietSearchTerm.toLowerCase()),
                    )
                    .map((dietItem) => (
                      <div
                        key={dietItem.id}
                        onClick={() => toggleDietItem(dietItem.name)}
                        className={`p-3 border-b last:border-b-0 cursor-pointer transition-all hover:bg-muted/50 ${
                          selectedDietItems.includes(dietItem.name)
                            ? "bg-gym-orange/10 border-l-4 border-l-gym-orange"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {dietItem.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {dietItem.category}
                              </Badge>
                              {selectedDietItems.includes(dietItem.name) && (
                                <Badge
                                  variant="default"
                                  className="text-xs bg-gym-orange"
                                >
                                  محدد ✓
                                </Badge>
                              )}
                              {dietItem.calories && (
                                <Badge variant="secondary" className="text-xs">
                                  {dietItem.calories} سعرة
                                </Badge>
                              )}
                            </div>
                            {dietItem.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {dietItem.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {dietItems.filter(
                    (item) =>
                      item.name
                        .toLowerCase()
                        .includes(dietSearchTerm.toLowerCase()) ||
                      item.description
                        .toLowerCase()
                        .includes(dietSearchTerm.toLowerCase()) ||
                      item.category
                        .toLowerCase()
                        .includes(dietSearchTerm.toLowerCase()),
                  ).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      لا توجد عناصر غذائية مطابقة للبحث
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAddDietGroup}
                className="w-full"
                variant="outline"
                disabled={selectedDietItems.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة مجموعة غذائية ({selectedDietItems.length} عنصر)
              </Button>
            </div>

            {/* Diet Groups List */}
            <div className="space-y-3">
              {dietGroups.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  لم يتم إضافة مجموعات غذائية بعد
                </div>
              ) : (
                dietGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 border rounded-lg bg-gym-orange/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {group.items.length} عنصر غذائي
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setDietGroups((prev) =>
                            prev.filter((g) => g.id !== group.id),
                          )
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((item, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
