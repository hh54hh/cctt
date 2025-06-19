import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  ShoppingCart,
  Users,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import Layout from "@/components/Layout";
import { db, Product, Subscriber } from "@/lib/database";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Subscriber[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
  });

  // Sales form state
  const [saleData, setSaleData] = useState({
    memberId: "",
    selectedItems: [] as {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[],
  });

  useEffect(() => {
    loadProducts();
    loadMembers();
    loadSales();
  }, []);

  const loadProducts = () => {
    setProducts(db.getProducts());
  };

  const loadMembers = () => {
    setMembers(db.getSubscribers());
  };

  const loadSales = () => {
    setSales(db.getSales());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
    };

    try {
      if (editingProduct) {
        await db.updateProduct(editingProduct.id, productData);
      } else {
        await db.createProduct(productData);
      }

      loadProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", quantity: "" });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await db.deleteProduct(productToDelete);
        loadProducts();
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "نفدت الكمية", color: "destructive" };
    if (quantity < 5) return { label: "كمية قليلة", color: "secondary" };
    return { label: "متوفر", color: "default" };
  };

  // Sales functions
  const addSaleItem = () => {
    setSaleData((prev) => ({
      ...prev,
      selectedItems: [
        ...prev.selectedItems,
        { productId: "", quantity: 1, unitPrice: 0 },
      ],
    }));
  };

  const removeSaleItem = (index: number) => {
    setSaleData((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index),
    }));
  };

  const updateSaleItem = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setSaleData((prev) => {
      const updated = [...prev.selectedItems];
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          updated[index] = {
            ...updated[index],
            productId: value as string,
            unitPrice: product.price,
          };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, selectedItems: updated };
    });
  };

  const getTotalPrice = () => {
    return saleData.selectedItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  };

  const handleCreateSale = async () => {
    if (!saleData.memberId || saleData.selectedItems.length === 0) return;

    const totalPrice = getTotalPrice();

    try {
      // Create sale record
      const sale = await db.createSale({
        subscriber_id: saleData.memberId,
        total_price: totalPrice,
        date: new Date().toISOString(),
      });

      // Create sale items and update product quantities
      for (const item of saleData.selectedItems) {
        await db.createSaleItem({
          sale_id: sale.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        });

        // Update product quantity
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          await db.updateProduct(product.id, {
            quantity: Math.max(0, product.quantity - item.quantity),
          });
        }
      }

      // Reset form and reload data
      setSaleData({ memberId: "", selectedItems: [] });
      setIsSaleDialogOpen(false);
      loadProducts();
      loadSales();
    } catch (error) {
      console.error("Error creating sale:", error);
    }
  };

  const getSaleDetails = (saleId: string) => {
    const saleItems = db.getSaleItemsBySale(saleId);
    return saleItems.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const member = members.find(
        (m) => m.id === sales.find((s) => s.id === saleId)?.subscriber_id,
      );
      return { ...item, product, member };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const lowStockProducts = products.filter((p) => p.quantity < 5);
  const outOfStockProducts = products.filter((p) => p.quantity === 0);
  const totalValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              إدارة المخزن والمبيعات
            </h1>
            <p className="text-gray-600 mt-1">
              مخزن المكملات وعمليات البيع ({products.length} منتج)
            </p>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              إدارة المنتجات
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              البيع والأعضاء
            </TabsTrigger>
          </TabsList>

          {/* Products Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gym-button">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منتج جديد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم المنتج *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="مثال: بروتين واي"
                        className="gym-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الوصف
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="مثال: 2.5 كيلو، نكهة الشوكولاتة"
                        className="gym-input"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          السعر (ر.س) *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          placeholder="250.00"
                          className="gym-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الكمية *
                        </label>
                        <Input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              quantity: e.target.value,
                            }))
                          }
                          placeholder="10"
                          className="gym-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="gym-button flex-1">
                        {editingProduct ? "تحديث" : "إضافة"}
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

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="gym-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <Package className="w-6 h-6 text-blue-600" />
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

              <Card className="gym-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-50">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">قيمة المخزن</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalValue.toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gym-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">كمية قليلة</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {lowStockProducts.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gym-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-50">
                      <Package className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">نفدت الكمية</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {outOfStockProducts.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts for low stock */}
            {lowStockProducts.length > 0 && (
              <Card className="gym-card border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    تنبيه: منتجات تحتاج إعادة تخزين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="secondary">
                          {product.quantity === 0
                            ? "نفدت الكمية"
                            : `${product.quantity} متبقي`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Table */}
            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  جميع المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">
                          القيمة الإجمالية
                        </TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const status = getStockStatus(product.quantity);
                        const productTotalValue =
                          product.price * product.quantity;

                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {product.description || "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.price.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.quantity}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.color as any}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {productTotalValue.toFixed(2)} ر.س
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleEdit(product)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      لا توجد منتجات
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ابدأ بإضافة أول منتج في المخزن
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gym-button">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة أول منتج
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales and Members Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="flex justify-end">
              <Dialog
                open={isSaleDialogOpen}
                onOpenChange={setIsSaleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gym-button">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عملية بيع جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة عملية بيع جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اختر العضو *
                      </label>
                      <Select
                        value={saleData.memberId}
                        onValueChange={(value) =>
                          setSaleData((prev) => ({ ...prev, memberId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر عضو من القائمة" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} - {member.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        المنتجات المحددة:
                      </span>
                      <Button
                        onClick={addSaleItem}
                        variant="outline"
                        size="sm"
                        disabled={
                          products.filter((p) => p.quantity > 0).length === 0
                        }
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة منتج
                      </Button>
                    </div>

                    {saleData.selectedItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>لم يتم اختيار أي منتجات</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {saleData.selectedItems.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="col-span-5">
                              <Select
                                value={item.productId}
                                onValueChange={(value) =>
                                  updateSaleItem(index, "productId", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر منتج" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products
                                    .filter((p) => p.quantity > 0)
                                    .map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id}
                                      >
                                        {product.name} (متوفر:{" "}
                                        {product.quantity})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="الكمية"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateSaleItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                min="1"
                                max={
                                  products.find((p) => p.id === item.productId)
                                    ?.quantity || 1
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="السعر"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateSaleItem(
                                    index,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                              {(item.quantity * item.unitPrice).toFixed(2)} ر.س
                            </div>
                            <div className="col-span-1">
                              <Button
                                onClick={() => removeSaleItem(index)}
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {saleData.selectedItems.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span>الإجمالي:</span>
                          <span>{getTotalPrice().toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleCreateSale}
                        disabled={
                          !saleData.memberId ||
                          saleData.selectedItems.length === 0
                        }
                        className="gym-button flex-1"
                      >
                        تأكيد البيع
                      </Button>
                      <Button
                        onClick={() => {
                          setSaleData({ memberId: "", selectedItems: [] });
                          setIsSaleDialogOpen(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sales History */}
            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  سجل المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length > 0 ? (
                  <div className="space-y-4">
                    {sales.map((sale) => {
                      const member = members.find(
                        (m) => m.id === sale.subscriber_id,
                      );
                      const saleDetails = getSaleDetails(sale.id);

                      return (
                        <Card key={sale.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">
                                    {member?.name || "عضو محذوف"}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(sale.date)}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-lg">
                                {sale.total_price.toFixed(2)} ر.س
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {saleDetails.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-sm border-t pt-2"
                                >
                                  <span>
                                    {item.product?.name || "منتج محذوف"} ×{" "}
                                    {item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    {(item.quantity * item.unit_price).toFixed(
                                      2,
                                    )}{" "}
                                    ر.س
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      لا توجد مبيعات
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ابدأ بإضافة أول عملية بيع
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Products;
