import { useState, useEffect } from "react";
import { Plus, ShoppingCart, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { db, Sale, Product } from "@/lib/database";

interface MemberSalesProps {
  memberId: string;
}

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const MemberSales = ({ memberId }: MemberSalesProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    loadSales();
    loadProducts();
  }, [memberId]);

  const loadSales = () => {
    setSales(db.getSalesBySubscriber(memberId));
  };

  const loadProducts = () => {
    setProducts(db.getProducts());
  };

  const addSaleItem = () => {
    setSelectedItems([
      ...selectedItems,
      { productId: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeSaleItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (
    index: number,
    field: keyof SaleItem,
    value: string | number,
  ) => {
    const updated = [...selectedItems];
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
    setSelectedItems(updated);
  };

  const getTotalPrice = () => {
    return selectedItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  };

  const handleCreateSale = async () => {
    if (selectedItems.length === 0) return;

    const totalPrice = getTotalPrice();

    try {
      // Create sale record
      const sale = await db.createSale({
        subscriber_id: memberId,
        total_price: totalPrice,
        date: new Date().toISOString(),
      });

      // Create sale items and update product quantities
      for (const item of selectedItems) {
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
      setSelectedItems([]);
      setIsDialogOpen(false);
      loadSales();
      loadProducts();
    } catch (error) {
      console.error("Error creating sale:", error);
    }
  };

  const handleDeleteSale = (saleId: string) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      try {
        // Get sale items to restore product quantities
        const saleItems = db.getSaleItemsBySale(saleToDelete);

        for (const item of saleItems) {
          const product = products.find((p) => p.id === item.product_id);
          if (product) {
            await db.updateProduct(product.id, {
              quantity: product.quantity + item.quantity,
            });
          }
        }

        // Delete the sale
        await db.deleteSale(saleToDelete);

        loadSales();
        loadProducts();
        setDeleteDialogOpen(false);
        setSaleToDelete(null);
      } catch (error) {
        console.error("Error deleting sale:", error);
      }
    }
  };

  const getSaleDetails = (saleId: string) => {
    const saleItems = db.getSaleItemsBySale(saleId);
    return saleItems.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        ...item,
        product,
      };
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">مشتريات العضو</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gym-button">
              <Plus className="w-4 h-4 ml-1" />
              إضافة عملية بيع
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة عملية بيع جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">المنتجات المحددة:</span>
                <Button
                  onClick={addSaleItem}
                  variant="outline"
                  size="sm"
                  disabled={products.length === 0}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة منتج
                </Button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لم يتم اختيار أي منتجات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
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
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (متوفر: {product.quantity})
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

              {selectedItems.length > 0 && (
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
                  disabled={selectedItems.length === 0}
                  className="gym-button flex-1"
                >
                  تأكيد البيع
                </Button>
                <Button
                  onClick={() => {
                    setSelectedItems([]);
                    setIsDialogOpen(false);
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

      {sales.length > 0 ? (
        <div className="space-y-3">
          {sales.map((sale) => {
            const saleDetails = getSaleDetails(sale.id);

            return (
              <Card key={sale.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDate(sale.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {sale.total_price.toFixed(2)} ر.س
                      </Badge>
                      <Button
                        onClick={() => handleDeleteSale(sale.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {saleDetails.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {item.product?.name || "منتج محذوف"} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {(item.quantity * item.unit_price).toFixed(2)} ر.س
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
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>لا توجد مشتريات سابقة</p>
          <p className="text-sm">ابدأ بإضافة أول عملية بيع</p>
        </div>
      )}

      {/* Delete Sale Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه العملية؟ سيتم إرجاع الكميات إلى المخزن.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
    </div>
  );
};

export default MemberSales;
