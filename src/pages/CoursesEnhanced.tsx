import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Eye,
  Copy,
  Download,
  X,
  Activity,
  Target,
  Star,
  Clock,
  TrendingUp,
} from "lucide-react";
import { CoursePoint } from "@/lib/gym-types";
import {
  getCoursePoints,
  createCoursePoint,
  updateCoursePoint,
  deleteCoursePoint,
  searchCoursePoints,
  initializeTables,
} from "@/lib/gym-database";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";

export default function CoursesEnhanced() {
  const [courses, setCourses] = useState<CoursePoint[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CoursePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<CoursePoint | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CoursePoint | null>(
    null,
  );
  const [courseToPreview, setCourseToPreview] = useState<CoursePoint | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, sortBy, sortOrder]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

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

      const coursesData = await getCoursePoints();
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل التمارين");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm) {
      filtered = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description &&
            course.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name, "ar");
      } else if (sortBy === "date") {
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredCourses(filtered);
  };

  const checkDuplicate = (name: string, excludeId?: string): boolean => {
    return courses.some(
      (course) =>
        course.name.toLowerCase() === name.toLowerCase() &&
        course.id !== excludeId,
    );
  };

  const handleAddCourse = async () => {
    if (!formData.name.trim()) {
      setError("اسم التمرين مطلوب");
      return;
    }

    if (checkDuplicate(formData.name.trim())) {
      setDuplicateError(`التمرين "${formData.name.trim()}" موجود بالفعل`);
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateError(null);
      await createCoursePoint(
        formData.name.trim(),
        formData.description.trim(),
      );
      await loadCourses();
      setAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      setSuccess("تم إضافة التمرين بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding course:", error);
      setError("فشل في إضافة التمرين");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourse = async () => {
    if (!courseToEdit || !formData.name.trim()) {
      setError("اسم التمرين مطلوب");
      return;
    }

    if (checkDuplicate(formData.name.trim(), courseToEdit.id)) {
      setDuplicateError(`التمرين "${formData.name.trim()}" موجود بالفعل`);
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateError(null);
      await updateCoursePoint(
        courseToEdit.id,
        formData.name.trim(),
        formData.description.trim(),
      );
      await loadCourses();
      setEditDialogOpen(false);
      setCourseToEdit(null);
      setFormData({ name: "", description: "" });
      setSuccess("تم تحديث التمرين بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating course:", error);
      setError("فشل في تحديث التمرين");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setIsSaving(true);
      await deleteCoursePoint(courseToDelete.id);
      await loadCourses();
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      setSuccess("تم حذف التمرين بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("فشل في حذف التمرين");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateCourse = async (course: CoursePoint) => {
    const newName = `${course.name} - نسخة`;
    const finalName = checkDuplicate(newName)
      ? `${newName} ${Date.now()}`
      : newName;

    try {
      await createCoursePoint(finalName, course.description || "");
      await loadCourses();
      setSuccess("تم نسخ التمرين بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error duplicating course:", error);
      setError("فشل في نسخ التمرين");
    }
  };

  const openEditDialog = (course: CoursePoint) => {
    setCourseToEdit(course);
    setFormData({
      name: course.name,
      description: course.description || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (course: CoursePoint) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = (course: CoursePoint) => {
    setCourseToPreview(course);
    setPreviewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setError(null);
    setDuplicateError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSort = (field: "name" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              جاري تحميل مكتبة التمارين
            </h2>
            <p className="text-gray-600">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadCourses} />;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {filteredCourses.length}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  مكتبة التمارين
                </h1>
                <p className="text-gray-600 text-lg">
                  إدارة وتنظيم مجموعة التمارين الرياضية
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                  setAddDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة تمرين جديد
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 shadow-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Enhanced Controls */}
        <Card className="mb-6 shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="البحث في التمارين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 text-lg bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4 ml-2" />
                        ) : (
                          <SortDesc className="h-4 w-4 ml-2" />
                        )
                      ) : sortOrder === "asc" ? (
                        <SortAsc className="h-4 w-4 ml-2" />
                      ) : (
                        <SortDesc className="h-4 w-4 ml-2" />
                      )}
                      ترتيب
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleSort("name")}>
                      <span className="mr-2">الاسم</span>
                      {sortBy === "name" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        ))}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort("date")}>
                      <span className="mr-2">التاريخ</span>
                      {sortBy === "date" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        ))}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode */}
                <div className="flex rounded-lg border border-gray-200 bg-white">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {filteredCourses.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-20">
              <div className="mb-6">
                <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-12 w-12 text-orange-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? "لا توجد نتائج" : "ابدأ ببناء مكتبة التمارين"}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm
                  ? `لم يتم العثور على تمارين تحتوي على "${searchTerm}"`
                  : "أضف التمارين والحركات الرياضية لبناء برامج تدريبية متكاملة"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة أول تمرين
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 truncate group-hover:text-yellow-100 transition-colors">
                            {course.name}
                          </h3>
                          <div className="flex items-center gap-2 text-orange-100">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDate(course.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                          <Activity className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-3 min-h-[60px]">
                        {course.description || "لا يوجد وصف لهذا التمرين"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreviewDialog(course)}
                        className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateCourse(course)}
                          >
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(course)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                قائمة التمارين ({filteredCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        اسم التمرين
                        {sortBy === "name" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        تاريخ الإضافة
                        {sortBy === "date" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Activity className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {course.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs">
                        <p className="truncate">
                          {course.description || "لا يوجد وصف"}
                        </p>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex flex-col">
                          <span>{formatDate(course.created_at)}</span>
                          <span className="text-xs">
                            {formatTime(course.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreviewDialog(course)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(course)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateCourse(course)}
                            className="text-gray-600 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(course)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              ➕ إضافة تمرين جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name" className="text-sm font-medium">
                اسم التمرين *
              </Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setDuplicateError(null);
                }}
                placeholder="مثال: بنش برس، سكوات، ديد ليفت..."
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description" className="text-sm font-medium">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف مفصل للتمرين، طريقة الأداء، العضلات المستهدفة..."
                rows={4}
              />
            </div>

            {(error || duplicateError) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {duplicateError || error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddCourse}
                disabled={isSaving || !formData.name.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? "جاري الحفظ..." : "إضافة التمرين"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setCourseToEdit(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              ✏️ تعديل التمرين
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                اسم التمرين *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setDuplicateError(null);
                }}
                placeholder="اسم التمرين"
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف التمرين..."
                rows={4}
              />
            </div>

            {(error || duplicateError) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {duplicateError || error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditCourse}
                disabled={isSaving || !formData.name.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? "جاري التحديث..." : "حفظ التعديلات"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              👁️ معاينة التمرين
            </DialogTitle>
          </DialogHeader>
          {courseToPreview && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div className="p-3 bg-orange-500 rounded-full w-fit mx-auto mb-3">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {courseToPreview.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-orange-200 text-orange-800"
                >
                  تمرين رياضي
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">الوصف:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {courseToPreview.description || "لا يوجد وصف لهذا التمرين"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    معلومات إضافية:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        تم الإنشاء: {formatDate(courseToPreview.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setPreviewDialogOpen(false);
                    openEditDialog(courseToPreview);
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل التمرين
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDuplicateCourse(courseToPreview)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              هل أنت متأكد من حذف التمرين{" "}
              <strong>"{courseToDelete?.name}"</strong>؟
              <br />
              <span className="text-red-600 font-medium">
                لا يمكن التراجع عن هذا الإجراء وقد يؤثر على الخطط التدريبية
                الموجودة.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              {isSaving ? "جاري الحذف..." : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
