import React from "react";
import { Sale } from "@/lib/types";

interface InvoicePrintTemplateProps {
  sale: Sale;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  sale,
}) => {
  // Provide default values to prevent errors
  const safeSale = {
    id: "",
    buyerName: "غير محدد",
    productId: "",
    productName: "غير محدد",
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    createdAt: new Date(),
    ...sale,
  };

  return (
    <div className="print-container" style={{ display: "none" }}>
      <div
        id="invoice-print-content"
        className="bg-white p-8 font-arabic"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          fontSize: "16px",
          lineHeight: "1.8",
          direction: "rtl",
          fontFamily: "Cairo, Tajawal, Arial, sans-serif",
          backgroundColor: "white",
          color: "#000000",
        }}
      >
        {/* Header - Gym Name Only */}
        <div
          className="text-center mb-12"
          style={{ borderBottom: "3px solid #000000", paddingBottom: "20px" }}
        >
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#000000",
              marginBottom: "16px",
              letterSpacing: "2px",
            }}
          >
            صالة حسام لكمال الأجسام والرشاقة
          </h1>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-8">
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#000000",
              backgroundColor: "#f0f0f0",
              padding: "12px",
              border: "2px solid #000000",
              display: "inline-block",
              borderRadius: "8px",
            }}
          >
            🧾 فاتورة مبيعات
          </h2>
        </div>

        {/* Simple Invoice Details */}
        <div
          className="mb-12"
          style={{
            backgroundColor: "#f9f9f9",
            padding: "30px",
            border: "2px solid #000000",
            borderRadius: "10px",
          }}
        >
          {/* Customer Name */}
          <div className="mb-6" style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000000",
                marginBottom: "12px",
              }}
            >
              👤 اسم العميل
            </h3>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#000000",
                backgroundColor: "white",
                padding: "16px",
                border: "2px solid #000000",
                borderRadius: "8px",
                display: "inline-block",
                minWidth: "300px",
              }}
            >
              {safeSale.buyerName}
            </div>
          </div>

          {/* Product and Price */}
          <div
            className="grid grid-cols-2 gap-8"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginTop: "32px",
            }}
          >
            {/* Product */}
            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#000000",
                  marginBottom: "12px",
                }}
              >
                📦 المنتج
              </h3>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#000000",
                  backgroundColor: "white",
                  padding: "16px",
                  border: "2px solid #000000",
                  borderRadius: "8px",
                }}
              >
                {safeSale.productName}
              </div>
              <div
                style={{ fontSize: "18px", color: "#666666", marginTop: "8px" }}
              >
                الكمية: {safeSale.quantity}
              </div>
            </div>

            {/* Total Price */}
            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#000000",
                  marginBottom: "12px",
                }}
              >
                💰 المبلغ الإجمالي
              </h3>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#000000",
                  backgroundColor: "#e8f5e8",
                  padding: "20px",
                  border: "3px solid #28a745",
                  borderRadius: "8px",
                }}
              >
                {(safeSale.totalPrice || 0).toLocaleString()} د.ع
              </div>
              <div
                style={{ fontSize: "16px", color: "#666666", marginTop: "8px" }}
              >
                سعر الوحدة: {(safeSale.unitPrice || 0).toLocaleString()} د.ع
              </div>
            </div>
          </div>
        </div>

        {/* Date and Invoice Number */}
        <div
          className="grid grid-cols-2 gap-8 mb-12"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              backgroundColor: "#f0f0f0",
              padding: "16px",
              border: "1px solid #000000",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              📅 تاريخ البيع
            </h4>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              {new Date(safeSale.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div
            style={{
              textAlign: "center",
              backgroundColor: "#f0f0f0",
              padding: "16px",
              border: "1px solid #000000",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              🔢 رقم الفاتورة
            </h4>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              #{safeSale.id}
            </p>
          </div>
        </div>

        {/* Thank You Message */}
        <div
          className="text-center mb-8"
          style={{
            backgroundColor: "#e8f4fd",
            padding: "20px",
            border: "2px solid #007bff",
            borderRadius: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#000000",
              marginBottom: "8px",
            }}
          >
            🙏 شكراً لثقتك بنا
          </h3>
          <p style={{ fontSize: "18px", color: "#333333" }}>
            نتطلع لخدمتك مرة أخرى في صالة حسام لكمال الأجسام والرشاقة
          </p>
        </div>

        {/* Footer - Developer Credit */}
        <div
          className="border-t-2 border-black pt-6 mt-8"
          style={{
            borderTop: "2px solid #000000",
            paddingTop: "24px",
            marginTop: "32px",
          }}
        >
          <div className="text-center">
            <p
              style={{ fontSize: "12px", color: "#666666", lineHeight: "1.4" }}
            >
              صمم البرنامج بواسطة حمزه احمد للتواصل واتساب ٠٧٨٠٠٦٥٧٨٢٢
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintTemplate;
