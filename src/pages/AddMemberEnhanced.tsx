import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  GraduationCap,
  Apple,
  AlertCircle,
  CheckCircle,
  Edit,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createSubscriber,
  updateSubscriber,
  getSubscriberWithGroups,
  createGroup,
  deleteGroup,
  getCoursePoints,
  getDietItems,
  initializeTables,
} from "@/lib/gym-database";
import { CoursePoint, DietItem, SubscriberWithGroups } from "@/lib/gym-types";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";
import { offlineManager } from "@/lib/offline-manager";

interface GroupData {
  id?: string;
  title: string;
  type: "course" | "diet";
  selectedItems: string[];
}

export default function AddMemberEnhanced() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: 25,
    weight: 70,
    height: 170,
    phone: "",
    notes: "",
  });

  // Groups state
  const [courseGroups, setCourseGroups] = useState<GroupData[]>([]);
  const [dietGroups, setDietGroups] = useState<GroupData[]>([]);

  // Available options
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [dietItems, setDietItems] = useState<DietItem[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Dialog states
  const [addCourseGroupOpen, setAddCourseGroupOpen] = useState(false);
  const [addDietGroupOpen, setAddDietGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);

  useEffect(() => {
    loadData();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [editId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      // Initialize tables
      try {
        await initializeTables();
      } catch (initError) {
        if (
          initError instanceof Error &&
          initError.message === "TABLES_NOT_EXIST"
        ) {
          setNeedsSetup(true);
          return;
        }
      }

      // Load available options
      const [coursePointsData, dietItemsData] = await Promise.all([
        getCoursePoints(),
        getDietItems(),
      ]);

      setCoursePoints(coursePointsData);
      setDietItems(dietItemsData);

      // If editing, load existing data
      if (isEditing && editId) {
        await loadExistingMember(editId);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Network error") ||
          error.message.includes("NetworkError") ||
          error.message.includes("timeout"))
      ) {
        console.warn("Network error detected, continuing with offline mode");
        setError("مشكلة في الاتصال. يتم المتابعة في وضع عدم الاتصال.");
      } else {
        setError("فشل في تحميل البيانات");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingMember = async (id: string) => {
    try {
      const memberData = await getSubscriberWithGroups(id);
      if (memberData) {
        // Load basic info
        setFormData({
          name: memberData.name,
          age: memberData.age,
          weight: memberData.weight,
          height: memberData.height,
          phone: memberData.phone,
          notes: memberData.notes || "",
        });

        // Convert groups to editable format
        const courseGroupsData = memberData.course_groups.map((group) => ({
          id: group.id,
          title: group.title || "",
          type: "course" as const,
          selectedItems: group.items.map((item) => item.name),
        }));

        const dietGroupsData = memberData.diet_groups.map((group) => ({
          id: group.id,
          title: group.title || "",
          type: "diet" as const,
          selectedItems: group.items.map((item) => item.name),
        }));

        setCourseGroups(courseGroupsData);
        setDietGroups(dietGroupsData);
      }
    } catch (error) {
      console.error("Error loading existing member:", error);
      setError("فشل في تحميل بيانات المشترك");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("اسم المشترك مطلوب");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let subscriberId = editId;

      if (isEditing && editId) {
        // Update existing subscriber
        await updateSubscriber(editId, formData);

        // Update groups - First delete existing groups, then create new ones
        const existingMember = await getSubscriberWithGroups(editId);
        if (existingMember) {
          // Delete existing groups
          const deletePromises = [
            ...existingMember.course_groups.map((group) =>
              deleteGroup(group.id),
            ),
            ...existingMember.diet_groups.map((group) => deleteGroup(group.id)),
          ];
          await Promise.all(deletePromises);
        }
      } else {
        // Create new subscriber
        subscriberId = await createSubscriber(formData);
      }

      if (!subscriberId) {
        throw new Error("فشل في الحصول على معرف المشترك");
      }

      // Create groups
      const allGroups = [...courseGroups, ...dietGroups];
      for (const group of allGroups) {
        if (group.selectedItems.length > 0) {
          await createGroup(subscriberId, {
            title: group.title,
            type: group.type,
            items: group.selectedItems,
          });
        }
      }

      setSuccess(
        isEditing ? "تم تحديث المشترك بنجاح" : "تم إضافة المشترك بنجاح",
      );

      // Wait a moment then redirect
      setTimeout(() => {
        navigate("/dashboard/members");
      }, 1500);
    } catch (error) {
      console.error("Error saving member:", error);

      if (!isOnline) {
        // Save for offline sync
        await offlineManager.addPendingOperation({
          type: isEditing ? "UPDATE" : "CREATE",
          table: "subscribers",
          data: { formData, courseGroups, dietGroups },
          url: "https://ibluvphzaitnetwvvfzu.supabase.co/rest/v1/subscribers",
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(formData),
        });

        setSuccess("تم حفظ البيانات محلياً - ستتم المزامنة عند عودة الإنترنت");
        setTimeout(() => navigate("/dashboard/members"), 1500);
      } else {
        setError(isEditing ? "فشل في تحديث المشترك" : "فشل في إضافة المشترك");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addGroup = (
    type: "course" | "diet",
    title: string,
    items: string[],
  ) => {
    const newGroup: GroupData = {
      title,
      type,
      selectedItems: items,
    };

    if (type === "course") {
      setCourseGroups([...courseGroups, newGroup]);
    } else {
      setDietGroups([...dietGroups, newGroup]);
    }
  };

  const updateGroup = (
    index: number,
    type: "course" | "diet",
    updatedGroup: GroupData,
  ) => {
    if (type === "course") {
      const updated = [...courseGroups];
      updated[index] = updatedGroup;
      setCourseGroups(updated);
    } else {
      const updated = [...dietGroups];
      updated[index] = updatedGroup;
      setDietGroups(updated);
    }
    setEditingGroup(null);
  };

  const removeGroup = (index: number, type: "course" | "diet") => {
    if (type === "course") {
      setCourseGroups(courseGroups.filter((_, i) => i !== index));
    } else {
      setDietGroups(dietGroups.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with offline indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? "تعديل المشترك" : "إضافة مشترك جديد"}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600">
                    {isEditing
                      ? "تعديل بيانات المشترك وخططه"
                      : "إضافة مشترك جديد مع خططه التدريبية والغذائية"}
                  </p>
                  {!isOnline && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <WifiOff className="h-4 w-4" />
                      <span>وضع عدم الاتصال</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/members")}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              العودة للقائمة
            </Button>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="أدخل الاسم الكامل"
                    required
                    className="text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">العمر</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          age: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="العمر"
                      min="10"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">الوزن (كيلو)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          weight: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="الوزن"
                      min="30"
                      max="300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">الطول (سم)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="الطول"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="رقم الهاتف"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">الملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="أي ملاحظات إضافية..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Groups */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-orange-500" />
                    الكورسات ({courseGroups.length})
                  </div>
                  <AddGroupDialog
                    type="course"
                    availableItems={coursePoints.map((cp) => cp.name)}
                    onAdd={(title, items) => addGroup("course", title, items)}
                    trigger={
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courseGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد مجموعات كور��ات</p>
                    <p className="text-sm">اضغط + لإضافة مجموعة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseGroups.map((group, index) => (
                      <GroupCard
                        key={index}
                        group={group}
                        index={index}
                        type="course"
                        availableItems={coursePoints.map((cp) => cp.name)}
                        onUpdate={(updatedGroup) =>
                          updateGroup(index, "course", updatedGroup)
                        }
                        onRemove={() => removeGroup(index, "course")}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diet Groups */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="h-5 w-5 text-green-500" />
                    الأنظمة الغذائية ({dietGroups.length})
                  </div>
                  <AddGroupDialog
                    type="diet"
                    availableItems={dietItems.map((di) => di.name)}
                    onAdd={(title, items) => addGroup("diet", title, items)}
                    trigger={
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dietGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Apple className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد مجموعات غذائية</p>
                    <p className="text-sm">اضغط + لإضافة مجموعة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dietGroups.map((group, index) => (
                      <GroupCard
                        key={index}
                        group={group}
                        index={index}
                        type="diet"
                        availableItems={dietItems.map((di) => di.name)}
                        onUpdate={(updatedGroup) =>
                          updateGroup(index, "diet", updatedGroup)
                        }
                        onRemove={() => removeGroup(index, "diet")}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              type="submit"
              disabled={isSaving}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  {isEditing ? "جاري التحديث..." : "جاري الحفظ..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  {isEditing ? "تحديث المشترك" : "حفظ المشترك"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Group Card Component
interface GroupCardProps {
  group: GroupData;
  index: number;
  type: "course" | "diet";
  availableItems: string[];
  onUpdate: (group: GroupData) => void;
  onRemove: () => void;
}

function GroupCard({
  group,
  index,
  type,
  availableItems,
  onUpdate,
  onRemove,
}: GroupCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(group.title);
  const [editItems, setEditItems] = useState<string[]>(group.selectedItems);

  const handleSave = () => {
    onUpdate({
      ...group,
      title: editTitle,
      selectedItems: editItems,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(group.title);
    setEditItems(group.selectedItems);
    setEditing(false);
  };

  const toggleItem = (item: string) => {
    if (editItems.includes(item)) {
      setEditItems(editItems.filter((i) => i !== item));
    } else {
      setEditItems([...editItems, item]);
    }
  };

  if (editing) {
    return (
      <Card
        className={`border-2 ${type === "course" ? "border-orange-200" : "border-green-200"}`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={`عنوان ${type === "course" ? "المجموعة" : "الوجبة"}`}
              className="font-medium"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {type === "course" ? "التمارين" : "العناصر الغذائية"}:
              </Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                {availableItems.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
                  >
                    <input
                      type="checkbox"
                      checked={editItems.includes(item)}
                      onChange={() => toggleItem(item)}
                      className="rounded"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                تم اختيار {editItems.length} عنصر
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 ml-1" />
                إلغاء
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${type === "course" ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4
            className={`font-semibold ${type === "course" ? "text-orange-800" : "text-green-800"}`}
          >
            {group.title ||
              `${type === "course" ? "مجموعة تمارين" : "مجموعة غذائية"} ${index + 1}`}
          </h4>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {group.selectedItems.map((item, itemIndex) => (
            <Badge
              key={itemIndex}
              variant="secondary"
              className={`text-xs ${type === "course" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
            >
              {item}
            </Badge>
          ))}
        </div>

        {group.selectedItems.length === 0 && (
          <p className="text-gray-500 text-sm italic">لا توجد عناصر مختارة</p>
        )}

        <p className="text-xs text-gray-500 mt-2">
          {group.selectedItems.length} عنصر
        </p>
      </CardContent>
    </Card>
  );
}

// Add Group Dialog Component
interface AddGroupDialogProps {
  type: "course" | "diet";
  availableItems: string[];
  onAdd: (title: string, items: string[]) => void;
  trigger: React.ReactNode;
}

function AddGroupDialog({
  type,
  availableItems,
  onAdd,
  trigger,
}: AddGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleAdd = () => {
    if (selectedItems.length > 0) {
      onAdd(title, selectedItems);
      setTitle("");
      setSelectedItems([]);
      setOpen(false);
    }
  };

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            إضافة {type === "course" ? "مجموعة تمارين" : "مجموعة غذائية"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-title">العنوان (اختياري)</Label>
            <Input
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`مثال: ${type === "course" ? "اليوم الأول، تمارين الصدر" : "الفطور، وجبة ما بعد التمرين"}`}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {type === "course" ? "اختر التمارين" : "اختر العناصر الغذائية"}:
            </Label>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {availableItems.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => toggleItem(item)}
                    className="rounded"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              تم اختيار {selectedItems.length} عنصر
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={selectedItems.length === 0}
              className={`flex-1 ${type === "course" ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}`}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة المجموعة
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
