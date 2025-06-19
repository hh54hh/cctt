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
  Apple,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { DietItem } from "@/lib/gym-types";
import {
  getDietItems,
  createDietItem,
  updateDietItem,
  deleteDietItem,
  searchDietItems,
  initializeTables,
} from "@/lib/gym-database";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";

export default function DietPlans() {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<DietItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DietItem | null>(null);
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
    loadDietItems();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      loadDietItems();
    }
  }, [searchTerm]);

  const loadDietItems = async () => {
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

      const itemsData = await getDietItems();
      setDietItems(itemsData);
    } catch (error) {
      console.error("Error loading diet items:", error);
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل العناصر الغذائية");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const searchResults = await searchDietItems(searchTerm);
      setDietItems(searchResults);
    } catch (error) {
      console.error("Error searching diet items:", error);
      setError("فشل في البحث عن العناصر الغذائية");
    }
  };

  const handleAddItem = async () => {
    if (!formData.name.trim()) {
      setError("اسم العنصر الغذائي مطلوب");
      return;
    }

    try {
      setIsSaving(true);
      await createDietItem(formData.name.trim(), formData.description.trim());
      await loadDietItems();
      setAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      setSuccess("تم إضافة العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding diet item:", error);
      setError("فشل في إضافة العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = async () => {
    if (!itemToEdit || !formData.name.trim()) {
      setError("اسم العنصر الغذائي مطلوب");
      return;
    }

    try {
      setIsSaving(true);
      await updateDietItem(
        itemToEdit.id,
        formData.name.trim(),
        formData.description.trim(),
      );
      await loadDietItems();
      setEditDialogOpen(false);
      setItemToEdit(null);
      setFormData({ name: "", description: "" });
      setSuccess("تم تحديث العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating diet item:", error);
      setError("فشل في تحديث العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsSaving(true);
      await deleteDietItem(itemToDelete.id);
      await loadDietItems();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setSuccess("تم حذف العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting diet item:", error);
      setError("فشل في حذف العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (item: DietItem) => {
    setItemToEdit(item);
    setFormData({
      name: item.name,
      description: item.description || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item: DietItem) => {
    setItemToDelete(item);
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل العناصر الغذائية...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadDietItems} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-full">
                <Apple className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  الأنظمة الغذائية
                </h1>
                <p className="text-gray-600">
                  إدارة مكتبة العناصر الغذائية والأطعمة
                </p>
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
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة عنصر غذائي
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>��ضافة عنصر غذائي جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">اسم العنصر الغذائي *</Label>
                    <Input
                      id="add-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="مثال: بيض مسلوق، شوفان، دجاج..."
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
                      placeholder="وصف مختصر للعنصر الغذائي..."
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
                      onClick={handleAddItem}
                      disabled={isSaving}
                      className="bg-green-500 hover:bg-green-600"
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
                placeholder="البحث عن عنصر غذائي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-white border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Diet Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              قائمة العناصر الغذائية ({dietItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dietItems.length === 0 ? (
              <div className="text-center py-16">
                <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد عناصر غذائية"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أ��ل عنصر غذائي
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم العنصر</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dietItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {item.description || "لا يوجد وصف"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(item)}
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
            setItemToEdit(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل العنصر الغذائي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم العنصر الغذائي *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="اسم العنصر الغذائي"
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
                placeholder="وصف العنصر الغذائي..."
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
                onClick={handleEditItem}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600"
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
              هل أنت متأكد من حذف العنصر الغذائي "{itemToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
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
