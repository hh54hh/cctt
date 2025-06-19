import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Apple,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  ChefHat,
} from "lucide-react";
import {
  getDietItems,
  saveDietItem,
  updateDietItem,
  deleteDietItem,
  searchDietItems,
} from "@/lib/database-offline";
import { DietItem } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function DietPlans() {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [editingItem, setEditingItem] = useState<DietItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DietItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDietItems();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      loadDietItems();
    }
  }, [searchTerm]);

  const loadDietItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDietItems();
      setDietItems(data);
    } catch (error) {
      console.error("Error loading diet items:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في تحميل البيانات",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setError(null);
      const data = await searchDietItems(searchTerm);
      setDietItems(data);
    } catch (error) {
      console.error("Error searching diet items:", error);
      setError(error instanceof Error ? error.message : "خطأ في البحث");
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "اسم العنصر الغذائي مطلوب";
    } else if (formData.name.trim().length < 2) {
      errors.name = "اسم العنصر الغذائي يجب أن يكون على الأقل حرفين";
    }

    // Check for duplicate names (excluding current item when editing)
    const isDuplicate = dietItems.some(
      (item) =>
        item.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        item.id !== editingItem?.id,
    );

    if (isDuplicate) {
      errors.name = "اسم العنصر الغذائي موجود بالفعل";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setFormErrors({});
    setEditingItem(null);
  };

  const handleAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleEdit = (item: DietItem) => {
    setFormData({
      name: item.name,
      description: item.description || "",
    });
    setEditingItem(item);
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = (item: DietItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      await saveDietItem(formData.name.trim(), formData.description.trim());

      setSuccess("تم إضافة العنصر الغذائي بنجاح");
      setAddModalOpen(false);
      resetForm();
      await loadDietItems();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving diet item:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في حفظ العنصر الغذائي",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingItem) return;

    try {
      setIsSaving(true);
      setError(null);

      await updateDietItem(
        editingItem.id,
        formData.name.trim(),
        formData.description.trim(),
      );

      setSuccess("تم تحديث العنصر الغذائي بنجاح");
      setEditModalOpen(false);
      resetForm();
      await loadDietItems();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating diet item:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في تحديث العنصر الغذائي",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setError(null);
      await deleteDietItem(itemToDelete.id);
      setSuccess("تم حذف العنصر الغذائي بنجاح");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await loadDietItems();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting diet item:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في حذف العنصر الغذائي",
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "تاريخ غير صحيح";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            جاري تحميل الأنظمة الغذائية...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
              <Apple className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                إدارة الأنظمة الغذائية
              </h1>
              <p className="text-gray-600">
                إضافة وتحرير العناصر الغذائية المتاحة
              </p>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <Plus className="h-5 w-5 ml-2" />
            إضافة عنصر غذائي جديد
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="البحث في الأنظمة الغذائية (الاسم أو الوصف)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Diet Items Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                قائمة العناصر الغذائية ({dietItems.length})
              </CardTitle>
              {searchTerm && (
                <Badge variant="secondary">
                  نتائج البحث: {dietItems.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dietItems.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد عناصر غذائية"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm
                    ? "جرب البحث بكلمات أخرى"
                    : "ابدأ بإضافة أول عنصر غذائي"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleAdd} className="bg-green-500">
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة عنصر غذائي جديد
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">
                      اسم العنصر الغذائي
                    </TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dietItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs">
                        {item.description ? (
                          <span>{item.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">
                            لا يوجد وصف
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(item.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
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

      {/* Add Diet Item Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة عنصر غذائي جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات العنصر الغذائي الجديد الذي تريد إضافته
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">اسم العنصر الغذائي *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثلاً: بيض مسلوق، شوفان، تمر..."
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="add-description">الوصف (اختياري)</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="وصف مختصر للعنصر الغذائي وفوائده..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                {isSaving ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Diet Item Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل العنصر الغذائي</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات العنصر الغذائي "{editingItem?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم العنصر الغذائي *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="اسم العنصر الغذائي"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-description">الوصف (اختياري)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="وصف مختصر للعنصر الغذائي وفوائده..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                {isSaving ? "جاري التحديث..." : "تحديث"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف العنصر الغذائي "{itemToDelete?.name}"؟
              <br />
              <span className="text-red-600 font-medium">
                هذا الإجراء لا يمكن التراجع عنه.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
