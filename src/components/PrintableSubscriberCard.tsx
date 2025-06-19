import { SubscriberWithGroups } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PrintableSubscriberCardProps {
  subscriber: SubscriberWithGroups;
}

export default function PrintableSubscriberCard({
  subscriber,
}: PrintableSubscriberCardProps) {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd MMMM yyyy", { locale: ar });
  const formattedTime = format(currentDate, "HH:mm", { locale: ar });

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
          line-height: 1.5;
        }

        .print-page {
          width: 21cm;
          min-height: 29.7cm;
          padding: 1.5cm;
          margin: 0 auto;
          background: white;
          position: relative;
        }

        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2cm;
          border-bottom: 4px solid #f97316;
          padding-bottom: 1cm;
        }

        .logo {
          width: 4cm;
          height: 4cm;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2.5cm;
          font-weight: bold;
          box-shadow: 0 0.5cm 1cm rgba(249, 115, 22, 0.3);
        }

        .title-section {
          text-align: center;
          flex: 1;
        }

        .main-title {
          font-size: 2.2cm;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5cm;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .subtitle {
          font-size: 1cm;
          color: #666;
          font-weight: 500;
        }

        .date-section {
          text-align: left;
          color: #666;
          font-size: 0.8cm;
          border: 2px solid #e5e7eb;
          padding: 0.8cm;
          border-radius: 0.5cm;
          background: #f9fafb;
        }

        .date-label {
          font-weight: 600;
          margin-bottom: 0.3cm;
        }

        /* Subscriber Info Section */
        .subscriber-info {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border: 3px solid #cbd5e1;
          border-radius: 1cm;
          padding: 1.5cm;
          margin-bottom: 2cm;
          box-shadow: 0 0.5cm 1cm rgba(0, 0, 0, 0.05);
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1cm;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.7cm;
          padding: 0.5cm;
          background: white;
          border-radius: 0.5cm;
          border: 1px solid #e5e7eb;
        }

        .info-icon {
          width: 1cm;
          height: 1cm;
          background: #f97316;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.5cm;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.8cm;
          display: block;
          margin-bottom: 0.2cm;
        }

        .info-value {
          color: #1a1a1a;
          font-size: 1cm;
          font-weight: 500;
        }

        /* Section Titles */
        .section-title {
          font-size: 1.4cm;
          font-weight: 700;
          color: white;
          margin: 2cm 0 1.5cm 0;
          padding: 0.8cm 1.5cm;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          border-radius: 0.8cm;
          text-align: center;
          box-shadow: 0 0.3cm 0.8cm rgba(249, 115, 22, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8cm;
        }

        .section-icon {
          width: 1.2cm;
          height: 1.2cm;
        }

        /* Groups Container */
        .groups-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.2cm;
        }

        .group-card {
          background: white;
          border: 3px solid #e5e7eb;
          border-radius: 1cm;
          padding: 1.2cm;
          box-shadow: 0 0.3cm 0.8cm rgba(0, 0, 0, 0.1);
          page-break-inside: avoid;
        }

        .group-title {
          font-size: 1.1cm;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1cm;
          padding-bottom: 0.5cm;
          border-bottom: 2px solid #f97316;
          text-align: center;
          background: linear-gradient(135deg, #fef3e2, #fed7aa);
          padding: 0.8cm;
          border-radius: 0.5cm;
          margin: -0.2cm -0.2cm 1cm -0.2cm;
        }

        .group-items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8cm;
        }

        .group-item {
          display: flex;
          align-items: center;
          gap: 0.5cm;
          padding: 0.5cm;
          background: #f9fafb;
          border-radius: 0.5cm;
          border: 1px solid #e5e7eb;
          font-size: 0.9cm;
          font-weight: 500;
        }

        .item-bullet {
          width: 0.4cm;
          height: 0.4cm;
          background: #f97316;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
        }

        /* Notes Section */
        .notes-section {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 3px solid #f59e0b;
          border-radius: 1cm;
          padding: 1.5cm;
          margin-top: 2cm;
          page-break-inside: avoid;
        }

        .notes-title {
          font-size: 1.2cm;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 0.8cm;
          display: flex;
          align-items: center;
          gap: 0.5cm;
        }

        .notes-content {
          color: #1a1a1a;
          font-size: 0.9cm;
          line-height: 1.6;
          background: white;
          padding: 1cm;
          border-radius: 0.5cm;
          border: 1px solid #f59e0b;
        }

        /* Footer */
        .footer {
          position: fixed;
          bottom: 1cm;
          left: 1.5cm;
          right: 1.5cm;
          text-align: center;
          font-size: 0.7cm;
          color: #666;
          border-top: 2px solid #e5e7eb;
          padding-top: 0.5cm;
          background: white;
        }

        .footer-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.2cm;
        }

        /* Print Specific Rules */
        @media print {
          .print-page {
            width: 100%;
            padding: 1.5cm;
            margin: 0;
          }

          .group-card {
            page-break-inside: avoid;
            margin-bottom: 1cm;
          }

          .section-title {
            page-break-after: avoid;
          }

          .notes-section {
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>

      <div className="print-page">
        {/* Header */}
        <div className="header">
          <div className="logo">🏋️</div>

          <div className="title-section">
            <h1 className="main-title">خطة المشترك</h1>
            <p className="subtitle">صالة حسام لكمال الأجسام والرشاقة</p>
          </div>

          <div className="date-section">
            <div className="date-label">تاريخ الطباعة</div>
            <div>{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        </div>

        {/* Subscriber Information */}
        <div className="subscriber-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <span className="info-label">الاسم الكامل</span>
                <div className="info-value">{subscriber.name}</div>
              </div>
            </div>

            {subscriber.age && (
              <div className="info-item">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <span className="info-label">العمر</span>
                  <div className="info-value">{subscriber.age} سنة</div>
                </div>
              </div>
            )}

            {subscriber.weight && (
              <div className="info-item">
                <div className="info-icon">⚖️</div>
                <div className="info-content">
                  <span className="info-label">الوزن</span>
                  <div className="info-value">{subscriber.weight} كج</div>
                </div>
              </div>
            )}

            {subscriber.height && (
              <div className="info-item">
                <div className="info-icon">📏</div>
                <div className="info-content">
                  <span className="info-label">الطول</span>
                  <div className="info-value">{subscriber.height} سم</div>
                </div>
              </div>
            )}

            {subscriber.phone && (
              <div className="info-item">
                <div className="info-icon">📱</div>
                <div className="info-content">
                  <span className="info-label">رقم الهاتف</span>
                  <div className="info-value">{subscriber.phone}</div>
                </div>
              </div>
            )}

            <div className="info-item">
              <div className="info-icon">📋</div>
              <div className="info-content">
                <span className="info-label">تاريخ الاشتراك</span>
                <div className="info-value">
                  {format(new Date(subscriber.created_at), "dd MMMM yyyy", {
                    locale: ar,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Groups Section */}
        {subscriber.courseGroups && subscriber.courseGroups.length > 0 && (
          <>
            <div className="section-title">
              <span className="section-icon">🏋️</span>
              خطة التدريب
            </div>

            <div className="groups-container">
              {subscriber.courseGroups.map((group, index) => (
                <div key={index} className="group-card">
                  <h3 className="group-title">
                    {group.title || `مجموعة تمارين ${index + 1}`}
                  </h3>

                  {group.items && group.items.length > 0 && (
                    <div className="group-items">
                      {group.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="group-item">
                          <div className="item-bullet"></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!group.items || group.items.length === 0) && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#666",
                        fontSize: "0.8cm",
                      }}
                    >
                      لا توجد تمارين محددة
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Diet Groups Section */}
        {subscriber.dietGroups && subscriber.dietGroups.length > 0 && (
          <>
            <div className="section-title">
              <span className="section-icon">🍎</span>
              الخطة الغذائية
            </div>

            <div className="groups-container">
              {subscriber.dietGroups.map((group, index) => (
                <div key={index} className="group-card">
                  <h3 className="group-title">
                    {group.title || `مجموعة غذائية ${index + 1}`}
                  </h3>

                  {group.items && group.items.length > 0 && (
                    <div className="group-items">
                      {group.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="group-item">
                          <div className="item-bullet"></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!group.items || group.items.length === 0) && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#666",
                        fontSize: "0.8cm",
                      }}
                    >
                      لا توجد عناصر غذائية محددة
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes Section */}
        {subscriber.notes && (
          <div className="notes-section">
            <h3 className="notes-title">📝 ملاحظات إضافية</h3>
            <div className="notes-content">{subscriber.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="footer-title">صالة حسام لكمال الأجسام والرشاقة</div>
          <div>تم إنشاء هذه الخطة بواسطة نظام إدارة الصالة المتطور</div>
        </div>
      </div>
    </>
  );
}
