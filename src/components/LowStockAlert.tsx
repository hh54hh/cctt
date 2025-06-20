import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
}

export default function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const products = JSON.parse(localStorage.getItem("gym_products") || "[]");
    const lowStock = products.filter(
      (product: Product) => product.quantity <= product.minQuantity,
    );

    setLowStockProducts(lowStock);
    setShowAlert(lowStock.length > 0);
  }, []);

  if (!showAlert || lowStockProducts.length === 0) {
    return null;
  }

  const outOfStock = lowStockProducts.filter((p) => p.quantity === 0);
  const lowStock = lowStockProducts.filter((p) => p.quantity > 0);

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 max-w-xs sm:max-w-sm z-50">
      <Alert className="border-warning bg-warning/10 shadow-lg text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">تنبيه المخزون</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAlert(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {outOfStock.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-destructive mb-1">
                نفدت الكمية ({outOfStock.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {outOfStock.slice(0, 3).map((product) => (
                  <Badge
                    key={product.id}
                    variant="destructive"
                    className="text-xs"
                  >
                    {product.name}
                  </Badge>
                ))}
                {outOfStock.length > 3 && (
                  <Badge variant="destructive" className="text-xs">
                    +{outOfStock.length - 3} أخرى
                  </Badge>
                )}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div>
              <p className="text-sm font-medium text-warning mb-1">
                كمية قليلة ({lowStock.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {lowStock.slice(0, 3).map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {product.name} ({product.quantity})
                  </Badge>
                ))}
                {lowStock.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{lowStock.length - 3} أخرى
                  </Badge>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            تحقق من صفحة المخزن لمزيد من التفاصيل
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
