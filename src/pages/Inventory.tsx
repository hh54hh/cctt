import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { Product, Sale } from "@/lib/types";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  updateProductQuantity,
  getSales,
  saveSale,
  deleteSale,
  updateSale,
} from "@/lib/storage-new";
import { cn } from "@/lib/utils";
import { InvoicePrintTemplate } from "@/components/InvoicePrintTemplate";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<Sale | null>(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    quantity: "",
    price: "",
  });

  // Sale form state
  const [saleForm, setSaleForm] = useState({
    buyerName: "",
    productId: "",
    quantity: "",
  });

  // Sales management states
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSaleDialogOpen, setEditSaleDialogOpen] = useState(false);
  const [deleteSaleDialogOpen, setDeleteSaleDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Edit product states
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    quantity: "",
    price: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales(),
      ]);
      setProducts(productsData || []);
      setSales(salesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSales = sales.filter(
    (sale) =>
      sale.buyerName.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
      sale.productName.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(salesSearchTerm.toLowerCase()),
  );

  const validateProductForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productForm.name.trim()) {
      newErrors.productName = "اسم المنتج مطلوب";
    }

    const quantity = parseInt(productForm.quantity);
    if (!productForm.quantity || quantity <= 0) {
      newErrors.productQuantity = "الكمية يجب ��ن تكون أكبر من صفر";
    }

    const price = parseFloat(productForm.price);
    if (!productForm.price || price <= 0) {
      newErrors.productPrice = "السعر يجب أن يكون أكبر من صفر";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSaleForm = () => {
    const newErrors: Record<string, string> = {};

    if (!saleForm.buyerName.trim()) {
      newErrors.buyerName = "اسم المشتري مطلوب";
    }

    if (!saleForm.productId) {
      newErrors.productId = "يجب اختيار المنتج";
    }

    const quantity = parseInt(saleForm.quantity);
    if (!saleForm.quantity || quantity <= 0) {
      newErrors.quantity = "الكمية يجب أن تكون أكبر من صفر";
    }

    // Check if product has enough stock
    if (saleForm.productId && quantity > 0) {
      const product = products.find((p) => p.id === saleForm.productId);
      if (product && quantity > product.quantity) {
        newErrors.quantity = `الكمية المتوفرة: ${product.quantity} فقط`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProductForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productForm.name.trim(),
        quantity: parseInt(productForm.quantity),
        price: parseFloat(productForm.price),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveProduct(newProduct);
      await loadData();

      // Reset form
      setProductForm({
        name: "",
        quantity: "",
        price: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSaleForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const product = products.find((p) => p.id === saleForm.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const quantity = parseInt(saleForm.quantity);
      const totalPrice = product.price * quantity;

      const newSale: Sale = {
        id: Date.now().toString(),
        buyerName: saleForm.buyerName.trim(),
        productId: saleForm.productId,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        totalPrice: totalPrice,
        createdAt: new Date(),
      };

      // Save sale and update product quantity
      await saveSale(newSale);
      await updateProductQuantity(
        saleForm.productId,
        product.quantity - quantity,
      );

      await loadData();

      // Reset form
      setSaleForm({
        buyerName: "",
        productId: "",
        quantity: "",
      });
      setErrors({});
      setSaleSuccess(newSale);

      // Clear success message after 5 seconds
      setTimeout(() => setSaleSuccess(null), 5000);
    } catch (error) {
      console.error("Error processing sale:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = async (sale: Sale) => {
    // Create temporary container for rendering React component
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    document.body.appendChild(tempContainer);

    // Dynamic import React and ReactDOM
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");

    // Create root and render the invoice template
    const root = createRoot(tempContainer);

    root.render(React.createElement(InvoicePrintTemplate, { sale }));

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get the print content
    const printContent = document.getElementById("invoice-print-content");

    if (printContent) {
      // Create new window for printing
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        // Clone content and make it visible
        const clonedContent = printContent.cloneNode(true) as HTMLElement;
        clonedContent.style.display = "block";

        // Write complete HTML document
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة - ${sale.buyerName}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Cairo', 'Tajawal', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
                direction: rtl;
                background: white;
                color: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }

              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
                * {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            ${clonedContent.outerHTML}
          </body>
          </html>
        `);

        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();

            // Close window after printing
            setTimeout(() => {
              printWindow.close();
            }, 500);
          }, 100);
        };

        // Fallback if onload doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 1000);
      }
    }

    // Clean up temporary container
    setTimeout(() => {
      document.body.removeChild(tempContainer);
    }, 500);
  };

  const calculateTotalRevenue = () => {
    return sales.reduce((total, sale) => total + sale.totalPrice, 0);
  };

  const getLowStockProducts = () => {
    return products.filter((product) => product.quantity <= 5);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditProductForm({
      name: product.name,
      quantity: product.quantity.toString(),
      price: product.price.toString(),
    });
    setEditProductDialogOpen(true);
  };

  const handleQuickSale = (product: Product) => {
    setSaleForm((prev) => ({
      ...prev,
      productId: product.id,
    }));
    // Switch to sales tab
    const salesTabTrigger = document.querySelector(
      '[data-state="inactive"][value="sales"]',
    ) as HTMLElement;
    if (salesTabTrigger) {
      salesTabTrigger.click();
    }
  };

  const confirmEditProduct = async () => {
    if (!productToEdit) return;

    const newErrors: Record<string, string> = {};

    if (!editProductForm.name.trim()) {
      newErrors.editProductName = "اسم المنتج مطلوب";
    }

    const quantity = parseInt(editProductForm.quantity);
    if (!editProductForm.quantity || quantity <= 0) {
      newErrors.editProductQuantity = "الكمية يجب أن تكون أكبر من صفر";
    }

    const price = parseFloat(editProductForm.price);
    if (!editProductForm.price || price <= 0) {
      newErrors.editProductPrice = "السعر يجب أن يكون أكبر من صفر";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const updatedProduct: Product = {
        ...productToEdit,
        name: editProductForm.name.trim(),
        quantity: quantity,
        price: price,
        updatedAt: new Date(),
      };

      await saveProduct(updatedProduct);
      await loadData();
      setEditProductDialogOpen(false);
      setProductToEdit(null);
      setErrors({});
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteSale = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteSaleDialogOpen(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      try {
        // Restore product quantity
        const product = products.find((p) => p.id === saleToDelete.productId);
        if (product) {
          await updateProductQuantity(
            saleToDelete.productId,
            product.quantity + saleToDelete.quantity,
          );
        }

        await deleteSale(saleToDelete.id);
        await loadData();
        setDeleteSaleDialogOpen(false);
        setSaleToDelete(null);
      } catch (error) {
        console.error("Error deleting sale:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المخزن</h1>
          <p className="text-gray-600">إدارة المنتجات والمبيعات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Archive className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculateTotalRevenue().toLocaleString()} د.ع
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">عدد المبيعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLowStockProducts().length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {saleSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">
                    تمت عملية البيع بنجاح!
                  </h3>
                  <p className="text-sm text-green-700">
                    تم بيع {saleSuccess.quantity} من {saleSuccess.productName}
                    بمبلغ {saleSuccess.totalPrice.toLocaleString()} دينار عراقي
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintInvoice(saleSuccess)}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <Printer className="h-4 w-4 mr-2" />
                طباعة الفاتورة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {getLowStockProducts().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-900">
                  تنبيه: مخزون منخفض
                </h3>
                <p className="text-sm text-yellow-700">
                  يوجد {getLowStockProducts().length} منتجات بمخزون منخفض (5 قطع
                  أو أقل)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
          <TabsTrigger
            value="products"
            className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
          >
            <Package className="h-5 w-5" />
            📦 إدارة المنتجات
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            💰 المبيعات
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Product Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-orange-600" />
                  إضافة منتج جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="text-right block">
                      اسم المنتج *
                    </Label>
                    <Input
                      id="productName"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="أدخل اسم المنتج"
                      className={cn(
                        "text-right",
                        errors.productName && "border-red-500",
                      )}
                    />
                    {errors.productName && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="productQuantity"
                      className="text-right block"
                    >
                      الكمية *
                    </Label>
                    <Input
                      id="productQuantity"
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      placeholder="عدد القطع"
                      min="1"
                      className={cn(
                        "text-right",
                        errors.productQuantity && "border-red-500",
                      )}
                    />
                    {errors.productQuantity && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.productQuantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productPrice" className="text-right block">
                      السعر (دينار عراقي) *
                    </Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="سعر الوحدة"
                      min="0.01"
                      className={cn(
                        "text-right",
                        errors.productPrice && "border-red-500",
                      )}
                    />
                    {errors.productPrice && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.productPrice}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        إضافة المنتج
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في المنتجات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 text-right"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mb-4">
                      <Package className="h-12 w-12 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {products.length === 0
                        ? "لا توجد منتجات حتى الآن"
                        : "لم يتم العثور على نتائج"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {products.length === 0
                        ? "ابدأ بإضافة أول منتج للمخزن لبدء إدارة المبيعات"
                        : "جرب تغيير كلمات البحث أو تصفح جميع المنتجات"}
                    </p>
                    {products.length === 0 && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg inline-block">
                        💡 نصيحة: أضف منتجات متنوعة لتسهيل عملية البيع والمتابعة
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={cn(
                        "hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden",
                        product.quantity <= 5
                          ? "border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-yellow-100"
                          : "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-orange-300",
                      )}
                    >
                      {/* Status Indicator */}
                      <div className="absolute top-2 left-2">
                        {product.quantity <= 5 ? (
                          <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                            ⚠️ مخزون منخفض
                          </div>
                        ) : product.quantity <= 10 ? (
                          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            📦 متوسط
                          </div>
                        ) : (
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            ✅ متوفر
                          </div>
                        )}
                      </div>

                      <CardContent className="p-6 pt-12">
                        {/* Product Header */}
                        <div className="text-center mb-6">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Package className="h-8 w-8 text-orange-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            📅 أضيف في{" "}
                            {new Date(product.createdAt).toLocaleDateString(
                              "en-GB",
                            )}
                          </p>
                        </div>

                        {/* Product Stats */}
                        <div className="space-y-4 mb-6">
                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                📦 الكمية المتوفرة
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-sm font-bold px-3 py-1",
                                  product.quantity <= 5
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : product.quantity <= 10
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                      : "bg-green-100 text-green-700 border-green-200",
                                )}
                              >
                                {product.quantity} قطعة
                              </Badge>
                            </div>

                            {/* Quantity Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className={cn(
                                  "h-2 rounded-full transition-all duration-500",
                                  product.quantity <= 5
                                    ? "bg-gradient-to-r from-red-400 to-red-500"
                                    : product.quantity <= 10
                                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                      : "bg-gradient-to-r from-green-400 to-green-500",
                                )}
                                style={{
                                  width: `${Math.min((product.quantity / 20) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                💰 سعر الوحدة
                              </span>
                              <span className="text-lg font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                {product.price.toLocaleString()} د.ع
                              </span>
                            </div>
                          </div>

                          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                💎 القيمة الإجمالية
                              </span>
                              <span className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                {(
                                  product.quantity * product.price
                                ).toLocaleString()}{" "}
                                د.ع
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </Button>
                        </div>

                        {/* Quick Sale Button */}
                        {product.quantity > 0 && (
                          <Button
                            className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            onClick={() => handleQuickSale(product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            بيع سريع
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sale Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  تسجيل عملية بيع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSale} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerName" className="text-right block">
                      اسم المشتري *
                    </Label>
                    <Input
                      id="buyerName"
                      value={saleForm.buyerName}
                      onChange={(e) =>
                        setSaleForm((prev) => ({
                          ...prev,
                          buyerName: e.target.value,
                        }))
                      }
                      placeholder="أدخل اسم المشتري"
                      className={cn(
                        "text-right",
                        errors.buyerName && "border-red-500",
                      )}
                    />
                    {errors.buyerName && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.buyerName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productSelect" className="text-right block">
                      المنتج *
                    </Label>
                    <Select
                      value={saleForm.productId}
                      onValueChange={(value) =>
                        setSaleForm((prev) => ({ ...prev, productId: value }))
                      }
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر المنتج" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter((product) => product.quantity > 0)
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="text-right">
                                {product.name} - {product.price} د.ع (متوفر:{" "}
                                {product.quantity})
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.productId && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.productId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saleQuantity" className="text-right block">
                      الكمية *
                    </Label>
                    <Input
                      id="saleQuantity"
                      type="number"
                      value={saleForm.quantity}
                      onChange={(e) =>
                        setSaleForm((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      placeholder="عدد القطع"
                      min="1"
                      className={cn(
                        "text-right",
                        errors.quantity && "border-red-500",
                      )}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-600 text-right">
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  {/* Sale Summary */}
                  {saleForm.productId && saleForm.quantity && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">
                        ملخص العملية
                      </h4>
                      {(() => {
                        const product = products.find(
                          (p) => p.id === saleForm.productId,
                        );
                        const quantity = parseInt(saleForm.quantity) || 0;
                        if (product && quantity > 0) {
                          return (
                            <div className="text-sm space-y-1">
                              <p>
                                المنتج: <strong>{product.name}</strong>
                              </p>
                              <p>
                                السعر الواحد:{" "}
                                <strong>
                                  {product.price.toLocaleString()} د.ع
                                </strong>
                              </p>
                              <p>
                                الكمية: <strong>{quantity}</strong>
                              </p>
                              <p className="font-bold text-green-700 pt-2 border-t">
                                المجموع:{" "}
                                {(product.price * quantity).toLocaleString()}{" "}
                                د.ع
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        تسجيل البيع
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sales List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في المبيعات..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="pr-10 text-right"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sales List */}
              {filteredSales.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {sales.length === 0
                        ? "لا توجد مبيعات حتى الآن"
                        : "لم يتم العثور على نتائج"}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {sales.length === 0
                        ? "ابدأ بتسجيل أول عملية بيع"
                        : "جرب تغيير كلمات البحث"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredSales.map((sale) => (
                    <Card
                      key={sale.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {sale.buyerName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(sale.createdAt).toLocaleDateString(
                                    "en-GB",
                                  )}{" "}
                                  -{" "}
                                  {new Date(sale.createdAt).toLocaleTimeString(
                                    "en-GB",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>
                                <strong>{sale.productName}</strong>
                              </span>
                              <span>الكمية: {sale.quantity}</span>
                              <span className="font-bold text-green-600">
                                {sale.totalPrice.toLocaleString()} د.ع
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintInvoice(sale)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              طباعة
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSale(sale)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Product Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف المنتج
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف المنتج "{productToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={editProductDialogOpen}
        onOpenChange={setEditProductDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              تعديل المنتج
            </DialogTitle>
            <DialogDescription className="text-right">
              تعديل بيانات المنتج: {productToEdit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editProductName" className="text-right block">
                اسم المنتج *
              </Label>
              <Input
                id="editProductName"
                value={editProductForm.name}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="أدخل اسم المنتج"
                className="text-right"
              />
              {errors.editProductName && (
                <p className="text-sm text-red-600 text-right">
                  {errors.editProductName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editProductQuantity" className="text-right block">
                الكمية *
              </Label>
              <Input
                id="editProductQuantity"
                type="number"
                value={editProductForm.quantity}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                placeholder="عدد القطع"
                min="1"
                className="text-right"
              />
              {errors.editProductQuantity && (
                <p className="text-sm text-red-600 text-right">
                  {errors.editProductQuantity}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editProductPrice" className="text-right block">
                السعر (دينار عراقي) *
              </Label>
              <Input
                id="editProductPrice"
                type="number"
                step="0.01"
                value={editProductForm.price}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="سعر الوحدة"
                min="0.01"
                className="text-right"
              />
              {errors.editProductPrice && (
                <p className="text-sm text-red-600 text-right">
                  {errors.editProductPrice}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditProductDialogOpen(false);
                setProductToEdit(null);
                setErrors({});
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmEditProduct}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sale Dialog */}
      <AlertDialog
        open={deleteSaleDialogOpen}
        onOpenChange={setDeleteSaleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف عملية البيع
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف عملية البيع هذه؟ سيتم إرجاع الكمية للمخزن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSale}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Print Template */}
      <InvoicePrintTemplate sale={sales[0] || {}} />
    </div>
  );
}
