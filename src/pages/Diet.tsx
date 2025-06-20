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
import { Plus, Edit, Trash2, Search, Apple } from "lucide-react";
import { syncService } from "@/lib/sync";
import type { DietItem } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";

export default function Diet() {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DietItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchDietItems = async () => {
    try {
      const data = await syncService.getRecords("diet_items");
      setDietItems(data || []);
    } catch (error) {
      toast.error("خطأ في جلب بيانات الأنظمة الغذائية");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم العنصر الغذائي");
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        await syncService.updateRecord("diet_items", editingItem.id, {
          ...editingItem,
          name: formData.name,
          description: formData.description,
        });
        toast.success("تم تحدي�� العنصر الغذائي بنجاح");
      } else {
        // Create new item
        await syncService.createRecord("diet_items", {
          name: formData.name,
          description: formData.description,
        });
        toast.success("تم إضافة العنصر الغذائي بنجاح");
      }

      fetchDietItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("خطأ في حفظ البيانات");
    }
  };

  const handleEdit = (item: DietItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر الغذائي؟")) return;

    try {
      await syncService.deleteRecord("diet_items", itemId);
      toast.success("تم حذف العنصر الغذائي بنجاح");
      fetchDietItems();
    } catch (error) {
      toast.error("خطأ في حذف العنصر الغذائي");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingItem(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  useEffect(() => {
    fetchDietItems();
  }, []);

  const filteredDietItems = dietItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">الأنظمة الغذائية</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">الأنظمة الغذائية</h1>
          <p className="text-gray-600">إدارة مكتبة العناصر والوجبات الغذائية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 ml-2" />
              إضافة عنصر غذائي
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "تعديل العنصر الغذائي" : "إضافة عنصر غذائي جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم العنصر الغذائي *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: بيض مسلوق"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">وصف العنصر (اختياري)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="مثال: بروتين عالي، 2 حبة..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingItem ? "تحديث" : "إضافة"}
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
          placeholder="البحث في العناصر الغذائية..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5" />
            مكتبة العناصر الغذائية
          </CardTitle>
          <CardDescription>
            {filteredDietItems.length} عنصر غذائي متاح
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDietItems.length === 0 ? (
            <div className="text-center py-8">
              <Apple className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد عناصر غذائية
              </h3>
              <p className="text-gray-600 mb-4">
                ابدأ بإضافة أول عنصر غذائي لمكتبتك
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                إضافة عنصر غذائي جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العنصر</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDietItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.description || (
                        <span className="text-gray-400">لا يوجد وصف</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd MMMM yyyy", {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
