import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
} from "lucide-react";
import {
  getProducts,
  getSales,
  saveProduct,
  updateProduct,
  deleteProduct,
  saveSale,
  deleteSale,
  searchProducts,
  searchSales,
} from "@/lib/database-offline";
import { Product, Sale, ProductForm, SaleForm } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Product modal state
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);

  // Sale modal state
  const [addSaleModalOpen, setAddSaleModalOpen] = useState(false);
  const [deleteSaleDialogOpen, setDeleteSaleDialogOpen] = useState(false);
  const [printConfirmDialogOpen, setPrintConfirmDialogOpen] = useState(false);
  const [saleForPrint, setSaleForPrint] = useState<Sale | null>(null);

  // Form state
  const [productFormData, setProductFormData] = useState<ProductForm>({
    name: "",
    quantity: "",
    price: "",
    description: "",
    category: "",
  });

  const [saleFormData, setSaleFormData] = useState<SaleForm>({
    buyer_name: "",
    product_id: "",
    quantity: "",
    notes: "",
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    "مكملات",
    "مشروبات",
    "أدوات",
    "ملابس",
    "إكسسوارات",
    "أخرى",
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleProductSearch();
    } else {
      loadProducts();
    }
  }, [searchTerm]);

  useEffect(() => {
    if (salesSearchTerm.trim()) {
      handleSalesSearch();
    } else {
      loadSales();
    }
  }, [salesSearchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([loadProducts(), loadSales()]);
    } catch (error) {
      console.error("Error loading data:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في تحميل البيانات",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const loadSales = async () => {
    const data = await getSales();
    setSales(data);
  };

  const handleProductSearch = async () => {
    try {
      setError(null);
      const data = await searchProducts(searchTerm);
      setProducts(data);
    } catch (error) {
      console.error("Error searching products:", error);
      setError(error instanceof Error ? error.message : "خطأ في البحث");
    }
  };

  const handleSalesSearch = async () => {
    try {
      setError(null);
      const data = await searchSales(salesSearchTerm);
      setSales(data);
    } catch (error) {
      console.error("Error searching sales:", error);
      setError(error instanceof Error ? error.message : "خطأ في البحث");
    }
  };

  const validateProductForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!productFormData.name.trim()) {
      errors.name = "اسم المنتج مطلوب";
    }

    if (!productFormData.quantity || isNaN(Number(productFormData.quantity))) {
      errors.quantity = "الكمية يجب أن تكون رقم صحيح";
    }

    if (!productFormData.price || isNaN(Number(productFormData.price))) {
      errors.price = "السعر يجب أن يكون رقم صحيح";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSaleForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!saleFormData.buyer_name.trim()) {
      errors.buyer_name = "اسم المشتري مطلوب";
    }

    if (!saleFormData.product_id) {
      errors.product_id = "يجب اختيار المنتج";
    }

    if (!saleFormData.quantity || isNaN(Number(saleFormData.quantity))) {
      errors.quantity = "الكمية يجب أن تكون رقم صحيح";
    }

    const selectedProduct = products.find(
      (p) => p.id === saleFormData.product_id,
    );
    if (
      selectedProduct &&
      Number(saleFormData.quantity) > selectedProduct.quantity
    ) {
      errors.quantity = "الكمية المطلوبة أكبر من المتاح";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      quantity: "",
      price: "",
      description: "",
      category: "",
    });
    setFormErrors({});
    setEditingProduct(null);
  };

  const resetSaleForm = () => {
    setSaleFormData({
      buyer_name: "",
      product_id: "",
      quantity: "",
      notes: "",
    });
    setFormErrors({});
  };

  const handleAddProduct = () => {
    resetProductForm();
    setAddProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      description: product.description || "",
      category: product.category || "",
    });
    setEditingProduct(product);
    setFormErrors({});
    setEditProductModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteProductDialogOpen(true);
  };

  const handleAddSale = () => {
    resetSaleForm();
    setAddSaleModalOpen(true);
  };

  const handleDeleteSale = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteSaleDialogOpen(true);
  };

  const handlePrintInvoice = (sale: Sale) => {
    navigate(`/dashboard/print-invoice/${sale.id}`);
  };

  const handlePrintConfirmation = (sale: Sale) => {
    setSaleForPrint(sale);
    setPrintConfirmDialogOpen(true);
  };

  const handleConfirmPrint = () => {
    if (saleForPrint) {
      setPrintConfirmDialogOpen(false);
      navigate(`/dashboard/print-invoice/${saleForPrint.id}`);
    }
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      await saveProduct(productFormData);

      setSuccess("تم إضافة المنتج بنجاح");
      setAddProductModalOpen(false);
      resetProductForm();
      await loadProducts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error instanceof Error ? error.message : "خطأ في حفظ المنتج");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!validateProductForm() || !editingProduct) return;

    try {
      setIsSaving(true);
      setError(null);

      await updateProduct(editingProduct.id, productFormData);

      setSuccess("تم تحديث المنتج بنجاح");
      setEditProductModalOpen(false);
      resetProductForm();
      await loadProducts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating product:", error);
      setError(error instanceof Error ? error.message : "خطأ في تحديث المنتج");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return;

    try {
      setError(null);
      await deleteProduct(productToDelete.id);
      setSuccess("تم حذف المنتج بنجاح");
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
      await loadProducts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(error instanceof Error ? error.message : "خطأ في حذف المنتج");
    }
  };

  const handleSaveSale = async () => {
    if (!validateSaleForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      await saveSale(saleFormData);

      setSuccess("تم تسجيل عملية البيع بنجاح");
      setAddSaleModalOpen(false);

      // جلب المبيعة المحفوظة حديثاً لعرض خيار الطباعة
      await loadData(); // Reload both products and sales

      // العثور على المبيعة الجديدة وعرض خيار الطباعة
      const updatedSales = await getSales();
      const newSale = updatedSales[0]; // المبيعة الأحدث

      resetSaleForm();

      // عرض خيار الطباعة
      if (newSale) {
        handlePrintConfirmation(newSale);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving sale:", error);
      setError(error instanceof Error ? error.message : "خطأ في تسجيل البيع");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaleConfirm = async () => {
    if (!saleToDelete) return;

    try {
      setError(null);
      await deleteSale(saleToDelete.id);
      setSuccess("تم حذف عملية البيع وإعادة الكمية للمخزون");
      setDeleteSaleDialogOpen(false);
      setSaleToDelete(null);
      await loadData(); // Reload both products and sales

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting sale:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في حذف عملية البيع",
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

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy - HH:mm", {
        locale: ar,
      });
    } catch {
      return "تاريخ غير صحيح";
    }
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.id === saleFormData.product_id);
  };

  const calculateTotalValue = () => {
    return products.reduce(
      (total, product) => total + product.quantity * product.price,
      0,
    );
  };

  const calculateTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.total_price, 0);
  };

  const getLowStockProducts = () => {
    return products.filter((product) => product.quantity <= 5);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            جاري تحميل المخزون...
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                إدارة المخزون والمبيعات
              </h1>
              <p className="text-gray-600">
                متابعة المنتجات والمبيعات في الصالة
              </p>
            </div>
          </div>
        </div>

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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">قيمة المخزون</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalValue().toFixed(0)} د.ع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">مبيعات اليوم</p>
                  <p className="text-2xl font-bold">
                    {calculateTotalSales().toFixed(0)} د.ع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Warning */}
        {getLowStockProducts().length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-700">
              تحذير: {getLowStockProducts().length} منتج بكمية قليلة (5 قطع أو
              أقل)
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="البحث في المنتجات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddProduct}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                <Plus className="h-5 w-5 ml-2" />
                إضافة منتج
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة المنتجات ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      لا توجد منتجات
                    </h3>
                    <p className="text-gray-400 mb-6">
                      ابدأ بإضافة أول منتج للمخزون
                    </p>
                    <Button
                      onClick={handleAddProduct}
                      className="bg-purple-500"
                    >
                      <Plus className="h-5 w-5 ml-2" />
                      إضافة منتج
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المنتج</TableHead>
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">
                          القيمة الإجمالية
                        </TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category && (
                              <Badge variant="secondary">
                                {product.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                product.quantity <= 5
                                  ? "text-red-600 font-bold"
                                  : "text-gray-700"
                              }
                            >
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{product.price.toFixed(0)} د.ع</TableCell>
                          <TableCell>
                            {(product.quantity * product.price).toFixed(0)} د.ع
                          </TableCell>
                          <TableCell>
                            {product.quantity <= 5 ? (
                              <Badge variant="destructive">
                                <TrendingDown className="h-3 w-3 ml-1" />
                                كمية قليلة
                              </Badge>
                            ) : (
                              <Badge variant="default">
                                <TrendingUp className="h-3 w-3 ml-1" />
                                متوفر
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
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
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="البحث في المبيعات..."
                    value={salesSearchTerm}
                    onChange={(e) => setSalesSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddSale}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <ShoppingCart className="h-5 w-5 ml-2" />
                تسجيل بيع
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>سجل المبيعات ({sales.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      لا توجد مبيعات
                    </h3>
                    <p className="text-gray-400 mb-6">
                      ابدأ بتسجيل أول عملية بيع
                    </p>
                    <Button onClick={handleAddSale} className="bg-green-500">
                      <ShoppingCart className="h-5 w-5 ml-2" />
                      تسجيل بيع
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">
                          اسم المشتري
                        </TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">سعر الوحدة</TableHead>
                        <TableHead className="text-right">المجموع</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{sale.buyer_name}</div>
                              {sale.notes && (
                                <div className="text-sm text-gray-500">
                                  {sale.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{sale.product_name}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>
                            {sale.unit_price.toFixed(0)} د.ع
                          </TableCell>
                          <TableCell className="font-semibold">
                            {sale.total_price.toFixed(0)} د.ع
                          </TableCell>
                          <TableCell className="text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDateTime(sale.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintInvoice(sale)}
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSale(sale)}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المنتج الجديد الذي تريد إضافته للمخزون
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="add-product-name">اسم المنتج *</Label>
              <Input
                id="add-product-name"
                value={productFormData.name}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    name: e.target.value,
                  })
                }
                placeholder="اسم المنتج"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-product-quantity">الكمية *</Label>
                <Input
                  id="add-product-quantity"
                  type="number"
                  value={productFormData.quantity}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="الكمية"
                  className={formErrors.quantity ? "border-red-500" : ""}
                />
                {formErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.quantity}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="add-product-price">السعر *</Label>
                <Input
                  id="add-product-price"
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      price: e.target.value,
                    })
                  }
                  placeholder="السعر"
                  className={formErrors.price ? "border-red-500" : ""}
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="add-product-category">الفئة</Label>
              <Select
                value={productFormData.category}
                onValueChange={(value) =>
                  setProductFormData({ ...productFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="add-product-description">الوصف</Label>
              <Textarea
                id="add-product-description"
                value={productFormData.description}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    description: e.target.value,
                  })
                }
                placeholder="وصف المنتج..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
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
                onClick={() => setAddProductModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={editProductModalOpen}
        onOpenChange={setEditProductModalOpen}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المنتج "{editingProduct?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-name">اسم المنتج *</Label>
              <Input
                id="edit-product-name"
                value={productFormData.name}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    name: e.target.value,
                  })
                }
                placeholder="اسم المنتج"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-quantity">الكمية *</Label>
                <Input
                  id="edit-product-quantity"
                  type="number"
                  value={productFormData.quantity}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="الكمية"
                  className={formErrors.quantity ? "border-red-500" : ""}
                />
                {formErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.quantity}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-product-price">السعر *</Label>
                <Input
                  id="edit-product-price"
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      price: e.target.value,
                    })
                  }
                  placeholder="السعر"
                  className={formErrors.price ? "border-red-500" : ""}
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-product-category">الفئة</Label>
              <Select
                value={productFormData.category}
                onValueChange={(value) =>
                  setProductFormData({ ...productFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-product-description">الوصف</Label>
              <Textarea
                id="edit-product-description"
                value={productFormData.description}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    description: e.target.value,
                  })
                }
                placeholder="وصف المنتج..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdateProduct}
                disabled={isSaving}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
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
                onClick={() => setEditProductModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Sale Dialog */}
      <Dialog open={addSaleModalOpen} onOpenChange={setAddSaleModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل عملية بيع</DialogTitle>
            <DialogDescription>
              سجل عملية بيع جديدة وخصم الكمية من المخزون
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sale-buyer-name">اسم المشتري *</Label>
              <Input
                id="sale-buyer-name"
                value={saleFormData.buyer_name}
                onChange={(e) =>
                  setSaleFormData({
                    ...saleFormData,
                    buyer_name: e.target.value,
                  })
                }
                placeholder="اسم المشتري"
                className={formErrors.buyer_name ? "border-red-500" : ""}
              />
              {formErrors.buyer_name && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.buyer_name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="sale-product">المنتج *</Label>
              <Select
                value={saleFormData.product_id}
                onValueChange={(value) =>
                  setSaleFormData({ ...saleFormData, product_id: value })
                }
              >
                <SelectTrigger
                  className={formErrors.product_id ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((product) => product.quantity > 0)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - متوفر: {product.quantity} - السعر:{" "}
                        {product.price.toFixed(0)} د.ع
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formErrors.product_id && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.product_id}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="sale-quantity">الكمية *</Label>
              <Input
                id="sale-quantity"
                type="number"
                value={saleFormData.quantity}
                onChange={(e) =>
                  setSaleFormData({ ...saleFormData, quantity: e.target.value })
                }
                placeholder="الكمية"
                max={getSelectedProduct()?.quantity || 0}
                className={formErrors.quantity ? "border-red-500" : ""}
              />
              {formErrors.quantity && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.quantity}
                </p>
              )}
              {getSelectedProduct() && (
                <p className="text-sm text-gray-600 mt-1">
                  متوفر: {getSelectedProduct()!.quantity} قطعة
                </p>
              )}
            </div>

            {getSelectedProduct() && saleFormData.quantity && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ملخص عملية البيع:</h4>
                <div className="space-y-1 text-sm">
                  <p>المنتج: {getSelectedProduct()!.name}</p>
                  <p>الكمية: {saleFormData.quantity}</p>
                  <p>
                    سعر الوحدة: {getSelectedProduct()!.price.toFixed(0)} د.ع
                  </p>
                  <p className="font-bold">
                    المجموع:{" "}
                    {(
                      Number(saleFormData.quantity) *
                      getSelectedProduct()!.price
                    ).toFixed(0)}{" "}
                    د.ع
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="sale-notes">ملاحظات</Label>
              <Textarea
                id="sale-notes"
                value={saleFormData.notes}
                onChange={(e) =>
                  setSaleFormData({ ...saleFormData, notes: e.target.value })
                }
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveSale}
                disabled={isSaving}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ShoppingCart className="h-4 w-4 ml-2" />
                )}
                {isSaving ? "جاري الت��جيل..." : "تسجيل البيع"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddSaleModalOpen(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog
        open={deleteProductDialogOpen}
        onOpenChange={setDeleteProductDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد حذف المنتج
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف المنتج "{productToDelete?.name}"؟
              <br />
              <span className="text-red-600 font-medium">
                سيتم حذف المنتج وجميع المبيعات المرتبطة به.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProductConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sale Confirmation Dialog */}
      <AlertDialog
        open={deleteSaleDialogOpen}
        onOpenChange={setDeleteSaleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد حذف عملية البيع
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف عملية البيع؟
              <br />
              <span className="text-green-600 font-medium">
                سيتم إعادة الكمية المباعة إلى المخزون.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSaleConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف عملية البيع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Confirmation Dialog */}
      <AlertDialog
        open={printConfirmDialogOpen}
        onOpenChange={setPrintConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              🖨️ طباعة الفاتورة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              تم تسجيل عملية البيع بنجاح!
              <br />
              <span className="text-green-600 font-medium">
                هل تريد طباعة الفاتورة الآن؟
              </span>
              {saleForPrint && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <strong>المشتري:</strong> {saleForPrint.buyer_name}
                  </div>
                  <div>
                    <strong>المنتج:</strong> {saleForPrint.product_name}
                  </div>
                  <div>
                    <strong>المبلغ:</strong>{" "}
                    {saleForPrint.total_price.toFixed(0)} د.ع
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setSaleForPrint(null)}>
              لا، شكراً
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPrint}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 ml-2" />
              نعم، اطبع الفاتورة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
