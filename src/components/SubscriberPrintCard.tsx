import { SubscriberWithGroups } from "@/lib/types-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dumbbell,
  Apple,
  Calendar,
  User,
  Phone,
  Weight,
  Ruler,
  FileText,
} from "lucide-react";

interface SubscriberPrintCardProps {
  subscriber: SubscriberWithGroups;
}

export default function SubscriberPrintCard({
  subscriber,
}: SubscriberPrintCardProps) {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd MMMM yyyy", { locale: ar });
  const formattedTime = format(currentDate, "HH:mm", { locale: ar });

  return (
    <div className="print-container" dir="rtl">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .print-container {
            width: 21cm;
            min-height: 29.7cm;
            margin: 0;
            padding: 1.5cm;
            font-family: "Cairo", "Tajawal", Arial, sans-serif;
            background: white;
            color: #1a1a1a;
            box-sizing: border-box;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2cm;
            border-bottom: 3px solid #f97316;
            padding-bottom: 1cm;
          }

          .logo-section {
            display: flex;
            align-items: center;
            gap: 1cm;
          }

          .logo-circle {
            width: 4cm;
            height: 4cm;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #f59e0b);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2cm;
          }

          .title-section {
            text-align: center;
          }

          .main-title {
            font-size: 1.8cm;
            font-weight: bold;
            color: #1a1a1a;
            margin: 0;
            line-height: 1.2;
          }

          .subtitle {
            font-size: 0.8cm;
            color: #666;
            margin: 0.3cm 0 0 0;
          }

          .date-section {
            text-align: left;
            color: #666;
            font-size: 0.7cm;
          }

          .subscriber-info {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 1cm;
            padding: 1cm;
            margin-bottom: 1.5cm;
            page-break-inside: avoid;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1cm;
          }

          .info-item {
            display: flex;
            align-items: center;
            gap: 0.5cm;
            margin-bottom: 0.5cm;
          }

          .info-icon {
            width: 0.8cm;
            height: 0.8cm;
            color: #f97316;
          }

          .info-label {
            font-weight: bold;
            color: #374151;
            min-width: 3cm;
          }

          .info-value {
            color: #1a1a1a;
            font-size: 0.9cm;
          }

          .section-title {
            font-size: 1.2cm;
            font-weight: bold;
            color: #1a1a1a;
            margin: 1.5cm 0 1cm 0;
            padding: 0.5cm 1cm;
            background: linear-gradient(135deg, #f97316, #f59e0b);
            color: white;
            border-radius: 0.5cm;
            text-align: center;
            page-break-after: avoid;
          }

          .groups-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1cm;
          }

          .group-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 0.8cm;
            padding: 1cm;
            page-break-inside: avoid;
            margin-bottom: 0.5cm;
          }

          .group-title {
            font-size: 1cm;
            font-weight: bold;
            color: #374151;
            margin-bottom: 0.8cm;
            padding-bottom: 0.5cm;
            border-bottom: 1px solid #e5e7eb;
          }

          .group-items {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5cm;
          }

          .group-item {
            display: flex;
            align-items: center;
            gap: 0.3cm;
            margin-bottom: 0.3cm;
            font-size: 0.8cm;
          }

          .item-bullet {
            width: 0.3cm;
            height: 0.3cm;
            background: #f97316;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .notes-section {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 0.8cm;
            padding: 1cm;
            margin-top: 1.5cm;
            page-break-inside: avoid;
          }

          .notes-title {
            font-size: 1cm;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 0.5cm;
          }

          .notes-content {
            color: #1a1a1a;
            font-size: 0.8cm;
            line-height: 1.4;
          }

          .page-footer {
            position: fixed;
            bottom: 1cm;
            left: 1.5cm;
            right: 1.5cm;
            text-align: center;
            font-size: 0.6cm;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 0.5cm;
          }

          /* Force page breaks for long content */
          .course-section {
            page-break-inside: avoid;
          }

          .diet-section {
            page-break-inside: avoid;
          }

          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }
        }

        /* Screen styles for preview */
        .print-container {
          max-width: 21cm;
          margin: 2rem auto;
          padding: 1.5cm;
          background: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          font-family: "Cairo", "Tajawal", Arial, sans-serif;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div className="logo-section">
          <div className="logo-circle">
            <Dumbbell />
          </div>
        </div>

        <div className="title-section">
          <h1 className="main-title">خطة المشترك</h1>
          <p className="subtitle">صالة حسام لكمال الأجسام والرشاقة</p>
        </div>

        <div className="date-section">
          <div>تاريخ الطباعة</div>
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      </div>

      {/* Subscriber Information */}
      <div className="subscriber-info">
        <div className="info-grid">
          <div className="info-item">
            <User className="info-icon" />
            <span className="info-label">الاسم:</span>
            <span className="info-value">{subscriber.name}</span>
          </div>

          {subscriber.age && (
            <div className="info-item">
              <Calendar className="info-icon" />
              <span className="info-label">العمر:</span>
              <span className="info-value">{subscriber.age} سنة</span>
            </div>
          )}

          {subscriber.weight && (
            <div className="info-item">
              <Weight className="info-icon" />
              <span className="info-label">الوزن:</span>
              <span className="info-value">{subscriber.weight} كج</span>
            </div>
          )}

          {subscriber.height && (
            <div className="info-item">
              <Ruler className="info-icon" />
              <span className="info-label">الطول:</span>
              <span className="info-value">{subscriber.height} سم</span>
            </div>
          )}

          {subscriber.phone && (
            <div className="info-item">
              <Phone className="info-icon" />
              <span className="info-label">الهاتف:</span>
              <span className="info-value">{subscriber.phone}</span>
            </div>
          )}

          <div className="info-item">
            <Calendar className="info-icon" />
            <span className="info-label">تاريخ الاشتراك:</span>
            <span className="info-value">
              {format(new Date(subscriber.created_at), "dd MMMM yyyy", {
                locale: ar,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Course Groups Section */}
      {subscriber.courseGroups && subscriber.courseGroups.length > 0 && (
        <div className="course-section">
          <h2 className="section-title">
            <Dumbbell style={{ display: "inline", marginLeft: "0.5cm" }} />
            خطة التدريب
          </h2>

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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diet Groups Section */}
      {subscriber.dietGroups && subscriber.dietGroups.length > 0 && (
        <div className="diet-section">
          <h2 className="section-title">
            <Apple style={{ display: "inline", marginLeft: "0.5cm" }} />
            الخطة الغذائية
          </h2>

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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {subscriber.notes && (
        <div className="notes-section">
          <h3 className="notes-title">
            <FileText style={{ display: "inline", marginLeft: "0.5cm" }} />
            ملاحظات إضافية
          </h3>
          <div className="notes-content">{subscriber.notes}</div>
        </div>
      )}

      {/* Page Footer */}
      <div className="page-footer">
        <div>صالة حسام لكمال الأجسام والرشاقة</div>
        <div>تم إنشاء هذه الخطة بواسطة نظام إدارة الصالة</div>
      </div>
    </div>
  );
}
