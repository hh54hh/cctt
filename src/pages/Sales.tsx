import React, { useState, useEffect, useRef } from "react";
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Save,
  Printer,
  Calculator,
  ShoppingCart,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createRecord, updateRecord, SUPABASE_TABLES } from "@/lib/syncService";
import { db } from "@/lib/database";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Sale {
  id: string;
  customer_name: string;
  customer_phone?: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
}

interface Subscriber {
  id: string;
  name: string;
  phone: string;
}

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerType, setCustomerType] = useState<"manual" | "subscriber">(
    "manual",
  );
  const [selectedSubscriber, setSelectedSubscriber] = useState("");

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Invoice printing
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Load data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load products
        const productsData = await db.products.toArray();
        if (productsData.length > 0) {
          setProducts(productsData);
        }

        // Load subscribers
        const subscribersData = await db.subscribers.toArray();
        if (subscribersData.length > 0) {
          setSubscribers(
            subscribersData.map((sub) => ({
              id: sub.id!,
              name: sub.name,
              phone: sub.phone,
            })),
          );
        }

        // Load sales
        const salesData = await db.sales.toArray();
        if (salesData.length > 0) {
          setSales(salesData);
        }
      } catch (error) {
        console.error("Error loading sales data:", error);
      }
    };

    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter(
    (product) =>
      product.quantity > 0 &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Add to cart
  const addToCart = () => {
    if (!selectedProduct || selectedQuantity <= 0) {
      toast.error("يرجى اختيار المنتج والكمية");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    if (selectedQuantity > product.quantity) {
      toast.error("الكمية المطلوبة غير متوفرة");
      return;
    }

    // Check if product already in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === selectedProduct,
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      const newQuantity =
        updatedCart[existingItemIndex].quantity + selectedQuantity;

      if (newQuantity > product.quantity) {
        toast.error("الكمية المطلوبة تتجاوز المتوفر");
        return;
      }

      updatedCart[existingItemIndex].quantity = newQuantity;
      updatedCart[existingItemIndex].total = newQuantity * product.price;
      setCart(updatedCart);
    } else {
      // Add new item
      const cartItem: CartItem = {
        product,
        quantity: selectedQuantity,
        total: selectedQuantity * product.price,
      };
      setCart([...cart, cartItem]);
    }

    setSelectedProduct("");
    setSelectedQuantity(1);
    toast.success("تم إضافة المنتج إلى السلة");
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.success("تم إزالة المنتج من السلة");
  };

  // Update cart quantity
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity > product.quantity) {
      toast.error("الكمية المطلوبة غير متوفرة");
      return;
    }

    const updatedCart = cart.map((item) =>
      item.product.id === productId
        ? { ...item, quantity, total: quantity * item.product.price }
        : item,
    );
    setCart(updatedCart);
  };

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  // Handle subscriber selection
  const handleSubscriberSelect = (subscriberId: string) => {
    const subscriber = subscribers.find((s) => s.id === subscriberId);
    if (subscriber) {
      setCustomerName(subscriber.name);
      setCustomerPhone(subscriber.phone);
      setSelectedSubscriber(subscriberId);
    }
  };

  // Process sale
  const processSale = async () => {
    if (!customerName.trim()) {
      toast.error("يرجى إدخال اسم الزبون");
      return;
    }

    if (cart.length === 0) {
      toast.error("يرجى إضافة منتجات إلى السلة");
      return;
    }

    try {
      // Create sale record
      const saleData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: [...cart],
        total_amount: calculateTotal(),
      };

      // Save sale to database
      const saleId = await createRecord(SUPABASE_TABLES.sales, saleData);

      // Update product quantities in database
      for (const cartItem of cart) {
        const newQuantity = cartItem.product.quantity - cartItem.quantity;
        await updateRecord(SUPABASE_TABLES.products, cartItem.product.id, {
          quantity: newQuantity,
        });
      }

      // Reload data from database
      const [updatedProducts, updatedSales] = await Promise.all([
        db.products.toArray(),
        db.sales.toArray(),
      ]);

      setProducts(updatedProducts);
      setSales(updatedSales);

      // Create sale object for invoice
      const sale: Sale = {
        id: saleId,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: [...cart],
        total_amount: calculateTotal(),
        created_at: new Date().toISOString(),
      };

      // Clear form and cart
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setSelectedSubscriber("");

      // Show invoice
      setCurrentInvoice(sale);
      setShowInvoice(true);
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error("حدث خطأ أثناء إتمام البيع");
    }
  };

  // Print invoice
  const printInvoice = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current;
      const printWindow = window.open("", "", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>فاتورة البيع - صالة حسام جم</title>
              <style>
                @media print {
                  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; direction: rtl; }
                  .invoice-container { max-width: 800px; margin: 0 auto; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .logo { width: 80px; height: 80px; border-radius: 50%; background: #16a34a; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 24px; font-weight: bold; }
                  .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                  .company-subtitle { color: #666; }
                  .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                  .customer-info, .invoice-details { flex: 1; }
                  .invoice-details { text-align: left; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                  th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                  th { background-color: #f5f5f5; font-weight: bold; }
                  .total-row { font-weight: bold; background-color: #f9f9f9; }
                  .footer { text-align: center; margin-top: 30px; color: #666; }
                  @page { margin: 1cm; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">نظام المبيعات</h1>
          <p className="text-muted-foreground">
            إنشاء فواتير البيع وإدارة المبيعات
          </p>
        </div>
        <div className="flex gap-2">
          {cart.length > 0 && (
            <>
              <Button onClick={processSale} className="gym-button">
                <Save className="w-4 h-4 mr-2" />
                إتمام البيع ({calculateTotal().toFixed(2)} ر.س)
              </Button>
              <Button variant="outline" onClick={() => setCart([])}>
                إلغاء السلة
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المبيعات
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات اليوم</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales
                .filter(
                  (sale) =>
                    new Date(sale.created_at).toDateString() ===
                    new Date().toDateString(),
                )
                .reduce((sum, sale) => sum + sale.total_amount, 0)
                .toFixed(2)}{" "}
              ر.س
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الإيرادات
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales
                .reduce((sum, sale) => sum + sale.total_amount, 0)
                .toFixed(2)}{" "}
              ر.س
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              العناصر في السلة
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cart.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Sale Form */}
        <div className="space-y-4 lg:space-y-6">
          {/* Customer Selection */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                معلومات الزبون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={customerType === "manual" ? "default" : "outline"}
                  onClick={() => setCustomerType("manual")}
                  className="w-full text-xs sm:text-sm"
                >
                  زبون عادي
                </Button>
                <Button
                  variant={
                    customerType === "subscriber" ? "default" : "outline"
                  }
                  onClick={() => setCustomerType("subscriber")}
                  className="w-full text-xs sm:text-sm"
                >
                  من المشتركين
                </Button>
              </div>

              {customerType === "subscriber" && (
                <div className="space-y-2">
                  <Label>اختيار المشترك</Label>
                  <Select
                    value={selectedSubscriber}
                    onValueChange={handleSubscriberSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مشترك" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscribers.map((subscriber) => (
                        <SelectItem key={subscriber.id} value={subscriber.id}>
                          {subscriber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customerName">اسم الزبون *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم الزبون"
                  className="text-right"
                  disabled={customerType === "subscriber" && selectedSubscriber}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">رقم الهاتف</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="رقم الهاتف (اختياري)"
                  className="text-right"
                  disabled={customerType === "subscriber" && selectedSubscriber}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-primary" />
                إضافة منتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>البحث عن منتج</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اختيار المنتج</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر منتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.price} ر.س (متوفر:{" "}
                        {product.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) =>
                      setSelectedQuantity(parseInt(e.target.value) || 1)
                    }
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="hidden sm:block">&nbsp;</Label>
                  <Button
                    onClick={addToCart}
                    className="w-full"
                    disabled={!selectedProduct}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة للسلة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shopping Cart */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-primary" />
                سلة المشتريات
              </div>
              <Badge variant="secondary">{cart.length} عنصر</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                السلة فا��غة
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.product.price} ر.س × {item.quantity} ={" "}
                        {item.total.toFixed(2)} ر.س
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        type="number"
                        min="1"
                        max={item.product.quantity + item.quantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQuantity(
                            item.product.id,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-16 text-center flex-shrink-0"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="text-left">
                  <div className="text-2xl font-bold">
                    الإجمالي: {calculateTotal().toFixed(2)} ر.س
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Modal */}
      {showInvoice && currentInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">فاتورة البيع</h2>
                <div className="flex gap-2">
                  <Button onClick={printInvoice} className="gym-button">
                    <Printer className="w-4 h-4 mr-2" />
                    طباعة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInvoice(false)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>

              {/* Invoice Content */}
              <div ref={invoiceRef} className="invoice-container">
                <div className="header">
                  <div className="logo">حسام</div>
                  <div className="company-name">صالة حسام جم</div>
                  <div className="company-subtitle">
                    نظام إدارة الصالة الرياضية
                  </div>
                </div>

                <div className="invoice-info">
                  <div className="customer-info">
                    <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>
                      معلومات الزبون:
                    </h3>
                    <p>الاسم: {currentInvoice.customer_name}</p>
                    {currentInvoice.customer_phone && (
                      <p>الهاتف: {currentInvoice.customer_phone}</p>
                    )}
                  </div>
                  <div className="invoice-details">
                    <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>
                      تفاصيل الفاتورة:
                    </h3>
                    <p>رقم الفاتورة: {currentInvoice.id}</p>
                    <p>التاريخ: {formatDate(currentInvoice.created_at)}</p>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>السعر</th>
                      <th>الكمية</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product.name}</td>
                        <td>{item.product.price.toFixed(2)} ر.س</td>
                        <td>{item.quantity}</td>
                        <td>{item.total.toFixed(2)} ر.س</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={3}>المجموع الكلي</td>
                      <td>{currentInvoice.total_amount.toFixed(2)} ر.س</td>
                    </tr>
                  </tbody>
                </table>

                <div className="footer">
                  <p>شكراً لتعاملكم معنا</p>
                  <p>© 2024 صالة حسام جم - جميع الحقوق محفوظة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
