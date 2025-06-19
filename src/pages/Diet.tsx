import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Layout from "@/components/Layout";
import { db, DietItem } from "@/lib/database";

const Diet = () => {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DietItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadDietItems();
  }, []);

  const loadDietItems = () => {
    setDietItems(db.getDietItems());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await db.updateDietItem(editingItem.id, formData);
      } else {
        await db.createDietItem(formData);
      }

      loadDietItems();
      resetForm();
    } catch (error) {
      console.error("Error saving diet item:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: DietItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العنصر الغذائي؟")) {
      try {
        await db.deleteDietItem(id);
        loadDietItems();
      } catch (error) {
        console.error("Error deleting diet item:", error);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              مكتبة الأنظمة الغذائية
            </h1>
            <p className="text-gray-600 mt-1">
              إدارة العناصر والأنظمة الغذائية ({dietItems.length} عنصر)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gym-button">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عنصر غذائي
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "تعديل العنصر الغذائي" : "إضافة عنصر غذائي"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم العنصر
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="مثال: دجاج مشوي"
                    className="gym-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التفاصيل
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="مثال: 150 جرام - وجبة الغداء"
                    className="gym-input"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="gym-button flex-1">
                    {editingItem ? "تحديث" : "إضافة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Diet Items Table */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-green-600" />
              جميع العناصر الغذائية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dietItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم العنصر</TableHead>
                    <TableHead className="text-right">التفاصيل</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dietItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(item.created_at).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(item.id)}
                            variant="outline"
                            size="sm"
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
            ) : (
              <div className="text-center py-16">
                <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  لا توجد عناصر غذائية
                </h3>
                <p className="text-gray-600 mb-4">
                  ابدأ بإضافة أول عنصر غذائي في المكتبة
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gym-button">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة أول عنصر
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Diet;
