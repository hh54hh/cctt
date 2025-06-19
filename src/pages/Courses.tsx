import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  GraduationCap,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
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

export default function Courses() {
  const [courses, setCourses] = useState<CoursePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<CoursePoint | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CoursePoint | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      loadCourses();
    }
  }, [searchTerm]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      // Try to initialize tables first
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

  const handleSearch = async () => {
    try {
      const searchResults = await searchCoursePoints(searchTerm);
      setCourses(searchResults);
    } catch (error) {
      console.error("Error searching courses:", error);
      setError("فشل في البحث عن التمارين");
    }
  };

  const handleAddCourse = async () => {
    if (!formData.name.trim()) {
      setError("اسم التمرين مطلوب");
      return;
    }

    try {
      setIsSaving(true);
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

    try {
      setIsSaving(true);
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

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل التمارين...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadCourses} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الكورسات</h1>
                <p className="text-gray-600">إدارة مكتبة التمارين والكورسات</p>
              </div>
            </div>
            <Dialog
              open={addDialogOpen}
              onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة تمرين جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة تمرين جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">اسم التمرين *</Label>
                    <Input
                      id="add-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="مثال: بنش برس، سكوات..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-description">الوصف (اختياري)</Label>
                    <Textarea
                      id="add-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="وصف مختصر للتمرين..."
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleAddCourse}
                      disabled={isSaving}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isSaving ? "جاري الحفظ..." : "إضافة"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث عن تمرين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-white border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              قائمة التمارين ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {courses.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد تمارين"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول تمرين
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم التمرين</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {course.description || "لا ي��جد وصف"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(course.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(course)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(course)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

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
            <DialogTitle>تعديل التمرين</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم التمرين *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="اسم التمرين"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف (اختياري)</Label>
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
                rows={3}
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditCourse}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? "جاري التحديث..." : "تحديث"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف التمرين "{courseToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-red-500 hover:bg-red-600"
              disabled={isSaving}
            >
              {isSaving ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
