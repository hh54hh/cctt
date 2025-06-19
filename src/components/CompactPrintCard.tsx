import { SubscriberWithGroups } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CompactPrintCardProps {
  subscriber: SubscriberWithGroups;
}

export default function CompactPrintCard({
  subscriber,
}: CompactPrintCardProps) {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd/MM/yyyy", { locale: ar });

  // تنسيق التمارين مع نقاط مميزة
  const formatExercisesList = (items: any[]) => {
    return items.map((item, index) => (
      <span key={index} className="item-point">
        {item.name}
      </span>
    ));
  };

  // تنسيق العناصر الغذائية مع نقاط مميزة
  const formatDietList = (items: any[]) => {
    return items.map((item, index) => (
      <span key={index} className="item-point">
        {item.name}
      </span>
    ));
  };

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
          line-height: 1.3;
        }

        .compact-page {
          width: 21cm;
          height: 29.7cm;
          padding: 1cm;
          margin: 0 auto;
          background: white;
          font-size: 12px;
          position: relative;
        }

        /* Header Section - مضغوط */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8cm;
          border-bottom: 2px solid #333;
          padding-bottom: 0.3cm;
        }

        .logo {
          width: 3cm;
          height: 3cm;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
          margin-bottom: 0.2cm;
        }

        .subtitle {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .date-section {
          text-align: left;
          font-size: 11px;
          color: #666;
          flex-shrink: 0;
        }

        /* معلومات المشترك - جدول مضغوط */
        .info-section {
          margin-bottom: 0.8cm;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .info-table td {
          padding: 0.2cm 0.3cm;
          border: 1px solid #ddd;
          vertical-align: top;
        }

        .info-label {
          font-weight: 600;
          background: #f5f5f5;
          width: 20%;
          text-align: right;
        }

        .info-value {
          text-align: right;
          width: 30%;
        }

        /* أقسام الكورسات والغذاء */
        .section {
          margin-bottom: 0.8cm;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.3cm;
          padding: 0.2cm 0.5cm;
          background: #f0f0f0;
          border-right: 4px solid #f97316;
        }

        .content-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .content-table th {
          background: #f8f8f8;
          padding: 0.2cm 0.3cm;
          border: 1px solid #ddd;
          font-weight: 600;
          text-align: right;
          font-size: 12px;
        }

        .content-table td {
          padding: 0.2cm 0.3cm;
          border: 1px solid #ddd;
          vertical-align: top;
          text-align: right;
          line-height: 1.5;
        }

        .group-title-cell {
          font-weight: 600;
          background: #f0f9ff;
          width: 25%;
          border-left: 3px solid #f97316;
        }

        .items-cell {
          width: 75%;
          background: #fefefe;
        }

        .items-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.1cm 0.3cm;
          align-items: center;
        }

        .item-point {
          display: inline-flex;
          align-items: center;
          background: #fff5f0;
          border: 1px solid #fed7aa;
          border-radius: 0.2cm;
          padding: 0.1cm 0.2cm;
          font-size: 10px;
          font-weight: 500;
          color: #c2410c;
          position: relative;
        }

        .item-point::before {
          content: "●";
          color: #f97316;
          font-weight: bold;
          margin-left: 0.1cm;
          font-size: 8px;
        }

        .item-separator {
          color: #d1d5db;
          font-weight: bold;
          margin: 0 0.1cm;
        }

        /* ملاحظات مضغوطة */
        .notes-section {
          margin-top: 0.5cm;
          padding: 0.3cm;
          background: #fffbf0;
          border: 1px solid #f59e0b;
          border-radius: 0.2cm;
        }

        .notes-title {
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.2cm;
        }

        .notes-content {
          font-size: 11px;
          line-height: 1.4;
        }

        /* Footer مضغوط */
        .footer {
          position: absolute;
          bottom: 0.5cm;
          left: 1cm;
          right: 1cm;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 0.2cm;
        }

        /* Print Specific Rules */
        @media print {
          .compact-page {
            width: 100%;
            height: 100%;
            padding: 1cm;
            margin: 0;
            font-size: 12px;
          }

          .content-table tr {
            page-break-inside: avoid;
          }

          .section {
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 1cm;
          }

          /* تأكد من عدم التقطيع */
          .info-section,
          .section {
            page-break-inside: avoid;
          }
        }

        /* إخفاء المحتوى الفارغ */
        .empty-section {
          display: none;
        }
      `}</style>

      <div className="compact-page">
        {/* Header مضغوط */}
        <div className="header">
          <div className="logo">
            <img
              src="https://cdn.builder.io/api/v1/assets/2588f577b82044578fea89b6edd936a7/photo_2025-06-17_16-27-55-4f2f56?format=webp&width=800"
              alt="شعار صالة حسام"
            />
          </div>

          <div className="title-section">
            <h1 className="main-title">خطة المشترك</h1>
            <p className="subtitle">صالة حسام لكمال الأجسام والرشاقة</p>
          </div>

          <div className="date-section">
            <div>تاريخ الطباعة:</div>
            <div>{formattedDate}</div>
          </div>
        </div>

        {/* معلومات المشترك - جدول مضغوط */}
        <div className="info-section">
          <table className="info-table">
            <tbody>
              <tr>
                <td className="info-label">الاسم الكامل</td>
                <td className="info-value">{subscriber.name}</td>
                <td className="info-label">العمر</td>
                <td className="info-value">
                  {subscriber.age ? `${subscriber.age} سنة` : "-"}
                </td>
              </tr>
              <tr>
                <td className="info-label">الوزن</td>
                <td className="info-value">
                  {subscriber.weight ? `${subscriber.weight} كج` : "-"}
                </td>
                <td className="info-label">الطول</td>
                <td className="info-value">
                  {subscriber.height ? `${subscriber.height} سم` : "-"}
                </td>
              </tr>
              <tr>
                <td className="info-label">رقم الهاتف</td>
                <td className="info-value">{subscriber.phone || "-"}</td>
                <td className="info-label">تاريخ الاشتراك</td>
                <td className="info-value">
                  {format(new Date(subscriber.created_at), "dd/MM/yyyy", {
                    locale: ar,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* قسم الكورسات */}
        {subscriber.courseGroups && subscriber.courseGroups.length > 0 && (
          <div className="section">
            <h2 className="section-title">🏋️ برنامج التدريب</h2>
            <table className="content-table">
              <thead>
                <tr>
                  <th>المجموعة / اليوم</th>
                  <th>التمارين</th>
                </tr>
              </thead>
              <tbody>
                {subscriber.courseGroups.map((group, index) => (
                  <tr key={index}>
                    <td className="group-title-cell">
                      {group.title || `مجموعة ${index + 1}`}
                    </td>
                    <td className="items-cell">
                      <div className="items-list">
                        {group.items && group.items.length > 0 ? (
                          formatExercisesList(group.items)
                        ) : (
                          <span
                            style={{ color: "#9ca3af", fontStyle: "italic" }}
                          >
                            لا توجد تمارين محددة
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* قسم النظام الغذائي */}
        {subscriber.dietGroups && subscriber.dietGroups.length > 0 && (
          <div className="section">
            <h2 className="section-title">🍎 النظام الغذائي</h2>
            <table className="content-table">
              <thead>
                <tr>
                  <th>الوقت / الوجبة</th>
                  <th>العناصر الغذائية</th>
                </tr>
              </thead>
              <tbody>
                {subscriber.dietGroups.map((group, index) => (
                  <tr key={index}>
                    <td className="group-title-cell">
                      {group.title || `وجبة ${index + 1}`}
                    </td>
                    <td className="items-cell">
                      <div className="items-list">
                        {group.items && group.items.length > 0 ? (
                          formatDietList(group.items)
                        ) : (
                          <span
                            style={{ color: "#9ca3af", fontStyle: "italic" }}
                          >
                            لا توجد عناصر محددة
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ملاحظات */}
        {subscriber.notes && (
          <div className="notes-section">
            <div className="notes-title">📝 ملاحظات</div>
            <div className="notes-content">{subscriber.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div>
            <strong>صالة حسام لكمال الأجسام والرشاقة</strong> | تم إنشاء هذه
            الخطة بواسطة نظام إدارة الصالة
          </div>
        </div>
      </div>
    </>
  );
}
