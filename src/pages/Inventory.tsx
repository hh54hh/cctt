import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Package,
  Plus,
  Trash2,
  Search,
  Save,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Archive,
  Printer,
  Edit,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import {
  Product,
  SaleWithProduct,
  NewProductData,
  NewSaleData,
} from "@/lib/inventory-types";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSales,
  createSale,
  searchProducts,
  searchSales,
  getLowStockProducts,
} from "@/lib/inventory-database";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleWithProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [addSaleDialogOpen, setAddSaleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<NewProductData>({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    category: "",
    min_stock_level: 5,
  });

  const [saleForm, setSaleForm] = useState<NewSaleData>({
    product_id: "",
    buyer_name: "",
    buyer_phone: "",
    quantity_sold: 0,
    unit_price: 0,
    payment_method: "cash",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales(),
      ]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error("Error loading data:", error);

      // Check if the error indicates missing tables
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل بيانات المخزن");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    const errors: Record<string, string> = {};

    if (!productForm.name.trim()) {
      errors.name = "اسم المنتج مطلوب";
    }
    if (productForm.price <= 0) {
      errors.price = "السعر يجب أن يكون أكبر من صفر";
    }
    if (productForm.quantity < 0) {
      errors.quantity = "الكمية لا يمكن أن تكون سالبة";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createProduct(productForm);
      await loadData();
      setAddProductDialogOpen(false);
      setProductForm({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        category: "",
        min_stock_level: 5,
      });
      setFormErrors({});
      setSuccess("تم إضافة المنتج بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding product:", error);
      setError("فشل في إضافة المنتج");
    }
  };

  const handleAddSale = async () => {
    const errors: Record<string, string> = {};

    if (!saleForm.buyer_name.trim()) {
      errors.buyer_name = "اسم المشتري مطلوب";
    }
    if (!saleForm.product_id) {
      errors.product_id = "يجب اختيار المنتج";
    }
    if (saleForm.quantity_sold <= 0) {
      errors.quantity_sold = "الكمية يجب أن تكون أكبر من صفر";
    }

    // Check stock availability
    const product = products.find((p) => p.id === saleForm.product_id);
    if (product && saleForm.quantity_sold > product.quantity) {
      errors.quantity_sold = `الكمية المتوفرة: ${product.quantity} فقط`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createSale({
        ...saleForm,
        unit_price: product?.price || 0,
      });
      await loadData();
      setAddSaleDialogOpen(false);
      setSaleForm({
        product_id: "",
        buyer_name: "",
        buyer_phone: "",
        quantity_sold: 0,
        unit_price: 0,
        payment_method: "cash",
        notes: "",
      });
      setFormErrors({});
      setSuccess("تم تسجيل المبيعة بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding sale:", error);
      setError("فشل في تسجيل المبيعة");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      await loadData();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setSuccess("تم حذف المنتج بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("فشل في حذف المنتج");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSales = sales.filter(
    (sale) =>
      sale.buyer_name.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
      sale.product_name.toLowerCase().includes(salesSearchTerm.toLowerCase()),
  );

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ريال`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل بيانات المخزن...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  المخزن والمبيعات
                </h1>
                <p className="text-gray-600">إدارة المنتجات والمبيعات</p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إدارة المنتجات</CardTitle>
                  <Button
                    onClick={() => setAddProductDialogOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منتج
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد منتجات</p>
                    <Button
                      onClick={() => setAddProductDialogOpen(true)}
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة أول منتج
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المنتج</TableHead>
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-gray-500">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category || "غير محدد"}
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            {product.quantity <=
                            (product.min_stock_level || 5) ? (
                              <Badge variant="destructive">مخزون منخفض</Badge>
                            ) : (
                              <Badge variant="secondary">متوفر</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setDeleteDialogOpen(true);
                                }}
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
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إدارة المبيعات</CardTitle>
                  <Button
                    onClick={() => setAddSaleDialogOpen(true)}
                    className="bg-green-500 hover:bg-green-600"
                    disabled={products.length === 0}
                  >
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    تسجيل مبيعة
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في المبيعات..."
                    value={salesSearchTerm}
                    onChange={(e) => setSalesSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد مبيعات</p>
                    {products.length > 0 && (
                      <Button
                        onClick={() => setAddSaleDialogOpen(true)}
                        className="mt-4 bg-green-500 hover:bg-green-600"
                      >
                        <ShoppingCart className="w-4 h-4 ml-2" />
                        تسجيل أول مبيعة
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">المشتري</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.product_name}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{sale.buyer_name}</p>
                              {sale.buyer_phone && (
                                <p className="text-sm text-gray-500">
                                  {sale.buyer_phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{sale.quantity_sold}</TableCell>
                          <TableCell>
                            {formatCurrency(sale.unit_price)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(sale.total_price)}
                          </TableCell>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog
        open={addProductDialogOpen}
        onOpenChange={setAddProductDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="أدخل اسم المنتج"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف المنتج (اختياري)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price || ""}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm">{formErrors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input
                  type="number"
                  value={productForm.quantity || ""}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
                {formErrors.quantity && (
                  <p className="text-red-500 text-sm">{formErrors.quantity}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>الفئة</Label>
              <Input
                value={productForm.category}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="مثال: مكملات، مشروبات، معدات"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddProductDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddProduct}
              className="bg-orange-500 hover:bg-orange-600"
            >
              إضافة المنتج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sale Dialog */}
      <Dialog open={addSaleDialogOpen} onOpenChange={setAddSaleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل مبيعة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المشتري *</Label>
              <Input
                value={saleForm.buyer_name}
                onChange={(e) =>
                  setSaleForm((prev) => ({
                    ...prev,
                    buyer_name: e.target.value,
                  }))
                }
                placeholder="أدخل اسم المشتري"
              />
              {formErrors.buyer_name && (
                <p className="text-red-500 text-sm">{formErrors.buyer_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={saleForm.buyer_phone}
                onChange={(e) =>
                  setSaleForm((prev) => ({
                    ...prev,
                    buyer_phone: e.target.value,
                  }))
                }
                placeholder="رقم الهاتف (اختياري)"
              />
            </div>

            <div className="space-y-2">
              <Label>المنتج *</Label>
              <Select
                value={saleForm.product_id}
                onValueChange={(value) =>
                  setSaleForm((prev) => ({ ...prev, product_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.quantity} متوفر -{" "}
                      {formatCurrency(product.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.product_id && (
                <p className="text-red-500 text-sm">{formErrors.product_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الكمية المباعة *</Label>
              <Input
                type="number"
                value={saleForm.quantity_sold || ""}
                onChange={(e) =>
                  setSaleForm((prev) => ({
                    ...prev,
                    quantity_sold: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
              {formErrors.quantity_sold && (
                <p className="text-red-500 text-sm">
                  {formErrors.quantity_sold}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={saleForm.payment_method}
                onValueChange={(value: "cash" | "card" | "transfer") =>
                  setSaleForm((prev) => ({ ...prev, payment_method: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddSaleDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddSale}
              className="bg-green-500 hover:bg-green-600"
            >
              تسجيل المبيعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المنتج "{productToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
