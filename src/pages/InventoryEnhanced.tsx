import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ShoppingCart,
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Printer,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import {
  getProducts,
  getSales,
  createProduct,
  updateProduct,
  deleteProduct,
  createSale,
  deleteSale,
  initializeTables,
} from "@/lib/inventory-database";
import { Product, Sale } from "@/lib/inventory-types";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";
import { offlineManager } from "@/lib/offline-manager";

// Sale Print Template Component
interface SalePrintTemplateProps {
  sale: Sale;
}

function SalePrintTemplate({ sale }: SalePrintTemplateProps) {
  const handlePrint = () => {
    window.print();
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0 ريال";
    }
    return `${amount.toLocaleString()} ريال`;
  };

  return (
    <div className="print-container">
      <div className="no-print mb-4 text-center">
        <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
          <Printer className="w-4 h-4 ml-2" />
          طباعة فاتورة البيع
        </Button>
      </div>

      <div className="print-content" dir="rtl">
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="logo-section">
              <img
                src="https://cdn.builder.io/api/v1/assets/f91a990b079c48309bb2a3ebf32314b6/photo_2025-06-17_16-27-55-183bb1?format=webp&width=100"
                alt="شعار صالة حسام"
                className="gym-logo-img"
              />
            </div>
            <div className="title-section">
              <h1 className="main-title">صالة حسام لكمال الأجسام</h1>
              <h2 className="sub-title">فاتورة بيع</h2>
              <p className="subtitle">معاملة بيع وشراء</p>
            </div>
            <div className="date-section">
              <p className="print-date">تاريخ الطباعة:</p>
              <p className="date-value">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Sale Info */}
        <div className="sale-info-section">
          <h2 className="section-title">📋 معلومات البيع</h2>
          <div className="info-grid">
            <div className="info-row">
              <div className="info-item">
                <span className="label">رقم الفاتورة:</span>
                <span className="value">#{sale.id.slice(-8)}</span>
              </div>
              <div className="info-item">
                <span className="label">اسم العميل:</span>
                <span className="value">{sale.customer_name}</span>
              </div>
              <div className="info-item">
                <span className="label">اسم المنتج:</span>
                <span className="value">{sale.product_name}</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <span className="label">الكمية:</span>
                <span className="value">{sale.quantity}</span>
              </div>
              <div className="info-item">
                <span className="label">سعر الوحدة:</span>
                <span className="value">{formatCurrency(sale.unit_price)}</span>
              </div>
              <div className="info-item">
                <span className="label">الإجمالي:</span>
                <span className="value total-amount">
                  {formatCurrency(sale.total_amount)}
                </span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <span className="label">تاريخ البيع:</span>
                <span className="value">{formatDate(sale.created_at)}</span>
              </div>
              {sale.notes && (
                <div className="info-item full-width">
                  <span className="label">الملاحظات:</span>
                  <span className="value">{sale.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="summary-section">
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">إجمالي المبلغ:</span>
              <span className="summary-value">
                {formatCurrency(sale.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <div className="footer-line"></div>
          <div className="footer-content">
            <div className="signature-section">
              <p className="signature-label">توقيع البائع:</p>
              <div className="signature-line"></div>
            </div>
            <div className="contact-section">
              <p className="footer-note">
                شكراً لتعاملكم مع صالة حسام الرياضية لكمال الأجسام والرشاقة
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            font-family: "Cairo", Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            padding: 15mm !important;
          }
          .header-section {
            margin-bottom: 20px !important;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 15px !important;
          }
          .header-content {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .gym-logo-img {
            width: 60px !important;
            height: 60px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
          }
          .main-title {
            font-size: 16px !important;
            font-weight: bold !important;
            margin: 0 !important;
          }
          .sub-title {
            font-size: 14px !important;
            color: #f97316 !important;
            margin: 0 !important;
          }
          .subtitle {
            font-size: 10px !important;
            color: #666 !important;
            margin: 0 !important;
          }
          .section-title {
            font-size: 14px !important;
            font-weight: bold !important;
            margin-bottom: 10px !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 5px !important;
          }
          .info-grid {
            display: block !important;
          }
          .info-row {
            display: flex !important;
            gap: 20px !important;
            margin-bottom: 8px !important;
          }
          .info-item {
            flex: 1 !important;
            display: flex !important;
            gap: 8px !important;
          }
          .info-item.full-width {
            flex: 2 !important;
          }
          .label {
            font-weight: 600 !important;
            min-width: 80px !important;
            font-size: 10px !important;
          }
          .value {
            font-size: 10px !important;
          }
          .total-amount {
            font-weight: bold !important;
            color: #f97316 !important;
          }
          .summary-section {
            background: #f9f9f9 !important;
            padding: 10px !important;
            margin: 15px 0 !important;
            border: 1px solid #ddd !important;
          }
          .summary-content {
            text-align: center !important;
          }
          .summary-label {
            font-size: 12px !important;
            font-weight: bold !important;
          }
          .summary-value {
            font-size: 16px !important;
            font-weight: bold !important;
            color: #f97316 !important;
            margin-left: 10px !important;
          }
          .footer-section {
            margin-top: 20px !important;
            padding-top: 15px !important;
          }
          .footer-line {
            height: 1px !important;
            background: #ddd !important;
            margin-bottom: 10px !important;
          }
          .footer-content {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .signature-label {
            font-size: 10px !important;
            font-weight: 600 !important;
          }
          .signature-line {
            width: 100px !important;
            height: 1px !important;
            border-bottom: 1px solid #666 !important;
            margin-top: 5px !important;
          }
          .footer-note {
            font-size: 9px !important;
            color: #666 !important;
            margin: 0 !important;
          }
        }

        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          font-family: "Cairo", Arial, sans-serif;
        }
        .print-content {
          padding: 20px;
          font-size: 14px;
          line-height: 1.6;
        }
        .header-section {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gym-logo-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #f97316;
        }
        .title-section {
          text-align: center;
          flex: 1;
        }
        .main-title {
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 5px 0;
        }
        .sub-title {
          font-size: 18px;
          color: #f97316;
          font-weight: bold;
          margin: 0 0 3px 0;
        }
        .subtitle {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
        .date-section {
          text-align: left;
          font-size: 12px;
          color: #6b7280;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 2px solid #d1d5db;
          padding-bottom: 8px;
        }
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-row {
          display: flex;
          gap: 20px;
        }
        .info-item {
          flex: 1;
          display: flex;
          gap: 10px;
        }
        .info-item.full-width {
          flex: 2;
        }
        .label {
          font-weight: 600;
          color: #4b5563;
          min-width: 120px;
        }
        .value {
          color: #1f2937;
        }
        .total-amount {
          font-weight: bold;
          color: #f97316;
          font-size: 16px;
        }
        .summary-section {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }
        .summary-label {
          font-size: 14px;
          color: #6b7280;
        }
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #f97316;
          margin-left: 15px;
        }
        .footer-section {
          margin-top: 30px;
          padding-top: 20px;
        }
        .footer-line {
          height: 1px;
          background-color: #d1d5db;
          margin-bottom: 15px;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .signature-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .signature-label {
          font-weight: 600;
          color: #4b5563;
          margin: 0;
        }
        .signature-line {
          width: 150px;
          height: 1px;
          border-bottom: 1px solid #6b7280;
        }
        .footer-note {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

export default function InventoryEnhanced() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Dialog states
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printSaleOpen, setPrintSaleOpen] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: 0,
    quantity: 0,
    description: "",
  });

  const [saleForm, setSaleForm] = useState({
    customer_name: "",
    product_id: "",
    quantity: 1,
    notes: "",
  });

  // Selected items
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "product" | "sale";
  } | null>(null);
  const [saleToprint, setSaleToPrint] = useState<Sale | null>(null);

  useEffect(() => {
    loadData();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      offlineManager.syncPendingOperations();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

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

      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales(),
      ]);

      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error("Error loading inventory data:", error);
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل بيانات المخزون");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      setError("اسم المنتج مطلوب");
      return;
    }

    try {
      if (!isOnline) {
        // Save for offline sync
        await offlineManager.addPendingOperation({
          type: "CREATE",
          table: "products",
          data: productForm,
          url: "https://ibluvphzaitnetwvvfzu.supabase.co/rest/v1/products",
          method: "POST",
          body: JSON.stringify(productForm),
        });
        setSuccess("تم حفظ المنتج محلياً - سيتم المزامنة عند عودة الإنترنت");
      } else {
        await createProduct(productForm);
        await loadData();
        setSuccess("تم إضافة المنتج بنجاح");
      }

      setAddProductOpen(false);
      resetProductForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding product:", error);
      setError("فشل في إضافة المنتج");
    }
  };

  const handleEditProduct = async () => {
    if (!productToEdit || !productForm.name.trim()) {
      setError("اسم المنتج مطلوب");
      return;
    }

    try {
      if (!isOnline) {
        await offlineManager.addPendingOperation({
          type: "UPDATE",
          table: "products",
          data: { id: productToEdit.id, ...productForm },
          url: `https://ibluvphzaitnetwvvfzu.supabase.co/rest/v1/products?id=eq.${productToEdit.id}`,
          method: "PATCH",
          body: JSON.stringify(productForm),
        });
        setSuccess("تم حفظ التعديلات محلياً - ستتم المزامنة عند عودة الإنترنت");
      } else {
        await updateProduct(productToEdit.id, productForm);
        await loadData();
        setSuccess("تم تحديث المنتج بنجاح");
      }

      setEditProductOpen(false);
      setProductToEdit(null);
      resetProductForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating product:", error);
      setError("فشل في تحديث المنتج");
    }
  };

  const handleAddSale = async () => {
    if (!saleForm.customer_name.trim() || !saleForm.product_id) {
      setError("اسم العميل والمنتج مطلوبان");
      return;
    }

    const product = products.find((p) => p.id === saleForm.product_id);
    if (!product) {
      setError("المنتج غير موجود");
      return;
    }

    if (product.quantity < saleForm.quantity) {
      setError("الكمية المطلوبة غير متوفرة في المخزون");
      return;
    }

    try {
      const saleData = {
        ...saleForm,
        product_name: product.name,
        unit_price: product.price,
        total_amount: product.price * saleForm.quantity,
      };

      if (!isOnline) {
        await offlineManager.addPendingOperation({
          type: "CREATE",
          table: "sales",
          data: saleData,
          url: "https://ibluvphzaitnetwvvfzu.supabase.co/rest/v1/sales",
          method: "POST",
          body: JSON.stringify(saleData),
        });
        setSuccess("تم حفظ البيع محلياً - سيتم المزامنة عند عودة الإنترنت");
      } else {
        await createSale(saleData);
        await loadData();
        setSuccess("تم تسجيل البيع بنجاح");
      }

      setAddSaleOpen(false);
      resetSaleForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding sale:", error);
      setError("فشل في تسجيل البيع");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (!isOnline) {
        await offlineManager.addPendingOperation({
          type: "DELETE",
          table: itemToDelete.type === "product" ? "products" : "sales",
          data: { id: itemToDelete.id },
          url: `https://ibluvphzaitnetwvvfzu.supabase.co/rest/v1/${itemToDelete.type === "product" ? "products" : "sales"}?id=eq.${itemToDelete.id}`,
          method: "DELETE",
        });
        setSuccess(
          "تم حفظ عملية الحذف محلياً - ستتم المزامنة عند عودة الإنترنت",
        );
      } else {
        if (itemToDelete.type === "product") {
          await deleteProduct(itemToDelete.id);
        } else {
          await deleteSale(itemToDelete.id);
        }
        await loadData();
        setSuccess(
          `تم حذف ${itemToDelete.type === "product" ? "المنتج" : "البيع"} بنجاح`,
        );
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("فشل في الحذف");
    }
  };

  const openEditProduct = (product: Product) => {
    setProductToEdit(product);
    setProductForm({
      name: product.name,
      category: product.category || "",
      price: product.price,
      quantity: product.quantity,
      description: product.description || "",
    });
    setEditProductOpen(true);
  };

  const handlePrintSale = (sale: Sale) => {
    setSaleToPrint(sale);
    setPrintSaleOpen(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      category: "",
      price: 0,
      quantity: 0,
      description: "",
    });
  };

  const resetSaleForm = () => {
    setSaleForm({
      customer_name: "",
      product_id: "",
      quantity: 1,
      notes: "",
    });
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.name &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const filteredSales = sales.filter(
    (sale) =>
      (sale.customer_name &&
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.product_name &&
        sale.product_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0 ريال";
    }
    return `${amount.toLocaleString()} ريال`;
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

  // Calculate statistics
  const totalProducts = products.length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const lowStockProducts = products.filter((p) => p.quantity <= 5).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600">جاري تحميل بيانات المبيعات...</p>
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
        {/* Header with offline indicator */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  المبيعات والمخزون
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-gray-600 text-lg">
                    إدارة المنتجات والمبيعات
                  </p>
                  {!isOnline && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                      <WifiOff className="h-4 w-4" />
                      <span>وضع عدم الاتصال</span>
                    </div>
                  )}
                  {isOnline && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <Wifi className="h-4 w-4" />
                      <span>متصل</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 shadow-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">إجمالي المنتجات</p>
                    <p className="text-3xl font-bold">{totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">إجمالي المبيعات</p>
                    <p className="text-3xl font-bold">{totalSales}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">الإيرادات</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100">مخزون منخفض</p>
                    <p className="text-3xl font-bold">{lowStockProducts}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Controls */}
        <Card className="mb-6 shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="البحث في المنتجات والمبيعات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 text-lg bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    قائمة المنتجات ({filteredProducts.length})
                  </CardTitle>
                  <Dialog
                    open={addProductOpen}
                    onOpenChange={(open) => {
                      setAddProductOpen(open);
                      if (!open) resetProductForm();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة منتج
                      </Button>
                    </DialogTrigger>
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
                              setProductForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="اسم المنتج"
                          />
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
                            placeholder="فئة المنتج"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>السعر (ريال)</Label>
                            <Input
                              type="number"
                              value={productForm.price}
                              onChange={(e) =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  price: parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="السعر"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الكمية</Label>
                            <Input
                              type="number"
                              value={productForm.quantity}
                              onChange={(e) =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  quantity: parseInt(e.target.value) || 0,
                                }))
                              }
                              placeholder="الكمية"
                            />
                          </div>
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
                            placeholder="وصف المنتج"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddProduct}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            إضافة
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAddProductOpen(false)}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد منتجات</p>
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
                            {product.name}
                          </TableCell>
                          <TableCell>
                            {product.category || "غير محدد"}
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.quantity <= 5
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                product.quantity <= 5
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }
                            >
                              {product.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.quantity > 0 ? "default" : "secondary"
                              }
                              className={
                                product.quantity > 0
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {product.quantity > 0 ? "متوفر" : "نفد المخزون"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProduct(product)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setItemToDelete({
                                    id: product.id,
                                    type: "product",
                                  });
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
          <TabsContent value="sales">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    قائمة المبيعات ({filteredSales.length})
                  </CardTitle>
                  <Dialog
                    open={addSaleOpen}
                    onOpenChange={(open) => {
                      setAddSaleOpen(open);
                      if (!open) resetSaleForm();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-green-500 hover:bg-green-600">
                        <Plus className="w-4 h-4 ml-2" />
                        تسجيل بيع
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>تسجيل بيع جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>اسم العميل *</Label>
                          <Input
                            value={saleForm.customer_name}
                            onChange={(e) =>
                              setSaleForm((prev) => ({
                                ...prev,
                                customer_name: e.target.value,
                              }))
                            }
                            placeholder="اسم العميل"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>المنتج *</Label>
                          <select
                            value={saleForm.product_id}
                            onChange={(e) =>
                              setSaleForm((prev) => ({
                                ...prev,
                                product_id: e.target.value,
                              }))
                            }
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">اختر المنتج</option>
                            {products
                              .filter((p) => p.quantity > 0)
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} -{" "}
                                  {formatCurrency(product.price)} (متوفر:{" "}
                                  {product.quantity})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>الكمية</Label>
                          <Input
                            type="number"
                            value={saleForm.quantity}
                            onChange={(e) =>
                              setSaleForm((prev) => ({
                                ...prev,
                                quantity: parseInt(e.target.value) || 1,
                              }))
                            }
                            placeholder="الكمية"
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Input
                            value={saleForm.notes}
                            onChange={(e) =>
                              setSaleForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="ملاحظات إضافية"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddSale}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            تسجيل البيع
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAddSaleOpen(false)}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد مبيعات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">سعر الوحدة</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.customer_name}
                          </TableCell>
                          <TableCell>{sale.product_name}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(sale.unit_price)}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(sale.total_amount)}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {formatDate(sale.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintSale(sale)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setItemToDelete({
                                    id: sale.id,
                                    type: "sale",
                                  });
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
        </Tabs>
      </div>

      {/* Edit Product Dialog */}
      <Dialog
        open={editProductOpen}
        onOpenChange={(open) => {
          setEditProductOpen(open);
          if (!open) {
            setProductToEdit(null);
            resetProductForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="اسم المنتج"
              />
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
                placeholder="فئة المنتج"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ريال)</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="السعر"
                />
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="الكمية"
                />
              </div>
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
                placeholder="وصف المنتج"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEditProduct}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                تحديث
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditProductOpen(false)}
              >
                إلغاء
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
              هل أنت متأكد من حذف هذا{" "}
              {itemToDelete?.type === "product" ? "المنتج" : "البيع"}؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Sale Dialog */}
      <Dialog open={printSaleOpen} onOpenChange={setPrintSaleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طباعة فاتورة البيع</DialogTitle>
          </DialogHeader>
          {saleToprint && <SalePrintTemplate sale={saleToprint} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
