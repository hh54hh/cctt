import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  GraduationCap,
  Plus,
  Trash2,
  Search,
  Save,
  Users,
  Calendar,
  X,
} from "lucide-react";
import { Course } from "@/lib/types";
import {
  getCourses,
  saveCourse,
  deleteCourse,
  getMembers,
} from "@/lib/storage-new";

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enrolledCounts, setEnrolledCounts] = useState<Record<string, number>>(
    {},
  );

  // Add new course form state
  const [newCourseName, setNewCourseName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const [coursesData, membersData] = await Promise.all([
        getCourses(),
        getMembers(),
      ]);

      // Ensure data is valid arrays
      const validCourses = Array.isArray(coursesData) ? coursesData : [];
      const validMembers = Array.isArray(membersData) ? membersData : [];

      setCourses(validCourses);

      // Calculate enrolled counts
      const counts: Record<string, number> = {};
      validCourses.forEach((course) => {
        if (course && course.id) {
          counts[course.id] = validMembers.filter(
            (member) =>
              member &&
              Array.isArray(member.courses) &&
              member.courses.includes(course.id),
          ).length;
        }
      });
      setEnrolledCounts(counts);
    } catch (error) {
      console.error("Error loading courses:", error);
      setCourses([]);
      setEnrolledCounts({});
    }
  };

  const filteredCourses = Array.isArray(courses)
    ? courses.filter((course) =>
        course?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCourseName.trim()) {
      setError("يجب إدخال اسم الكورس");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const courseData: Course = {
        id: Date.now().toString(),
        name: newCourseName.trim(),
        createdAt: new Date(),
      };

      await saveCourse(courseData);
      await loadCourses();
      setNewCourseName("");
    } catch (error) {
      console.error("Error adding course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (courseToDelete) {
      try {
        await deleteCourse(courseToDelete.id);
        await loadCourses();
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الكورسات</h1>
          <p className="text-gray-600">إضافة وإدارة الكورسات التدريبية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الكورسات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Course Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-orange-600" />
              إضافة كورس جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseName" className="text-right block">
                  ��سم الكورس *
                </Label>
                <Input
                  id="courseName"
                  value={newCourseName}
                  onChange={(e) => {
                    setNewCourseName(e.target.value);
                    setError("");
                  }}
                  placeholder="مثال: تمارين كمال الأجسام"
                  className="text-right"
                />
                {error && (
                  <p className="text-sm text-red-600 text-right">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    إضافة الكورس
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الكورسات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </CardContent>
          </Card>

          {/* Courses List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الكورسات</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8">
                  {courses.length === 0 ? (
                    <div className="space-y-4">
                      <GraduationCap className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          لا توجد كورسات حتى الآن
                        </h3>
                        <p className="text-gray-600 mt-1">
                          ابدأ بإضافة أول كورس تد��يبي
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Search className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          لم يتم العثور على نتائج
                        </h3>
                        <p className="text-gray-600 mt-1">
                          جرب تغيير كلمات البحث
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCourses.map((course) => {
                    const enrolledCount = enrolledCounts[course.id] || 0;

                    return (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {course.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                أضيف في{" "}
                                {new Date(course.createdAt).toLocaleDateString(
                                  "en-GB",
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  enrolledCount > 0 ? "default" : "secondary"
                                }
                                className={
                                  enrolledCount > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {enrolledCount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCourse(course)}
                          className="text-red-600 border-red-200 hover:bg-red-50 mr-3"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف الكورس
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف الكورس "{courseToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
