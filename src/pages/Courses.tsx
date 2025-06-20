import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createRecord,
  updateRecord,
  deleteRecord,
  SUPABASE_TABLES,
} from "@/lib/syncService";
import { db } from "@/lib/database";
import { toast } from "sonner";

interface CoursePoint {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

const categories = [
  "تمارين القوة",
  "تمارين الكارديو",
  "تمارين المرونة",
  "تمارين التوازن",
  "تمارين التحمل",
  "تمارين إعادة التأهيل",
];

// Initial course points
const initialCoursePoints: CoursePoint[] = [
  {
    id: "1",
    name: "تمرين الضغط",
    description: "تمرين أساسي لتقوية عضلات الصدر والذراعين",
    category: "تم��رين القوة",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "تمرين العقلة",
    description: "تمرين لتقوية عضلات الظهر والذراعين",
    category: "تمارين القوة",
    created_at: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    name: "الجري",
    description: "تمرين كارديو لتحسين القدرة على التحمل",
    category: "تمارين الكارديو",
    created_at: "2024-01-17T09:00:00Z",
  },
  {
    id: "4",
    name: "اليوغا",
    description: "تمارين للمرونة والاسترخاء",
    category: "تمارين المرونة",
    created_at: "2024-01-18T16:00:00Z",
  },
];

export default function Courses() {
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CoursePoint | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: categories[0],
  });

  // Load data from localStorage
  useEffect(() => {
    const loadCoursePoints = async () => {
      try {
        const courses = await db.coursePoints.toArray();
        setCoursePoints(courses);
      } catch (error) {
        console.error("Error loading course points:", error);
        setCoursePoints(initialCoursePoints);
      }
    };

    loadCoursePoints();
  }, []);

  // Filter and search
  const filteredCourses = coursePoints.filter((course) => {
    const matchesSearch = course.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "الكل" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reload courses from database
  const reloadCourses = async () => {
    try {
      const courses = await db.coursePoints.toArray();
      setCoursePoints(courses);
    } catch (error) {
      console.error("Error reloading courses:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم التمرين");
      return;
    }

    // Check for duplicates
    const isDuplicate = coursePoints.some(
      (course) =>
        course.name.toLowerCase() === formData.name.toLowerCase() &&
        course.id !== editingCourse?.id,
    );

    if (isDuplicate) {
      toast.error("اسم التمرين موجود بالفعل");
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        await updateRecord(
          SUPABASE_TABLES.coursePoints,
          editingCourse.id,
          formData,
        );
      } else {
        // Add new course
        await createRecord(SUPABASE_TABLES.coursePoints, formData);
      }

      await reloadCourses();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("حدث خطأ أثناء حفظ التمرين");
    }
  };

  // Handle edit
  const handleEdit = (course: CoursePoint) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      category: course.category,
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التمرين؟")) {
      try {
        await deleteRecord(SUPABASE_TABLES.coursePoints, id);
        await reloadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        toast.error("حدث خطأ أثناء حذف التمرين");
      }
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
    setFormData({
      name: "",
      description: "",
      category: categories[0],
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الكورسات</h1>
          <p className="text-muted-foreground">
            إدارة التمارين المستخدمة في خطط التدريب
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gym-button"
              onClick={() => setEditingCourse(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة تمرين جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "تعديل التمرين" : "إضافة تمرين جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم التمرين *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="أدخل اسم التمرين"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded-md text-right"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف التمرين</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="وصف مفصل للتمرين..."
                  className="text-right"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 gym-button">
                  <Save className="w-4 h-4 mr-2" />
                  {editingCourse ? "تحديث" : "إضافة"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  <X className="w-4 h-4 mr-2" />
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي التمارين
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursePoints.length}</div>
          </CardContent>
        </Card>
        {categories.slice(0, 3).map((category) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursePoints.filter((c) => c.category === category).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن تمرين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48 p-2 border rounded-md text-right"
        >
          <option value="الكل">جميع الفئات</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="gym-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم التمرين</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">العمليات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedCategory !== "الكل"
                          ? "لم يتم العثور على تمارين مطابقة"
                          : "لا توجد تمارين مضافة"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium text-right">
                        {course.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{course.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right max-w-xs">
                        <div className="truncate" title={course.description}>
                          {course.description || "لا يوجد وصف"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(course.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(course)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(course.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
