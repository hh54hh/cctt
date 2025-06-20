import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Dumbbell } from "lucide-react";
import { syncService } from "@/lib/sync";
import type { CoursePoint } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";

export default function Courses() {
  const [coursePoints, setCoursePoints] = useState<CoursePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CoursePoint | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCoursePoints = async () => {
    try {
      const data = await syncService.getRecords("course_points");
      setCoursePoints(data || []);
    } catch (error) {
      toast.error("خطأ في جلب بيانات الكورسات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم التمرين");
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        await syncService.updateRecord("course_points", editingCourse.id, {
          ...editingCourse,
          name: formData.name,
          description: formData.description,
        });
        toast.success("تم تحديث التمرين بنجاح");
      } else {
        // Create new course
        await syncService.createRecord("course_points", {
          name: formData.name,
          description: formData.description,
        });
        toast.success("تم إضافة التمرين بنجاح");
      }

      fetchCoursePoints();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("خطأ في حفظ البيانات");
    }
  };

  const handleEdit = (course: CoursePoint) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التمرين؟")) return;

    try {
      await syncService.deleteRecord("course_points", courseId);
      toast.success("تم حذف التمرين بنجاح");
      fetchCoursePoints();
    } catch (error) {
      toast.error("خطأ في حذف التمرين");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCourse(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  useEffect(() => {
    fetchCoursePoints();
  }, []);

  const filteredCoursePoints = coursePoints.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">الكورسات</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الكورسات</h1>
          <p className="text-gray-600">
            إدارة مكتبة ��لتمارين والكورسات التدريبية
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600">
              <Plus className="w-4 h-4 ml-2" />
              إضافة تمرين جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "تعديل التمرين" : "إضافة تمرين جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم التمرين *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: بنج أمامي"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">وصف التمرين (اختياري)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="وصف مختصر للتمرين..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCourse ? "تحديث" : "إضافة"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="البحث في التمارين..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            مكتبة التمارين
          </CardTitle>
          <CardDescription>
            {filteredCoursePoints.length} تمرين متاح
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCoursePoints.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد تمارين
              </h3>
              <p className="text-gray-600 mb-4">
                ابدأ بإضافة أول تمرين لمكتبتك
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                إضافة تمرين جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم التمرين</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoursePoints.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>
                      {course.description || (
                        <span className="text-gray-400">لا يوجد وصف</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(course.created_at), "dd MMMM yyyy", {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* نظام التشخيص */}
      <DatabaseDiagnostics />
    </div>
  );
}
