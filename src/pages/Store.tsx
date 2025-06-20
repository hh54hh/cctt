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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Receipt,
  Printer,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { syncService } from "@/lib/sync";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  category?: string;
  created_at: string;
}

interface Sale {
  id: string;
  product_id: string;
  subscriber_id?: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  notes?: string;
  product?: Product;
  subscriber?: any;
}

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Product modal states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost_price: "",
    stock_quantity: "",
    min_stock_level: "",
    category: "",
  });

  // Sale modal states
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleFormData, setSaleFormData] = useState({
    subscriber_id: "",
    customer_name: "",
    notes: "",
  });

  // Invoice modal states
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, salesData, subscribersData] = await Promise.all([
        syncService.getRecords("products"),
        syncService.getSalesWithDetails(),
        syncService.getRecords("subscribers"),
      ]);

      setProducts(productsData);
      setSales(salesData);
      setSubscribers(subscribersData);

      // Update pending sync count
      const pendingCount = await syncService.getPendingSyncCount();
      setPendingSyncCount(pendingCount);
    } catch (error) {
      toast.error("خطأ في جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for sync completion
    syncService.onSyncComplete(() => {
      fetchData();
    });

    // Update pending sync count periodically
    const interval = setInterval(async () => {
      const pendingCount = await syncService.getPendingSyncCount();
      setPendingSyncCount(pendingCount);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productFormData.name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }

    try {
      const productData = {
        name: productFormData.name,
        description: productFormData.description,
        price: parseFloat(productFormData.price) || 0,
        cost_price: parseFloat(productFormData.cost_price) || 0,
        stock_quantity: parseInt(productFormData.stock_quantity) || 0,
        min_stock_level: parseInt(productFormData.min_stock_level) || 0,
        category: productFormData.category,
      };

      if (editingProduct) {
        await syncService.updateRecord("products", editingProduct.id, {
          ...editingProduct,
          ...productData,
        });
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        await syncService.createRecord("products", productData);
        toast.success("تم إضافة المنتج بنجاح");
      }

      fetchData();
      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (error) {
      toast.error("خطأ في حفظ البيانات");
    }
  };

  const handleMultipleItemSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleItems.length === 0) {
      toast.error("يرجى إضافة منتجات للبيع");
      return;
    }

    try {
      const totalAmount = saleItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      );

      // Create sale record
      const saleId = await syncService.createRecord("sales", {
        customer_name: saleFormData.customer_name || "زبون مجهول",
        subscriber_id: saleFormData.subscriber_id || null,
        total_amount: totalAmount,
        sale_date: new Date().toISOString(),
        notes: saleFormData.notes,
        // For simplicity, we'll use the first item for main sale record
        product_id: saleItems[0].product_id,
        quantity: saleItems[0].quantity,
        unit_price: saleItems[0].unit_price,
      });

      // Create individual sale items and update stock
      for (const item of saleItems) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          // Update product stock
          await syncService.updateRecord("products", product.id, {
            ...product,
            stock_quantity: product.stock_quantity - item.quantity,
          });

          // If not the first item, create separate sale records
          if (item !== saleItems[0]) {
            await syncService.createRecord("sales", {
              customer_name: saleFormData.customer_name || "زبون مجهول",
              subscriber_id: saleFormData.subscriber_id || null,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.quantity * item.unit_price,
              sale_date: new Date().toISOString(),
              notes: `جزء من فاتورة ${saleId}`,
            });
          }
        }
      }

      toast.success("تم تسجيل البيع بنجاح");
      fetchData();
      setIsSaleDialogOpen(false);
      resetSaleForm();
    } catch (error) {
      toast.error("خطأ في حفظ البيانات");
    }
  };

  const addSaleItem = () => {
    setSaleItems([
      ...saleItems,
      { product_id: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill unit price when product is selected
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.price;
      }
    }

    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      category: product.category || "",
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      await syncService.deleteRecord("products", productId);
      toast.success("تم حذف المنتج بنجاح");
      fetchData();
    } catch (error) {
      toast.error("خطأ في حذف المنتج");
    }
  };

  const handleViewInvoice = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceDialogOpen(true);
  };

  const printInvoice = () => {
    if (!selectedSale) return;

    const printContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #1e40af; margin: 0;">صالة حسام جم</h1>
          <h2 style="color: #666; margin: 5px 0;">فاتورة بيع</h2>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>رقم الفاتورة:</strong> ${selectedSale.id.slice(0, 8)}</p>
          <p><strong>التاريخ:</strong> ${format(new Date(selectedSale.sale_date), "dd/MM/yyyy HH:mm", { locale: ar })}</p>
          <p><strong>العميل:</strong> ${selectedSale.customer_name}</p>
          ${selectedSale.subscriber ? `<p><strong>مشترك:</strong> ${selectedSale.subscriber.name}</p>` : ""}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5; border: 1px solid #ddd;">
              <th style="padding: 10px; border: 1px solid #ddd;">المنتج</th>
              <th style="padding: 10px; border: 1px solid #ddd;">الكمية</th>
              <th style="padding: 10px; border: 1px solid #ddd;">السعر</th>
              <th style="padding: 10px; border: 1px solid #ddd;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${selectedSale.product?.name || "منتج محذوف"}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${selectedSale.quantity}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${selectedSale.unit_price.toFixed(2)} ر.س</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${selectedSale.total_amount.toFixed(2)} ر.س</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: left; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333;">
          <h3 style="color: #1e40af;">الإجمالي النهائي: ${selectedSale.total_amount.toFixed(2)} ر.س</h3>
        </div>

        ${selectedSale.notes ? `<div style="margin-top: 20px;"><strong>ملاحظات:</strong><br>${selectedSale.notes}</div>` : ""}

        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          <p>شكراً لزيارتكم صالة حسام جم</p>
          <p>لأي استفسارات، يرجى التواصل معنا</p>
        </div>
      </div>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>فاتورة - صالة حسام جم</title>
            <meta charset="UTF-8">
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      description: "",
      price: "",
      cost_price: "",
      stock_quantity: "",
      min_stock_level: "",
      category: "",
    });
    setEditingProduct(null);
  };

  const resetSaleForm = () => {
    setSaleFormData({
      subscriber_id: "",
      customer_name: "",
      notes: "",
    });
    setSaleItems([]);
  };

  const handleForceSync = () => {
    syncService.forcSync();
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const lowStockProducts = products.filter(
    (product) => product.stock_quantity <= product.min_stock_level,
  );

  const todaysSales = sales.filter(
    (sale) =>
      format(new Date(sale.sale_date), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd"),
  );

  const totalSalesToday = todaysSales.reduce(
    (sum, sale) => sum + sale.total_amount,
    0,
  );

  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, product) => sum + product.stock_quantity,
    0,
  );

  const totalSaleItems = saleItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">المخزن</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المخزن</h1>
          <p className="text-gray-600">إدارة المنتجات والمبيعات</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-2 text-sm">
            {syncService.isOffline() ? (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600">غير متصل</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">متصل</span>
              </>
            )}
            {pendingSyncCount > 0 && (
              <Badge variant="secondary">{pendingSyncCount} في الانتظار</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleForceSync}>
            <RefreshCw className="w-4 h-4" />
            مزامنة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalProducts}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المخزن</p>
                <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">مبيعات اليوم</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSalesToday.toFixed(2)} ر.��
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">منتجات قليلة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تنبيه: منتجات قليلة في المخزن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center"
                >
                  <span className="text-red-700">{product.name}</span>
                  <Badge variant="destructive">
                    {product.stock_quantity} متبقي
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Enhanced Multi-Item Sale Dialog */}
              <Dialog
                open={isSaleDialogOpen}
                onOpenChange={setIsSaleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    بيع منتجات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>تسجيل بيع جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMultipleItemSale} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sale_subscriber">
                          المشترك (اختياري)
                        </Label>
                        <Select
                          value={saleFormData.subscriber_id}
                          onValueChange={(value) =>
                            setSaleFormData({
                              ...saleFormData,
                              subscriber_id: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المشترك" />
                          </SelectTrigger>
                          <SelectContent>
                            {subscribers.map((subscriber) => (
                              <SelectItem
                                key={subscriber.id}
                                value={subscriber.id}
                              >
                                {subscriber.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="sale_customer_name">اسم الزبون</Label>
                        <Input
                          id="sale_customer_name"
                          value={saleFormData.customer_name}
                          onChange={(e) =>
                            setSaleFormData({
                              ...saleFormData,
                              customer_name: e.target.value,
                            })
                          }
                          placeholder="اسم الزبون"
                        />
                      </div>
                    </div>

                    {/* Sale Items */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>المنتجات</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSaleItem}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة منتج
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {saleItems.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg"
                          >
                            <div className="col-span-5">
                              <Label className="text-xs">المنتج</Label>
                              <Select
                                value={item.product_id}
                                onValueChange={(value) =>
                                  updateSaleItem(index, "product_id", value)
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="اختر المنتج" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products
                                    .filter((p) => p.stock_quantity > 0)
                                    .map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id}
                                      >
                                        {product.name} - متوفر:{" "}
                                        {product.stock_quantity}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs">الكمية</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateSaleItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs">السعر</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateSaleItem(
                                    index,
                                    "unit_price",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="col-span-2 text-center">
                              <Label className="text-xs">الإجمالي</Label>
                              <div className="text-sm font-semibold">
                                {(item.quantity * item.unit_price).toFixed(2)}{" "}
                                ر.س
                              </div>
                            </div>

                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSaleItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {saleItems.length === 0 && (
                        <div className="text-center py-4 text-gray-500 border rounded-lg">
                          لا توجد منتجات. اضغط "إضافة منتج" لبدء البيع
                        </div>
                      )}

                      {saleItems.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">
                              إجمالي الفاتورة:
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {totalSaleItems.toFixed(2)} ر.س
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="sale_notes">ملاحظات</Label>
                      <Textarea
                        id="sale_notes"
                        value={saleFormData.notes}
                        onChange={(e) =>
                          setSaleFormData({
                            ...saleFormData,
                            notes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={saleItems.length === 0}
                      >
                        تسجيل البيع ({totalSaleItems.toFixed(2)} ر.س)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSaleDialogOpen(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isProductDialogOpen}
                onOpenChange={setIsProductDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-emerald-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منتج
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="product_name">اسم المنتج *</Label>
                      <Input
                        id="product_name"
                        value={productFormData.name}
                        onChange={(e) =>
                          setProductFormData({
                            ...productFormData,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="product_category">الفئة</Label>
                      <Input
                        id="product_category"
                        value={productFormData.category}
                        onChange={(e) =>
                          setProductFormData({
                            ...productFormData,
                            category: e.target.value,
                          })
                        }
                        placeholder="مثال: مكملات غذائية"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="product_price">سعر البيع</Label>
                        <Input
                          id="product_price"
                          type="number"
                          step="0.01"
                          value={productFormData.price}
                          onChange={(e) =>
                            setProductFormData({
                              ...productFormData,
                              price: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="product_cost_price">سعر التكلفة</Label>
                        <Input
                          id="product_cost_price"
                          type="number"
                          step="0.01"
                          value={productFormData.cost_price}
                          onChange={(e) =>
                            setProductFormData({
                              ...productFormData,
                              cost_price: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="product_stock">الكمية المتوفرة</Label>
                        <Input
                          id="product_stock"
                          type="number"
                          min="0"
                          value={productFormData.stock_quantity}
                          onChange={(e) =>
                            setProductFormData({
                              ...productFormData,
                              stock_quantity: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="product_min_stock">الحد الأدنى</Label>
                        <Input
                          id="product_min_stock"
                          type="number"
                          min="0"
                          value={productFormData.min_stock_level}
                          onChange={(e) =>
                            setProductFormData({
                              ...productFormData,
                              min_stock_level: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="product_description">الوصف</Label>
                      <Textarea
                        id="product_description"
                        value={productFormData.description}
                        onChange={(e) =>
                          setProductFormData({
                            ...productFormData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingProduct ? "تحديث" : "إضافة"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProductDialogOpen(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد منتجات
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ابدأ بإضافة أول منتج للمخزن
                  </p>
                  <Button onClick={() => setIsProductDialogOpen(true)}>
                    إضافة منتج جديد
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category || (
                            <span className="text-gray-400">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>{product.price.toFixed(2)} ر.س</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          {product.stock_quantity <= product.min_stock_level ? (
                            <Badge variant="destructive">قليل</Badge>
                          ) : product.stock_quantity === 0 ? (
                            <Badge variant="secondary">نفد</Badge>
                          ) : (
                            <Badge variant="default">متوفر</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
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
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                سجل المبيعات
              </CardTitle>
              <CardDescription>{sales.length} عملية بيع مسجلة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد مبيعات
                  </h3>
                  <p className="text-gray-600">لم يتم تسجيل أي مبيعات بعد</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الزبون</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.product?.name || "منتج محذوف"}
                        </TableCell>
                        <TableCell>
                          {sale.subscriber?.name || sale.customer_name}
                        </TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>{sale.unit_price.toFixed(2)} ر.س</TableCell>
                        <TableCell className="font-semibold">
                          {sale.total_amount.toFixed(2)} ر.س
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(sale.sale_date),
                            "dd/MM/yyyy HH:mm",
                            { locale: ar },
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(sale)}
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale);
                                printInvoice();
                              }}
                            >
                              <Printer className="w-4 h-4" />
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

      {/* نظام التشخيص */}
      <DatabaseDiagnostics />

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>فاتورة البيع</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>رقم الفاتورة:</strong> {selectedSale.id.slice(0, 8)}
                </div>
                <div>
                  <strong>التاريخ:</strong>{" "}
                  {format(
                    new Date(selectedSale.sale_date),
                    "dd/MM/yyyy HH:mm",
                    { locale: ar },
                  )}
                </div>
                <div>
                  <strong>العميل:</strong> {selectedSale.customer_name}
                </div>
                {selectedSale.subscriber && (
                  <div>
                    <strong>المشترك:</strong> {selectedSale.subscriber.name}
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {selectedSale.product?.name || "منتج محذوف"}
                    </TableCell>
                    <TableCell>{selectedSale.quantity}</TableCell>
                    <TableCell>
                      {selectedSale.unit_price.toFixed(2)} ر.س
                    </TableCell>
                    <TableCell className="font-semibold">
                      {selectedSale.total_amount.toFixed(2)} ر.س
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="text-left border-t pt-4">
                <div className="text-lg font-bold">
                  الإجمالي النهائي: {selectedSale.total_amount.toFixed(2)} ر.س
                </div>
              </div>

              {selectedSale.notes && (
                <div className="bg-gray-50 p-3 rounded">
                  <strong>ملاحظات:</strong>
                  <p>{selectedSale.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={printInvoice} className="flex-1">
                  <Printer className="w-4 h-4 ml-1" />
                  طباعة الفاتورة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsInvoiceDialogOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
