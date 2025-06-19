import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  UserPlus,
  Save,
  ArrowRight,
  Check,
  ChevronsUpDown,
  X,
  GraduationCap,
  Apple,
  User,
  Calendar,
  Ruler,
  Weight,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  Member,
  Course,
  DietPlan,
  CourseGroup,
  DietPlanGroup,
} from "@/lib/types";
import {
  saveMember,
  getCourses,
  getDietPlans,
  getMemberById,
} from "@/lib/storage-new";
import { cn } from "@/lib/utils";

export default function AddMemberEnhanced() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  // Error handling state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
  });

  // Legacy support
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedDietPlans, setSelectedDietPlans] = useState<string[]>([]);

  // New groups support
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [dietPlanGroups, setDietPlanGroups] = useState<DietPlanGroup[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Course group creation state
  const [newCourseGroup, setNewCourseGroup] = useState({
    title: "",
    selectedCourses: [] as string[],
  });
  const [courseSearch, setCourseSearch] = useState("");
  const [coursesOpen, setCoursesOpen] = useState(false);

  // Diet plan group creation state
  const [newDietPlanGroup, setNewDietPlanGroup] = useState({
    title: "",
    selectedDietPlans: [] as string[],
  });
  const [dietSearch, setDietSearch] = useState("");
  const [dietPlansOpen, setDietPlansOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && editId && dataLoaded) {
      loadMemberForEdit(editId);
    }
  }, [isEditing, editId, dataLoaded]);

  const loadData = async () => {
    try {
      setHasError(false);
      setErrorMessage("");

      const [coursesData, dietPlansData] = await Promise.all([
        getCourses(),
        getDietPlans(),
      ]);

      const validCourses = Array.isArray(coursesData) ? coursesData : [];
      const validDietPlans = Array.isArray(dietPlansData) ? dietPlansData : [];

      setCourses(validCourses);
      setDietPlans(validDietPlans);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setHasError(true);
      setErrorMessage("حدث خطأ في تحميل البيانات");
      setCourses([]);
      setDietPlans([]);
      setDataLoaded(true);
    }
  };

  const loadMemberForEdit = async (memberId: string) => {
    try {
      const member = await getMemberById(memberId);
      if (member) {
        setFormData({
          name: member.name,
          age: member.age.toString(),
          height: member.height.toString(),
          weight: member.weight.toString(),
        });

        const validCourses = Array.isArray(member.courses)
          ? member.courses
          : [];
        const validDietPlans = Array.isArray(member.dietPlans)
          ? member.dietPlans
          : [];
        const validCourseGroups = Array.isArray(member.courseGroups)
          ? member.courseGroups
          : [];
        const validDietPlanGroups = Array.isArray(member.dietPlanGroups)
          ? member.dietPlanGroups
          : [];

        setSelectedCourses(validCourses);
        setSelectedDietPlans(validDietPlans);
        setCourseGroups(validCourseGroups);
        setDietPlanGroups(validDietPlanGroups);
      }
    } catch (error) {
      console.error("Error loading member for edit:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "الاسم م��لوب";
    }

    if (
      !formData.age ||
      parseInt(formData.age) <= 0 ||
      parseInt(formData.age) > 100
    ) {
      newErrors.age = "يجب إدخال عمر صحيح (1-100)";
    }

    if (
      !formData.height ||
      parseInt(formData.height) <= 0 ||
      parseInt(formData.height) > 250
    ) {
      newErrors.height = "يجب إدخال طول صحيح (1-250 سم)";
    }

    if (
      !formData.weight ||
      parseInt(formData.weight) <= 0 ||
      parseInt(formData.weight) > 300
    ) {
      newErrors.weight = "يجب إدخال وزن صحيح (1-300 كيلو)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSaveSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const existingMember = isEditing ? await getMemberById(editId!) : null;

      // Calculate subscription dates
      const currentDate = new Date();
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // Add one month

      const memberData: Member = {
        id: isEditing ? editId! : Date.now().toString(),
        name: formData.name.trim(),
        phone: "",
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        courses: selectedCourses, // Keep for backward compatibility
        dietPlans: selectedDietPlans, // Keep for backward compatibility
        courseGroups: courseGroups,
        dietPlanGroups: dietPlanGroups,
        subscriptionStart: existingMember?.subscriptionStart || currentDate,
        subscriptionEnd: existingMember?.subscriptionEnd || subscriptionEnd,
        createdAt: existingMember?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await saveMember(memberData);
      setSaveSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Course group functions
  const addCourseGroup = () => {
    if (newCourseGroup.selectedCourses.length === 0) {
      return;
    }

    const group: CourseGroup = {
      id: Date.now().toString(),
      title: newCourseGroup.title.trim() || undefined,
      courseIds: newCourseGroup.selectedCourses,
      createdAt: new Date(),
    };

    setCourseGroups([...courseGroups, group]);
    setNewCourseGroup({ title: "", selectedCourses: [] });
  };

  const removeCourseGroup = (groupId: string) => {
    setCourseGroups(courseGroups.filter((group) => group.id !== groupId));
  };

  const toggleCourseForGroup = (courseId: string) => {
    setNewCourseGroup((prev) => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter((id) => id !== courseId)
        : [...prev.selectedCourses, courseId],
    }));
  };

  // Diet plan group functions
  const addDietPlanGroup = () => {
    if (newDietPlanGroup.selectedDietPlans.length === 0) {
      return;
    }

    const group: DietPlanGroup = {
      id: Date.now().toString(),
      title: newDietPlanGroup.title.trim() || undefined,
      dietPlanIds: newDietPlanGroup.selectedDietPlans,
      createdAt: new Date(),
    };

    setDietPlanGroups([...dietPlanGroups, group]);
    setNewDietPlanGroup({ title: "", selectedDietPlans: [] });
  };

  const removeDietPlanGroup = (groupId: string) => {
    setDietPlanGroups(dietPlanGroups.filter((group) => group.id !== groupId));
  };

  const toggleDietPlanForGroup = (dietPlanId: string) => {
    setNewDietPlanGroup((prev) => ({
      ...prev,
      selectedDietPlans: prev.selectedDietPlans.includes(dietPlanId)
        ? prev.selectedDietPlans.filter((id) => id !== dietPlanId)
        : [...prev.selectedDietPlans, dietPlanId],
    }));
  };

  // Filtered data
  const filteredCourses = React.useMemo(() => {
    if (!Array.isArray(courses) || !dataLoaded) return [];
    return courses.filter((course) =>
      course?.name?.toLowerCase().includes(courseSearch.toLowerCase()),
    );
  }, [courses, courseSearch, dataLoaded]);

  const filteredDietPlans = React.useMemo(() => {
    if (!Array.isArray(dietPlans) || !dataLoaded) return [];
    return dietPlans.filter((diet) =>
      diet?.name?.toLowerCase().includes(dietSearch.toLowerCase()),
    );
  }, [dietPlans, dietSearch, dataLoaded]);

  // Error boundary
  if (hasError) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">حدث خطأ</h3>
                <p className="text-gray-600 mt-2">
                  {errorMessage || "حدث خطأ غير متوقع"}
                </p>
                <Button
                  onClick={() => {
                    setHasError(false);
                    setErrorMessage("");
                    loadData();
                  }}
                  className="mt-4"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing
                    ? "تم تحديث البيانات بنجاح!"
                    : "تم إضافة العضو بنجاح!"}
                </h3>
                <p className="text-gray-600 mt-2">
                  سيتم تحويلك إلى صفحة الأعضاء...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "تعديل بيانات العضو" : "إضافة مشترك جديد"}
            </h1>
            <p className="text-gray-600">
              {isEditing
                ? "تحديث بيانات العضو الحالي"
                : "إضافة عضو جديد مع مجموعات مخصصة"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للأعضاء
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-orange-600" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-right block">
                  الاسم الكامل *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  className={cn(
                    "text-right",
                    errors.name && "border-red-500 focus:border-red-500",
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 text-right">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-right block">
                  العمر (سنة) *
                </Label>
                <div className="relative">
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="العمر"
                    min="1"
                    max="100"
                    className={cn(
                      "text-right",
                      errors.age && "border-red-500 focus:border-red-500",
                    )}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.age && (
                  <p className="text-sm text-red-600 text-right">
                    {errors.age}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-right block">
                  الطول (سم) *
                </Label>
                <div className="relative">
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) =>
                      handleInputChange("height", e.target.value)
                    }
                    placeholder="الطول بالسنتيمتر"
                    min="100"
                    max="250"
                    className={cn(
                      "text-right",
                      errors.height && "border-red-500 focus:border-red-500",
                    )}
                  />
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.height && (
                  <p className="text-sm text-red-600 text-right">
                    {errors.height}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-right block">
                  الوزن (كيلو) *
                </Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    placeholder="الوزن بالكيلوجرام"
                    min="1"
                    max="300"
                    className={cn(
                      "text-right",
                      errors.weight && "border-red-500 focus:border-red-500",
                    )}
                  />
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.weight && (
                  <p className="text-sm text-red-600 text-right">
                    {errors.weight}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              مجموعات الكورسات التدريبية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Course Group */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-4">
                إضافة مجموعة كورسات جديدة
              </h4>

              <div className="space-y-4">
                <div>
                  <Label className="text-right block mb-2">
                    عنوان المجموعة (اختياري)
                  </Label>
                  <Input
                    value={newCourseGroup.title}
                    onChange={(e) =>
                      setNewCourseGroup((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="مثال: اليوم الأول - الجزء العلوي"
                    className="text-right"
                  />
                </div>

                <div>
                  <Label className="text-right block mb-2">
                    اختيار الكورسات للمجموعة
                  </Label>
                  {!dataLoaded ? (
                    <Button variant="outline" disabled className="w-full">
                      جاري التحميل...
                    </Button>
                  ) : (
                    <Popover open={coursesOpen} onOpenChange={setCoursesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-right"
                        >
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                          {newCourseGroup.selectedCourses.length > 0
                            ? `تم اختيار ${newCourseGroup.selectedCourses.length} كورس`
                            : "اختر الكورسات..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="البحث في الكورسات..."
                            value={courseSearch}
                            onValueChange={setCourseSearch}
                          />
                          <CommandList>
                            <CommandEmpty>لا توجد كورسات متطابقة</CommandEmpty>
                            <CommandGroup>
                              {filteredCourses.map((course) => (
                                <CommandItem
                                  key={course.id}
                                  value={course.name}
                                  onSelect={() =>
                                    toggleCourseForGroup(course.id)
                                  }
                                  className="text-right cursor-pointer"
                                >
                                  <Checkbox
                                    checked={newCourseGroup.selectedCourses.includes(
                                      course.id,
                                    )}
                                    readOnly
                                    className="mr-2"
                                  />
                                  {course.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Selected courses for new group */}
                {newCourseGroup.selectedCourses.length > 0 && (
                  <div>
                    <Label className="text-right block mb-2">
                      الكورسات المختارة:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {newCourseGroup.selectedCourses.map((courseId) => {
                        const course = courses.find((c) => c.id === courseId);
                        return (
                          <Badge
                            key={courseId}
                            variant="secondary"
                            className="bg-blue-100"
                          >
                            {course?.name}
                            <button
                              type="button"
                              onClick={() => toggleCourseForGroup(courseId)}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={addCourseGroup}
                  disabled={newCourseGroup.selectedCourses.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة المجموعة
                </Button>
              </div>
            </div>

            {/* Existing Course Groups */}
            {courseGroups.length > 0 && (
              <div>
                <Label className="text-right block mb-4 text-lg font-semibold">
                  المجموعات المضافة:
                </Label>
                <div className="space-y-3">
                  {courseGroups.map((group, index) => (
                    <div
                      key={group.id}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCourseGroup(group.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="text-right flex-1">
                          {group.title ? (
                            <h5 className="font-semibold text-blue-800">
                              {group.title}
                            </h5>
                          ) : (
                            <h5 className="font-semibold text-gray-600">
                              مجموعة {index + 1}
                            </h5>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.courseIds.map((courseId) => {
                          const course = courses.find((c) => c.id === courseId);
                          return (
                            <Badge
                              key={courseId}
                              variant="outline"
                              className="text-xs"
                            >
                              {course?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diet Plan Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Apple className="h-5 w-5 text-green-600" />
              مجموعات الأنظمة الغذائية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Diet Plan Group */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="font-semibold text-green-800 mb-4">
                إضافة مجموعة أنظمة غذائية جديدة
              </h4>

              <div className="space-y-4">
                <div>
                  <Label className="text-right block mb-2">
                    عنوان المجموعة (اختياري)
                  </Label>
                  <Input
                    value={newDietPlanGroup.title}
                    onChange={(e) =>
                      setNewDietPlanGroup((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="مثال: البرنامج الغذائي اليومي"
                    className="text-right"
                  />
                </div>

                <div>
                  <Label className="text-right block mb-2">
                    اختيار الأنظمة الغذائية للمجموعة
                  </Label>
                  {!dataLoaded ? (
                    <Button variant="outline" disabled className="w-full">
                      جاري التحميل...
                    </Button>
                  ) : (
                    <Popover
                      open={dietPlansOpen}
                      onOpenChange={setDietPlansOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-right"
                        >
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                          {newDietPlanGroup.selectedDietPlans.length > 0
                            ? `تم اختيار ${newDietPlanGroup.selectedDietPlans.length} نظام`
                            : "اختر الأنظمة الغذائية..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="البحث في الأنظمة الغذائية..."
                            value={dietSearch}
                            onValueChange={setDietSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              لا توجد أنظمة غذائية متطابقة
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredDietPlans.map((diet) => (
                                <CommandItem
                                  key={diet.id}
                                  value={diet.name}
                                  onSelect={() =>
                                    toggleDietPlanForGroup(diet.id)
                                  }
                                  className="text-right cursor-pointer"
                                >
                                  <Checkbox
                                    checked={newDietPlanGroup.selectedDietPlans.includes(
                                      diet.id,
                                    )}
                                    readOnly
                                    className="mr-2"
                                  />
                                  {diet.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Selected diet plans for new group */}
                {newDietPlanGroup.selectedDietPlans.length > 0 && (
                  <div>
                    <Label className="text-right block mb-2">
                      الأنظمة المختارة:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {newDietPlanGroup.selectedDietPlans.map((dietId) => {
                        const diet = dietPlans.find((d) => d.id === dietId);
                        return (
                          <Badge
                            key={dietId}
                            variant="secondary"
                            className="bg-green-100"
                          >
                            {diet?.name}
                            <button
                              type="button"
                              onClick={() => toggleDietPlanForGroup(dietId)}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={addDietPlanGroup}
                  disabled={newDietPlanGroup.selectedDietPlans.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة المجموعة
                </Button>
              </div>
            </div>

            {/* Existing Diet Plan Groups */}
            {dietPlanGroups.length > 0 && (
              <div>
                <Label className="text-right block mb-4 text-lg font-semibold">
                  المجموعات المضافة:
                </Label>
                <div className="space-y-3">
                  {dietPlanGroups.map((group, index) => (
                    <div
                      key={group.id}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDietPlanGroup(group.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="text-right flex-1">
                          {group.title ? (
                            <h5 className="font-semibold text-green-800">
                              {group.title}
                            </h5>
                          ) : (
                            <h5 className="font-semibold text-gray-600">
                              مجموعة {index + 1}
                            </h5>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.dietPlanIds.map((dietId) => {
                          const diet = dietPlans.find((d) => d.id === dietId);
                          return (
                            <Badge
                              key={dietId}
                              variant="outline"
                              className="text-xs"
                            >
                              {diet?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg h-12"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? "جاري التحديث..." : "جاري الحفظ..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "تحديث البيانات" : "حفظ العضو"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="px-8"
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
