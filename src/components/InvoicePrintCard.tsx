import { Sale } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface InvoicePrintCardProps {
  sale: Sale;
  invoiceNumber?: string;
}

export default function InvoicePrintCard({
  sale,
  invoiceNumber,
}: InvoicePrintCardProps) {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd/MM/yyyy", { locale: ar });
  const formattedTime = format(currentDate, "HH:mm", { locale: ar });
  const saleDate = format(new Date(sale.created_at), "dd/MM/yyyy - HH:mm", {
    locale: ar,
  });

  // رقم الفاتورة - إما المرسل أو تلقائي بناءً على ID
  const displayInvoiceNumber =
    invoiceNumber || `INV-${sale.id.slice(-8).toUpperCase()}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Cairo', Arial, sans-serif;
          direction: rtl;
          background: white;
          color: #1a1a1a;
          line-height: 1.4;
        }

        .invoice-page {
          width: 21cm;
          height: 29.7cm;
          padding: 0.8cm;
          margin: 0 auto;
          background: white;
          font-size: 10px;
          position: relative;
        }

        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1cm;
          border-bottom: 3px solid #f97316;
          padding-bottom: 0.5cm;
        }

        .logo {
          width: 3.5cm;
          height: 3.5cm;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          border: 4px solid #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .title-section {
          text-align: center;
          flex: 1;
          margin: 0 1cm;
        }

        .main-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.15cm;
        }

        .subtitle {
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }

        .invoice-info {
          text-align: left;
          font-size: 12px;
          color: #333;
          flex-shrink: 0;
        }

        .invoice-number {
          font-size: 13px;
          font-weight: 700;
          color: #f97316;
          margin-bottom: 0.15cm;
        }

        /* Invoice Details Section */
        .invoice-details {
          margin-bottom: 1cm;
          background: #f8f9fa;
          padding: 0.5cm;
          border-radius: 0.2cm;
          border: 1px solid #e9ecef;
        }

        .invoice-details-title {
          font-size: 13px;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.3cm;
          text-align: center;
          background: #f97316;
          color: white;
          padding: 0.2cm;
          border-radius: 0.15cm;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5cm;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3cm 0;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-label {
          font-weight: 600;
          color: #495057;
        }

        .detail-value {
          font-weight: 500;
          color: #212529;
        }

        /* Product Details Table */
        .product-section {
          margin-bottom: 1.5cm;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5cm;
          padding: 0.3cm 0.5cm;
          background: #f1f3f4;
          border-right: 4px solid #f97316;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          border: 1px solid #f97316;
          border-radius: 0.2cm;
          overflow: hidden;
        }

        .product-table th {
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white;
          padding: 0.3cm;
          font-weight: 700;
          text-align: center;
          font-size: 11px;
        }

        .product-table td {
          padding: 0.3cm;
          border-bottom: 1px solid #dee2e6;
          text-align: center;
          background: #fff;
        }

        .product-table tbody tr:nth-child(even) td {
          background: #f8f9fa;
        }

        .product-name {
          font-weight: 600;
          color: #495057;
        }

        .price {
          font-weight: 600;
          color: #28a745;
        }

        .total-price {
          font-weight: 700;
          color: #dc3545;
          font-size: 15px;
        }

        /* Total Section */
        .total-section {
          margin-top: 1cm;
          text-align: left;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          color: white;
          padding: 0.8cm;
          border-radius: 0.3cm;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .total-label {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 0.2cm;
        }

        .total-amount {
          font-size: 24px;
          font-weight: 700;
        }

        /* Notes Section */
        .notes-section {
          margin-top: 1cm;
          padding: 0.5cm;
          background: #fff5f0;
          border: 2px solid #fed7aa;
          border-radius: 0.3cm;
        }

        .notes-title {
          font-size: 14px;
          font-weight: 600;
          color: #c2410c;
          margin-bottom: 0.3cm;
        }

        .notes-content {
          font-size: 12px;
          line-height: 1.5;
          color: #7c2d12;
        }

        /* Footer */
        .footer {
          position: absolute;
          bottom: 1cm;
          left: 1cm;
          right: 1cm;
          text-align: center;
          font-size: 11px;
          color: #666;
          border-top: 2px solid #f97316;
          padding-top: 0.5cm;
        }

        .footer-company {
          font-weight: 700;
          color: #f97316;
          margin-bottom: 0.2cm;
        }

        .footer-note {
          color: #999;
        }

        /* Print Specific Rules */
        @media print {
          .invoice-page {
            width: 100%;
            height: 100%;
            padding: 1cm;
            margin: 0;
            font-size: 12px;
          }

          @page {
            size: A4;
            margin: 1cm;
          }

          /* تأكد من عدم التقطيع */
          .invoice-details,
          .product-section,
          .total-section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="invoice-page">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <img
              src="https://cdn.builder.io/api/v1/assets/2588f577b82044578fea89b6edd936a7/photo_2025-06-17_16-27-55-4f2f56?format=webp&width=800"
              alt="شعار صالة حسام"
            />
          </div>

          <div className="title-section">
            <h1 className="main-title">🧾 فاتورة مبيعات</h1>
            <p className="subtitle">صالة حسام لكمال الأجسام والرشاقة</p>
          </div>

          <div className="invoice-info">
            <div className="invoice-number">#{displayInvoiceNumber}</div>
            <div>تاريخ الطباعة: {formattedDate}</div>
            <div>الوقت: {formattedTime}</div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="invoice-details">
          <div className="invoice-details-title">📋 تفاصيل العملية</div>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">👤 اسم المشتري:</span>
              <span className="detail-value">{sale.buyer_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📅 تاريخ البيع:</span>
              <span className="detail-value">{saleDate}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">🏷️ رقم الفاتورة:</span>
              <span className="detail-value">{displayInvoiceNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">🕐 وقت الطباعة:</span>
              <span className="detail-value">
                {formattedDate} - {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="product-section">
          <h2 className="section-title">��� تفاصيل المنتج</h2>
          <table className="product-table">
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="product-name">{sale.product_name}</td>
                <td>{sale.quantity} قطعة</td>
                <td className="price">{sale.unit_price.toFixed(0)} د.ع</td>
                <td className="total-price">
                  {sale.total_price.toFixed(0)} د.ع
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Section */}
        <div className="total-section">
          <div className="total-label">💰 إجمالي المبلغ المستحق:</div>
          <div className="total-amount">
            {sale.total_price.toFixed(0)} دينار عراقي
          </div>
        </div>

        {/* Notes Section */}
        {sale.notes && (
          <div className="notes-section">
            <div className="notes-title">📝 ملاحظات</div>
            <div className="notes-content">{sale.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="footer-company">صالة حسام لكمال الأجسام والرشاقة</div>
          <div className="footer-note">
            شكراً لثقتكم بنا | تم إنشاء هذه الفاتورة بواسطة نظام إدارة الصالة
          </div>
        </div>
      </div>
    </>
  );
}
