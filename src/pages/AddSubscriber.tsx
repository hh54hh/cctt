import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  Save,
  User,
  GraduationCap,
  Apple,
  Plus,
  X,
  Search,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  getCoursePoints,
  getDietItems,
  saveSubscriber,
  updateSubscriber,
  getSubscriberWithGroups,
} from "@/lib/database-offline";
import {
  CoursePoint,
  DietItem,
  SubscriberForm,
  GroupForm,
  SubscriberWithGroups,
} from "@/lib/types-new";

export default function AddSubscriber() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = Boolean(editId);

  // Form state
  const [formData, setFormData] = useState<SubscriberForm>({
    name: "",
    age: "",
    weight: "",
    height: "",
    phone: "",
    notes: "",
  });

  // Groups state
  const [courseGroups, setCourseGroups] = useState<GroupForm[]>([]);
  const [dietGroups, setDietGroups] = useState<GroupForm[]>([]);

  // Available options
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [dietItems, setDietItems] = useState<DietItem[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [dietModalOpen, setDietModalOpen] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(
    null,
  );

  // Current group form
  const [currentGroupForm, setCurrentGroupForm] = useState<GroupForm>({
    title: "",
    selectedItems: [],
  });

  // Search terms
  const [courseSearch, setCourseSearch] = useState("");
  const [dietSearch, setDietSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (
      isEditing &&
      editId &&
      coursePoints.length > 0 &&
      dietItems.length > 0
    ) {
      loadSubscriberForEdit(editId);
    }
  }, [isEditing, editId, coursePoints.length, dietItems.length]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [coursePointsData, dietItemsData] = await Promise.all([
        getCoursePoints(),
        getDietItems(),
      ]);
      setCoursePoints(coursePointsData);
      setDietItems(dietItemsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriberForEdit = async (id: string) => {
    try {
      const subscriber = await getSubscriberWithGroups(id);
      if (subscriber) {
        setFormData({
          name: subscriber.name,
          age: subscriber.age?.toString() || "",
          weight: subscriber.weight?.toString() || "",
          height: subscriber.height?.toString() || "",
          phone: subscriber.phone || "",
          notes: subscriber.notes || "",
        });

        // Convert groups to form format - map item names back to IDs
        const courseGroupsForm = subscriber.courseGroups.map((group) => ({
          title: group.title || "",
          selectedItems:
            group.items?.map((item) => {
              const coursePoint = coursePoints.find(
                (cp) => cp.name === item.name,
              );
              return coursePoint?.id || item.name;
            }) || [],
        }));

        const dietGroupsForm = subscriber.dietGroups.map((group) => ({
          title: group.title || "",
          selectedItems:
            group.items?.map((item) => {
              const dietItem = dietItems.find((di) => di.name === item.name);
              return dietItem?.id || item.name;
            }) || [],
        }));

        setCourseGroups(courseGroupsForm);
        setDietGroups(dietGroupsForm);
      }
    } catch (error) {
      console.error("Error loading subscriber for edit:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }

    if (
      formData.age &&
      (isNaN(Number(formData.age)) || Number(formData.age) < 1)
    ) {
      newErrors.age = "العمر يجب أن يكون رقم صحيح";
    }

    if (
      formData.weight &&
      (isNaN(Number(formData.weight)) || Number(formData.weight) < 1)
    ) {
      newErrors.weight = "الوزن يجب أن يكون رقم صحيح";
    }

    if (
      formData.height &&
      (isNaN(Number(formData.height)) || Number(formData.height) < 1)
    ) {
      newErrors.height = "الطول يجب أن يكون رقم صحيح";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setErrors({});

      if (isEditing && editId) {
        await updateSubscriber(editId, formData, courseGroups, dietGroups);
      } else {
        await saveSubscriber(formData, courseGroups, dietGroups);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard/subscribers");
      }, 1500);
    } catch (error) {
      console.error("Error saving subscriber:", error);
      setErrors({
        general: error instanceof Error ? error.message : "خطأ في حفظ البيانات",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openCourseModal = (groupIndex?: number) => {
    if (groupIndex !== undefined) {
      setEditingGroupIndex(groupIndex);
      setCurrentGroupForm(courseGroups[groupIndex]);
    } else {
      setEditingGroupIndex(null);
      setCurrentGroupForm({ title: "", selectedItems: [] });
    }
    setCourseSearch("");
    setCourseModalOpen(true);
  };

  const openDietModal = (groupIndex?: number) => {
    if (groupIndex !== undefined) {
      setEditingGroupIndex(groupIndex);
      setCurrentGroupForm(dietGroups[groupIndex]);
    } else {
      setEditingGroupIndex(null);
      setCurrentGroupForm({ title: "", selectedItems: [] });
    }
    setDietSearch("");
    setDietModalOpen(true);
  };

  const handleSaveCourseGroup = () => {
    if (editingGroupIndex !== null) {
      const updated = [...courseGroups];
      updated[editingGroupIndex] = currentGroupForm;
      setCourseGroups(updated);
    } else {
      setCourseGroups([...courseGroups, currentGroupForm]);
    }
    setCourseModalOpen(false);
  };

  const handleSaveDietGroup = () => {
    if (editingGroupIndex !== null) {
      const updated = [...dietGroups];
      updated[editingGroupIndex] = currentGroupForm;
      setDietGroups(updated);
    } else {
      setDietGroups([...dietGroups, currentGroupForm]);
    }
    setDietModalOpen(false);
  };

  const handleDeleteCourseGroup = (index: number) => {
    setCourseGroups(courseGroups.filter((_, i) => i !== index));
  };

  const handleDeleteDietGroup = (index: number) => {
    setDietGroups(dietGroups.filter((_, i) => i !== index));
  };

  const toggleCourseSelection = (courseId: string) => {
    const newSelected = currentGroupForm.selectedItems.includes(courseId)
      ? currentGroupForm.selectedItems.filter((id) => id !== courseId)
      : [...currentGroupForm.selectedItems, courseId];

    setCurrentGroupForm({
      ...currentGroupForm,
      selectedItems: newSelected,
    });
  };

  const toggleDietSelection = (dietId: string) => {
    const newSelected = currentGroupForm.selectedItems.includes(dietId)
      ? currentGroupForm.selectedItems.filter((id) => id !== dietId)
      : [...currentGroupForm.selectedItems, dietId];

    setCurrentGroupForm({
      ...currentGroupForm,
      selectedItems: newSelected,
    });
  };

  const filteredCoursePoints = coursePoints.filter((point) =>
    point.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const filteredDietItems = dietItems.filter((item) =>
    item.name.toLowerCase().includes(dietSearch.toLowerCase()),
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">تم الحفظ بنجاح!</h2>
          <p className="text-gray-600">
            {isEditing ? "تم تحديث بيانات المشترك" : "تم إضافة المشترك الجديد"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/subscribers")}
              className="p-2"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? "تعديل المشترك" : "إضافة مشترك جديد"}
              </h1>
              <p className="text-gray-600">
                {isEditing
                  ? "قم بتعديل بيانات المشترك ومجموعاته"
                  : "املأ البيانات وأضف المجموعات المطلوبة"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="h-5 w-5 ml-2" />
            )}
            {isSaving
              ? isEditing
                ? "جاري التحديث..."
                : "جاري الحفظ..."
              : isEditing
                ? "تحديث البيانات"
                : "حفظ كل البيانات"}
          </Button>
        </div>

        {/* Error Display */}
        {errors.general && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <User className="h-5 w-5" />
                معلومات المشترك الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="أدخل الاسم الكامل"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="age">العمر</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="العمر بالسنوات"
                  type="number"
                  min="1"
                  className={errors.age ? "border-red-500" : ""}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">الوزن (كيلو)</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  placeholder="الوزن بالكيلو جرام"
                  type="number"
                  min="1"
                  step="0.1"
                  className={errors.weight ? "border-red-500" : ""}
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                )}
              </div>

              <div>
                <Label htmlFor="height">الطول (سم)</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                  placeholder="الطول بالسنتيمتر"
                  type="number"
                  min="1"
                  className={errors.height ? "border-red-500" : ""}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm mt-1">{errors.height}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="رقم الهاتف"
                  type="tel"
                />
              </div>

              <div>
                <Label htmlFor="notes">الملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Course Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <GraduationCap className="h-5 w-5" />
                مجموعات الكورسات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => openCourseModal()}
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة مجموعة كورسات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingGroupIndex !== null
                        ? "تعديل مجموعة الكورسات"
                        : "إضافة مجموعة كورسات جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      اختر التمارين التي تريد إضافتها للمجموعة
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>عنوان المجموعة (اختياري)</Label>
                      <Input
                        value={currentGroupForm.title}
                        onChange={(e) =>
                          setCurrentGroupForm({
                            ...currentGroupForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="مثلاً: اليوم الأول، تمارين الأرجل..."
                      />
                    </div>

                    <div>
                      <Label>البحث في التمارين</Label>
                      <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="ابحث عن التمارين..."
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>اختر التمارين</Label>
                      <ScrollArea className="h-64 border rounded-md p-2">
                        <div className="space-y-2">
                          {filteredCoursePoints.map((point) => (
                            <div
                              key={point.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`course-${point.id}`}
                                checked={currentGroupForm.selectedItems.includes(
                                  point.id,
                                )}
                                onCheckedChange={() =>
                                  toggleCourseSelection(point.id)
                                }
                              />
                              <div className="flex-1 mr-2">
                                <label
                                  htmlFor={`course-${point.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {point.name}
                                </label>
                                {point.description && (
                                  <p className="text-xs text-gray-600">
                                    {point.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveCourseGroup}
                        disabled={currentGroupForm.selectedItems.length === 0}
                        className="flex-1"
                      >
                        {editingGroupIndex !== null ? "تحديث" : "إضافة"} (
                        {currentGroupForm.selectedItems.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCourseModalOpen(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Course Groups List */}
              <div className="space-y-3">
                {courseGroups.map((group, index) => (
                  <Card key={index} className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-900">
                          {group.title || `مجموعة كورسات ${index + 1}`}
                        </h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCourseModal(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourseGroup(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.selectedItems.slice(0, 3).map((courseId) => {
                          const course = coursePoints.find(
                            (c) => c.id === courseId,
                          );
                          return (
                            <Badge
                              key={courseId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {course?.name}
                            </Badge>
                          );
                        })}
                        {group.selectedItems.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.selectedItems.length - 3} أخرى
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Diet Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Apple className="h-5 w-5" />
                مجموعات الأنظمة الغذائية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={dietModalOpen} onOpenChange={setDietModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => openDietModal()}
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة مجموعة غذائية
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingGroupIndex !== null
                        ? "تعديل المجموعة الغذائية"
                        : "إضافة مجموعة غذائية جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      اختر العناصر الغذائية التي تريد إضافتها للمجموعة
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>عنوان المجموعة (اختياري)</Label>
                      <Input
                        value={currentGroupForm.title}
                        onChange={(e) =>
                          setCurrentGroupForm({
                            ...currentGroupForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="مثلاً: الفطور، الغداء، السناك..."
                      />
                    </div>

                    <div>
                      <Label>البحث في الأطعمة</Label>
                      <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={dietSearch}
                          onChange={(e) => setDietSearch(e.target.value)}
                          placeholder="ابحث عن الأطعمة..."
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>اختر الأطعمة</Label>
                      <ScrollArea className="h-64 border rounded-md p-2">
                        <div className="space-y-2">
                          {filteredDietItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`diet-${item.id}`}
                                checked={currentGroupForm.selectedItems.includes(
                                  item.id,
                                )}
                                onCheckedChange={() =>
                                  toggleDietSelection(item.id)
                                }
                              />
                              <div className="flex-1 mr-2">
                                <label
                                  htmlFor={`diet-${item.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {item.name}
                                </label>
                                {item.description && (
                                  <p className="text-xs text-gray-600">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveDietGroup}
                        disabled={currentGroupForm.selectedItems.length === 0}
                        className="flex-1"
                      >
                        {editingGroupIndex !== null ? "تحديث" : "إضافة"} (
                        {currentGroupForm.selectedItems.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDietModalOpen(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Diet Groups List */}
              <div className="space-y-3">
                {dietGroups.map((group, index) => (
                  <Card key={index} className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-900">
                          {group.title || `مجموعة غذائية ${index + 1}`}
                        </h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDietModal(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDietGroup(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.selectedItems.slice(0, 3).map((dietId) => {
                          const dietItem = dietItems.find(
                            (d) => d.id === dietId,
                          );
                          return (
                            <Badge
                              key={dietId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {dietItem?.name}
                            </Badge>
                          );
                        })}
                        {group.selectedItems.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.selectedItems.length - 3} أخرى
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
