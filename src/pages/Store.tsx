import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
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

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  description: string;
  minQuantity: number;
  created_at: string;
}

const productTypes = [
  "مكملات غذائية",
  "أجهزة رياضية",
  "ملابس رياضية",
  "إكسسوارات",
  "مشروبات صحية",
  "معدات التدريب",
  "منتجات العناية",
  "أخرى",
];

// Initial products
const initialProducts: Product[] = [
  {
    id: "1",
    name: "بروتين واي ذهبي",
    type: "مكملات غذائية",
    price: 150,
    quantity: 25,
    minQuantity: 5,
    description: "مكمل بروتيني عالي الجودة لبناء العضلات",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "زجاجة مياه رياضية",
    type: "إكسسوارات",
    price: 15,
    quantity: 50,
    minQuantity: 10,
    description: "زجاجة مياه بسعة 750 مل",
    created_at: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    name: "قفازات رياضية",
    type: "إكسسوارات",
    price: 25,
    quantity: 8,
    minQuantity: 10,
    description: "قفازات للحماية أثناء التمرين",
    created_at: "2024-01-17T09:00:00Z",
  },
  {
    id: "4",
    name: "مشروب طاقة طبيعي",
    type: "مشروبات صحية",
    price: 8,
    quantity: 100,
    minQuantity: 20,
    description: "مشروب طاقة طبيعي خالي من السكر",
    created_at: "2024-01-18T16:00:00Z",
  },
];

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("الكل");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: productTypes[0],
    price: "",
    quantity: "",
    minQuantity: "",
    description: "",
  });

  // Load data from IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await db.products.toArray();
        if (productsData.length > 0) {
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts(initialProducts);
      }
    };

    loadProducts();
  }, []);

  // Filter and search
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "الكل" || product.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Reload products from database
  const reloadProducts = async () => {
    try {
      const productsData = await db.products.toArray();
      setProducts(productsData);
    } catch (error) {
      console.error("Error reloading products:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.quantity) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Check for duplicates
    const isDuplicate = products.some(
      (product) =>
        product.name.toLowerCase() === formData.name.toLowerCase() &&
        product.id !== editingProduct?.id,
    );

    if (isDuplicate) {
      toast.error("اسم المنتج موجود بالفعل");
      return;
    }

    try {
      const productData = {
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        min_quantity: formData.minQuantity ? parseInt(formData.minQuantity) : 5,
        description: formData.description,
      };

      if (editingProduct) {
        // Update existing product
        await updateRecord(
          SUPABASE_TABLES.products,
          editingProduct.id,
          productData,
        );
      } else {
        // Add new product
        await createRecord(SUPABASE_TABLES.products, productData);
      }

      await reloadProducts();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("حدث خطأ أثناء حفظ المنتج");
    }
  };

  // Handle edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minQuantity: product.minQuantity.toString(),
      description: product.description,
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteRecord(SUPABASE_TABLES.products, id);
        await reloadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("حدث خطأ أثناء حذف المن��ج");
      }
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      type: productTypes[0],
      price: "",
      quantity: "",
      minQuantity: "",
      description: "",
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

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0,
  );
  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.minQuantity,
  ).length;
  const outOfStockProducts = products.filter(
    (product) => product.quantity === 0,
  ).length;

  // Get low stock indicator
  const getLowStockBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive">نفدت الكمية</Badge>;
    }
    if (product.quantity <= product.minQuantity) {
      return <Badge variant="secondary">كمية قليلة</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المخزن</h1>
          <p className="text-muted-foreground">
            إدارة المنتجات والمخزون في الصالة
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gym-button"
              onClick={() => setEditingProduct(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنتج *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="أدخل اسم المنتج"
                  className="text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="type">نوع المنتج</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md text-right"
                  >
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ريال) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="السعر"
                    className="text-right"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية المتوفرة *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="الكمية"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">الحد الأدنى</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minQuantity: e.target.value,
                      }))
                    }
                    placeholder="الحد الأدنى"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المنتج</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="وصف مفصل للمنتج..."
                  className="text-right"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 gym-button">
                  <Save className="w-4 h-4 mr-2" />
                  {editingProduct ? "تحديث" : "إضافة"}
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
              إجمالي المنتجات
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزن</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue.toFixed(2)} ر.س
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">كمية قليلة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {lowStockProducts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نفدت الكمية</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {outOfStockProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full sm:w-48 p-2 border rounded-md text-right"
        >
          <option value="الكل">جميع الأنواع</option>
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type}
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
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">العمليات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedType !== "الكل"
                          ? "لم يتم العثور على منتجات مطابقة"
                          : "لا توجد منتجات مضافة"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-right">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{product.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {(product.price * product.quantity).toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="text-right">
                        {getLowStockBadge(product) || (
                          <Badge variant="secondary">متوفر</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(product.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
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
