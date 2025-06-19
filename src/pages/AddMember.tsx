import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  Save,
  Plus,
  Trash2,
  Search,
  GraduationCap,
  Apple,
  User,
  Weight,
  Ruler,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  NewSubscriberData,
  NewGroupData,
  CoursePoint,
  DietItem,
} from "@/lib/gym-types";
import {
  createSubscriber,
  createGroup,
  getCoursePoints,
  getDietItems,
  initializeTables,
} from "@/lib/gym-database";

interface GroupToAdd {
  id: string;
  title: string;
  type: "course" | "diet";
  items: string[];
}

export default function AddMember() {
  const navigate = useNavigate();

  // Member basic info
  const [memberData, setMemberData] = useState<NewSubscriberData>({
    name: "",
    age: 0,
    weight: 0,
    height: 0,
    phone: "",
    notes: "",
  });

  // Groups to add
  const [courseGroups, setCourseGroups] = useState<GroupToAdd[]>([]);
  const [dietGroups, setDietGroups] = useState<GroupToAdd[]>([]);

  // Available options
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [dietItems, setDietItems] = useState<DietItem[]>([]);

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [dietDialogOpen, setDietDialogOpen] = useState(false);

  // Form states for new groups
  const [newCourseGroup, setNewCourseGroup] = useState<{
    title: string;
    selectedItems: string[];
  }>({
    title: "",
    selectedItems: [],
  });

  const [newDietGroup, setNewDietGroup] = useState<{
    title: string;
    selectedItems: string[];
  }>({
    title: "",
    selectedItems: [],
  });

  // Search terms
  const [courseSearch, setCourseSearch] = useState("");
  const [dietSearch, setDietSearch] = useState("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await initializeTables();
      const [coursePointsData, dietItemsData] = await Promise.all([
        getCoursePoints(),
        getDietItems(),
      ]);
      setCoursePoints(coursePointsData);
      setDietItems(dietItemsData);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("فشل في تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourseGroup = () => {
    if (newCourseGroup.selectedItems.length === 0) {
      setError("يجب اختيار تمرين واحد على الأقل");
      return;
    }

    const newGroup: GroupToAdd = {
      id: Date.now().toString(),
      title: newCourseGroup.title || "مجموعة تمارين",
      type: "course",
      items: newCourseGroup.selectedItems,
    };

    setCourseGroups((prev) => [...prev, newGroup]);
    setNewCourseGroup({ title: "", selectedItems: [] });
    setCourseDialogOpen(false);
    setError(null);
  };

  const handleAddDietGroup = () => {
    if (newDietGroup.selectedItems.length === 0) {
      setError("يجب اختيار عنصر غذائي واحد على الأقل");
      return;
    }

    const newGroup: GroupToAdd = {
      id: Date.now().toString(),
      title: newDietGroup.title || "مجموعة غذائية",
      type: "diet",
      items: newDietGroup.selectedItems,
    };

    setDietGroups((prev) => [...prev, newGroup]);
    setNewDietGroup({ title: "", selectedItems: [] });
    setDietDialogOpen(false);
    setError(null);
  };

  const handleRemoveGroup = (groupId: string, type: "course" | "diet") => {
    if (type === "course") {
      setCourseGroups((prev) => prev.filter((g) => g.id !== groupId));
    } else {
      setDietGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  const handleItemToggle = (
    itemName: string,
    checked: boolean,
    type: "course" | "diet",
  ) => {
    if (type === "course") {
      setNewCourseGroup((prev) => ({
        ...prev,
        selectedItems: checked
          ? [...prev.selectedItems, itemName]
          : prev.selectedItems.filter((item) => item !== itemName),
      }));
    } else {
      setNewDietGroup((prev) => ({
        ...prev,
        selectedItems: checked
          ? [...prev.selectedItems, itemName]
          : prev.selectedItems.filter((item) => item !== itemName),
      }));
    }
  };

  const handleSave = async () => {
    if (!memberData.name.trim()) {
      setError("اسم المشترك مطلوب");
      return;
    }

    if (!memberData.phone.trim()) {
      setError("رقم الهاتف مطلوب");
      return;
    }

    if (memberData.age <= 0) {
      setError("العمر يجب أن يكون أكبر من صفر");
      return;
    }

    if (memberData.weight <= 0) {
      setError("الوزن يجب أن يكون أكبر من صفر");
      return;
    }

    if (memberData.height <= 0) {
      setError("الطول يجب أن يكون أكبر من صفر");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Create subscriber
      const subscriberId = await createSubscriber(memberData);

      // Create course groups
      for (const group of courseGroups) {
        await createGroup(subscriberId, {
          title: group.title,
          type: "course",
          items: group.items,
        });
      }

      // Create diet groups
      for (const group of dietGroups) {
        await createGroup(subscriberId, {
          title: group.title,
          type: "diet",
          items: group.items,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard/members");
      }, 2000);
    } catch (error) {
      console.error("Error saving member:", error);
      setError("فشل في حفظ بيانات المشترك");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCoursePoints = coursePoints.filter((course) =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const filteredDietItems = dietItems.filter((item) =>
    item.name.toLowerCase().includes(dietSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحضير النظام...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              تم حفظ البيانات بنجاح!
            </h2>
            <p className="text-gray-600 mb-6">
              تم إضافة المشترك وجميع المجموعات المرتبطة به
            </p>
            <p className="text-sm text-gray-500">
              سيتم توجيهك إلى صفحة المشتركين خلال ثوان...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  إضافة مشترك جديد
                </h1>
                <p className="text-gray-600">
                  إضافة مشترك جديد مع الكورسات والأنظمة الغذائية
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/members")}
              variant="outline"
              size="lg"
            >
              إلغاء والعودة
            </Button>
          </div>

          {error && (
            <Alert className="mt-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Member Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                معلومات المشترك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  value={memberData.name}
                  onChange={(e) =>
                    setMemberData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="أدخل اسم المشترك"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">العمر *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={memberData.age || ""}
                    onChange={(e) =>
                      setMemberData((prev) => ({
                        ...prev,
                        age: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="العمر"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">الوزن (كيلو) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={memberData.weight || ""}
                    onChange={(e) =>
                      setMemberData((prev) => ({
                        ...prev,
                        weight: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="الوزن"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">الطول (سم) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={memberData.height || ""}
                    onChange={(e) =>
                      setMemberData((prev) => ({
                        ...prev,
                        height: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="الطول"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={memberData.phone}
                    onChange={(e) =>
                      setMemberData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="05xxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">الملاحظات</Label>
                <Textarea
                  id="notes"
                  value={memberData.notes}
                  onChange={(e) =>
                    setMemberData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                size="lg"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    حفظ كل البيانات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Column 2: Courses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-orange-500" />
                  الكورسات
                </CardTitle>
                <Dialog
                  open={courseDialogOpen}
                  onOpenChange={setCourseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة مجموعة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إضافة مجموعة كورسات</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>عنوان المجموعة (اختياري)</Label>
                        <Input
                          value={newCourseGroup.title}
                          onChange={(e) =>
                            setNewCourseGroup((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="مثلاً: اليوم الأول، تمارين الصدر..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>البحث عن التمارين</Label>
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            placeholder="البحث عن تمرين..."
                            className="pr-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <Label>اختر التمارين:</Label>
                        {filteredCoursePoints.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded"
                          >
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={newCourseGroup.selectedItems.includes(
                                course.name,
                              )}
                              onCheckedChange={(checked) =>
                                handleItemToggle(
                                  course.name,
                                  checked as boolean,
                                  "course",
                                )
                              }
                            />
                            <label
                              htmlFor={`course-${course.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <span className="font-medium">{course.name}</span>
                              {course.description && (
                                <p className="text-sm text-gray-500">
                                  {course.description}
                                </p>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCourseDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleAddCourseGroup}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          إضافة المجموعة
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {courseGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>لم تتم إضافة أي مجموعة كورسات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="bg-orange-50 border-orange-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-orange-800">
                            {group.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleRemoveGroup(group.id, "course")
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-orange-100 text-orange-700"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Diet Plans */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-green-500" />
                  الأنظمة الغذائية
                </CardTitle>
                <Dialog open={dietDialogOpen} onOpenChange={setDietDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة مجموعة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إضافة مجموعة غذائية</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>عنوان المجموعة (اختياري)</Label>
                        <Input
                          value={newDietGroup.title}
                          onChange={(e) =>
                            setNewDietGroup((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="مثلاً: الفطور، الغداء، وجبة خفيفة..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>البحث عن العناصر الغذائية</Label>
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            value={dietSearch}
                            onChange={(e) => setDietSearch(e.target.value)}
                            placeholder="البحث عن عنصر غذائي..."
                            className="pr-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <Label>اختر العناصر الغذ��ئية:</Label>
                        {filteredDietItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded"
                          >
                            <Checkbox
                              id={`diet-${item.id}`}
                              checked={newDietGroup.selectedItems.includes(
                                item.name,
                              )}
                              onCheckedChange={(checked) =>
                                handleItemToggle(
                                  item.name,
                                  checked as boolean,
                                  "diet",
                                )
                              }
                            />
                            <label
                              htmlFor={`diet-${item.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <span className="font-medium">{item.name}</span>
                              {item.description && (
                                <p className="text-sm text-gray-500">
                                  {item.description}
                                </p>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDietDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleAddDietGroup}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          إضافة المجموعة
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {dietGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Apple className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>لم تتم إضافة أي مجموعة غذائية بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dietGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="bg-green-50 border-green-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-green-800">
                            {group.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveGroup(group.id, "diet")}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
