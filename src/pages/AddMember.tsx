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
  Search,
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
} from "lucide-react";
import { Member, Course, DietPlan } from "@/lib/types";
import {
  saveMember,
  getCourses,
  getDietPlans,
  getMemberById,
} from "@/lib/storage-new";
import { cn } from "@/lib/utils";

export default function AddMember() {
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

  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedDietPlans, setSelectedDietPlans] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Search states
  const [courseSearch, setCourseSearch] = useState("");
  const [dietSearch, setDietSearch] = useState("");
  const [coursesOpen, setCoursesOpen] = useState(false);
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

      // Ensure data is valid arrays before setting state
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
          name: member.name || "",
          age: member.age ? member.age.toString() : "",
          height: member.height ? member.height.toString() : "",
          weight: member.weight ? member.weight.toString() : "",
        });

        // Ensure arrays are valid
        const validCourses = Array.isArray(member.courses)
          ? member.courses
          : [];
        const validDietPlans = Array.isArray(member.dietPlans)
          ? member.dietPlans
          : [];

        setSelectedCourses(validCourses);
        setSelectedDietPlans(validDietPlans);
      }
    } catch (error) {
      console.error("Error loading member for edit:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
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
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const existingMember = isEditing ? await getMemberById(editId!) : null;

      const memberData: Member = {
        id: isEditing ? editId! : Date.now().toString(),
        name: formData.name.trim(),
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        courses: selectedCourses,
        dietPlans: selectedDietPlans,
        createdAt: existingMember?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await saveMember(memberData);
      setSaveSuccess(true);

      // Navigate back to members page after success
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const toggleDietPlan = (dietId: string) => {
    setSelectedDietPlans((prev) =>
      prev.includes(dietId)
        ? prev.filter((id) => id !== dietId)
        : [...prev, dietId],
    );
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
  };

  const removeDietPlan = (dietId: string) => {
    setSelectedDietPlans((prev) => prev.filter((id) => id !== dietId));
  };

  // Safe filtering with proper validation
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

  // Error boundary for critical errors
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
                : "إضافة عضو جديد إلى الصالة"}
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
                    min="1"
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

        {/* Courses Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              الكورسات التدريبية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right block">اختيار الكورسات</Label>
              {!dataLoaded ? (
                <Button
                  variant="outline"
                  className="w-full justify-between text-right"
                  disabled
                >
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  جاري التحميل...
                </Button>
              ) : (
                <Popover open={coursesOpen} onOpenChange={setCoursesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={coursesOpen}
                      className="w-full justify-between text-right"
                    >
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      {selectedCourses.length > 0
                        ? `تم اختيار ${selectedCourses.length} كورس`
                        : "اختر الكورسات..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="البحث في الكورسات..."
                        value={courseSearch}
                        onValueChange={setCourseSearch}
                        className="text-right"
                      />
                      <CommandList>
                        <CommandEmpty>لا توجد كورسات متطابقة</CommandEmpty>
                        <CommandGroup>
                          {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) =>
                              course && course.id ? (
                                <CommandItem
                                  key={course.id}
                                  value={course.name}
                                  onSelect={() => toggleCourse(course.id)}
                                  className="text-right cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Checkbox
                                      checked={selectedCourses.includes(
                                        course.id,
                                      )}
                                      readOnly
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {course.name || "كورس غير محدد"}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ) : null,
                            )
                          ) : (
                            <CommandItem
                              disabled
                              className="text-right text-gray-500"
                            >
                              {courses.length === 0
                                ? "لا توجد كورسات متاحة. يرجى إضافة كورسات من صفحة الكورسات أولاً."
                                : "لا توجد نتائج"}
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Selected Courses */}
            {selectedCourses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-right block text-sm text-gray-600">
                  الكورسات المختارة:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((courseId) => {
                    const course = courses?.find((c) => c.id === courseId);
                    return (
                      <Badge
                        key={courseId}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 px-3 py-1"
                      >
                        {course?.name || courseId}
                        <button
                          type="button"
                          onClick={() => removeCourse(courseId)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {dataLoaded && courses.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-right">
                  لا توجد كورسات متاحة حالياً. يمكنك إضافة الكورسات من صفحة
                  إدارة الكورسات.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Diet Plans Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Apple className="h-5 w-5 text-green-600" />
              الأنظمة الغذائية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right block">
                اختيار الأنظمة الغذائية
              </Label>
              {!dataLoaded ? (
                <Button
                  variant="outline"
                  className="w-full justify-between text-right"
                  disabled
                >
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  جاري التحميل...
                </Button>
              ) : (
                <Popover open={dietPlansOpen} onOpenChange={setDietPlansOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dietPlansOpen}
                      className="w-full justify-between text-right"
                    >
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      {selectedDietPlans.length > 0
                        ? `تم اختيار ${selectedDietPlans.length} نظام غذائي`
                        : "اختر الأنظمة الغذائية..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="البحث في الأنظمة الغذائية..."
                        value={dietSearch}
                        onValueChange={setDietSearch}
                        className="text-right"
                      />
                      <CommandList>
                        <CommandEmpty>
                          لا توجد أنظمة غذائية متطابقة
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredDietPlans.length > 0 ? (
                            filteredDietPlans.map((diet) =>
                              diet && diet.id ? (
                                <CommandItem
                                  key={diet.id}
                                  value={diet.name}
                                  onSelect={() => toggleDietPlan(diet.id)}
                                  className="text-right cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Checkbox
                                      checked={selectedDietPlans.includes(
                                        diet.id,
                                      )}
                                      readOnly
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {diet.name || "نظام غذائي غير محدد"}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ) : null,
                            )
                          ) : (
                            <CommandItem
                              disabled
                              className="text-right text-gray-500"
                            >
                              {dietPlans.length === 0
                                ? "لا توجد أنظمة غذائية متاحة. يرجى إضافة أنظمة غذائية من صفحة الأنظمة الغذائية أولاً."
                                : "لا توجد نتائج"}
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Selected Diet Plans */}
            {selectedDietPlans.length > 0 && (
              <div className="space-y-2">
                <Label className="text-right block text-sm text-gray-600">
                  الأنظمة الغذائية المختارة:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDietPlans.map((dietId) => {
                    const diet = dietPlans?.find((d) => d.id === dietId);
                    return (
                      <Badge
                        key={dietId}
                        variant="secondary"
                        className="bg-green-100 text-green-700 px-3 py-1"
                      >
                        {diet?.name || dietId}
                        <button
                          type="button"
                          onClick={() => removeDietPlan(dietId)}
                          className="ml-2 hover:text-green-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {dataLoaded && dietPlans.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-right">
                  لا توجد أنظمة غذائية متاحة حالياً. يمكنك إضافة الأنظمة
                  الغذائية من صفحة إدارة الأنظمة الغذائية.
                </AlertDescription>
              </Alert>
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
