import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer, Download } from "lucide-react";
import { getSales } from "@/lib/database-offline";
import { Sale } from "@/lib/types-new";
import InvoicePrintCard from "@/components/InvoicePrintCard";

export default function PrintInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSale = async () => {
      if (!id) {
        setError("معرف الفاتورة غير موجود");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // جلب جميع المبيعات والبحث عن المبيعة المطلوبة
        const sales = await getSales();
        const foundSale = sales.find((s) => s.id === id);

        if (!foundSale) {
          setError("الفاتورة غير موجودة");
        } else {
          setSale(foundSale);
        }
      } catch (error) {
        console.error("Error loading sale:", error);
        setError(
          error instanceof Error ? error.message : "خطأ في تحميل الفاتورة",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSale();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    navigate("/dashboard/inventory");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            جاري تحميل الفاتورة...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "الفاتورة غير موجودة"}
          </h2>
          <p className="text-gray-600 mb-6">
            تعذر العثور على الفاتورة المطلوبة
          </p>
          <Button
            onClick={handleGoBack}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة ��لمخزون
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">طباعة الفاتورة</h1>
            <p className="text-gray-600">
              فاتورة رقم: INV-{sale.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </div>

      {/* Print Preview */}
      <div className="print:p-0 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="print:shadow-none shadow-lg">
            <InvoicePrintCard sale={sale} />
          </div>
        </div>
      </div>

      {/* Print Instructions - Hidden when printing */}
      <div className="print:hidden max-w-4xl mx-auto px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 تعليمات الطباعة
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• تأكد من تعيين حجم الورق إلى A4</li>
            <li>• استخدم الاتجاه العمودي (Portrait)</li>
            <li>• قم بإزالة رؤوس وتذييلات الصفحة في إعدادات الطباعة</li>
            <li>• للحصول على أفضل جودة، استخدم طابعة ليزر</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
