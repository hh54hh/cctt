import React, { useState, useEffect } from "react";
import {
  Utensils,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
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

interface DietItem {
  id: string;
  name: string;
  description: string;
  category: string;
  calories?: number;
  protein?: number;
  created_at: string;
}

const dietCategories = [
  "بروتينات",
  "كربوهيدرات",
  "دهون صحية",
  "فيتامينات",
  "معادن",
  "مكملات غذائية",
  "خضروات",
  "فواكه",
  "حبوب",
  "منتجات ألبان",
];

// Initial diet items
const initialDietItems: DietItem[] = [
  {
    id: "1",
    name: "البروتين المصل",
    description: "مكمل بروتيني عالي الجودة لبناء العضلات",
    category: "مكملات غذائية",
    calories: 120,
    protein: 25,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "الأرز البني",
    description: "مصدر ممتاز للكربوهيدرات المعقدة",
    category: "كربوهيدرات",
    calories: 350,
    protein: 7,
    created_at: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    name: "السلمون",
    description: "مصدر غني بالبروتين والأوميغا 3",
    category: "بروتينات",
    calories: 200,
    protein: 25,
    created_at: "2024-01-17T09:00:00Z",
  },
  {
    id: "4",
    name: "السبانخ",
    description: "خضروات ورقية غنية بالحديد والفيتامينات",
    category: "خضروات",
    calories: 20,
    protein: 3,
    created_at: "2024-01-18T16:00:00Z",
  },
  {
    id: "5",
    name: "الموز",
    description: "فاكهة غنية بالبوتاسيوم والطاقة السريعة",
    category: "فواكه",
    calories: 95,
    protein: 1,
    created_at: "2024-01-19T08:00:00Z",
  },
];

export default function Diet() {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DietItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: dietCategories[0],
    calories: "",
    protein: "",
  });

  // Load data from IndexedDB
  useEffect(() => {
    const loadDietItems = async () => {
      try {
        const items = await db.dietItems.toArray();
        setDietItems(items);
      } catch (error) {
        console.error("Error loading diet items:", error);
        setDietItems(initialDietItems);
      }
    };

    loadDietItems();
  }, []);

  // Filter and search
  const filteredItems = dietItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reload diet items from database
  const reloadDietItems = async () => {
    try {
      const items = await db.dietItems.toArray();
      setDietItems(items);
    } catch (error) {
      console.error("Error reloading diet items:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم العنصر الغذائي");
      return;
    }

    // Check for duplicates
    const isDuplicate = dietItems.some(
      (item) =>
        item.name.toLowerCase() === formData.name.toLowerCase() &&
        item.id !== editingItem?.id,
    );

    if (isDuplicate) {
      toast.error("اسم العنصر الغذائي موجود بالفعل");
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        await updateRecord(SUPABASE_TABLES.dietItems, editingItem.id, formData);
      } else {
        // Add new item
        await createRecord(SUPABASE_TABLES.dietItems, formData);
      }

      await reloadDietItems();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving diet item:", error);
      toast.error("حدث خطأ أثناء حفظ العنصر الغذائي");
    }
  };

  // Handle edit
  const handleEdit = (item: DietItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      calories: item.calories?.toString() || "",
      protein: item.protein?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العنصر الغذائي؟")) {
      try {
        await deleteRecord(SUPABASE_TABLES.dietItems, id);
        await reloadDietItems();
      } catch (error) {
        console.error("Error deleting diet item:", error);
        toast.error("حدث خطأ أثناء حذف العنصر الغذائي");
      }
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      category: dietCategories[0],
      calories: "",
      protein: "",
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

  // Get category stats
  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {};
    dietItems.forEach((item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأنظمة الغذائية</h1>
          <p className="text-muted-foreground">
            إدارة العناصر الغذائية المستخدمة في الخطط الغذائية
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gym-button" onClick={() => setEditingItem(null)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عنصر غذائي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "تعديل العنصر الغذائي" : "إضافة عنصر غذائي جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم العنصر الغذائي *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="أدخل اسم العنصر"
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
                  {dietCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="calories">السعرات (لكل 100غ)</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.1"
                    value={formData.calories}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        calories: e.target.value,
                      }))
                    }
                    placeholder="السعرات"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">البروتين (غ)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        protein: e.target.value,
                      }))
                    }
                    placeholder="البروتين"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف العنصر</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="وصف مفصل للعنصر الغذائي..."
                  className="text-right"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 gym-button">
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? "تحديث" : "إضافة"}
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
              إجمالي العناصر
            </CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dietItems.length}</div>
          </CardContent>
        </Card>
        {Object.entries(categoryStats)
          .slice(0, 3)
          .map(([category, count]) => (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {category}
                </CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن عنصر غذائي..."
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
          {dietCategories.map((category) => (
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
                  <TableHead className="text-right">اسم العنصر</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">السعرات</TableHead>
                  <TableHead className="text-right">البروتين</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">العمليات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedCategory !== "الكل"
                          ? "لم يتم العثور على عناصر مطابقة"
                          : "لا توجد عناصر غذائية مضافة"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-right">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.calories ? `${item.calories} kcal` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.protein ? `${item.protein}g` : "-"}
                      </TableCell>
                      <TableCell className="text-right max-w-xs">
                        <div className="truncate" title={item.description}>
                          {item.description || "لا يوجد وصف"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
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
