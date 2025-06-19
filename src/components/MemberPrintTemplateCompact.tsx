import { SubscriberWithGroups } from "@/lib/gym-types";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface MemberPrintTemplateCompactProps {
  member: SubscriberWithGroups;
}

export default function MemberPrintTemplateCompact({
  member,
}: MemberPrintTemplateCompactProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate if we need multiple pages
  const totalCourses = member.course_groups.length;
  const totalDiets = member.diet_groups.length;
  const totalItems =
    member.course_groups.reduce((sum, group) => sum + group.items.length, 0) +
    member.diet_groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="print-container">
      {/* Print Button - Hidden during print */}
      <div className="no-print mb-4 text-center">
        <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
          <Printer className="w-4 h-4 ml-2" />
          طباعة الورقة
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          سيتم طباعة {Math.ceil((totalCourses + totalDiets + 10) / 25)} صفحة حسب
          الحاجة
        </p>
      </div>

      {/* Print Content */}
      <div className="print-content" dir="rtl">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="logo-section">
              <img
                src="https://cdn.builder.io/api/v1/assets/f91a990b079c48309bb2a3ebf32314b6/photo_2025-06-17_16-27-55-183bb1?format=webp&width=120"
                alt="شعار صالة حسام"
                className="gym-logo-img"
              />
            </div>
            <div className="title-section">
              <h1 className="main-title">صالة حسام لكمال الأجسام</h1>
              <h2 className="sub-title">خطة المشترك</h2>
              <p className="subtitle">برنامج تدريبي وغذائي متكامل</p>
            </div>
            <div className="date-section">
              <p className="print-date">تاريخ الطباعة:</p>
              <p className="date-value">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Member Info Section */}
        <div className="member-info-section">
          <h2 className="section-title">📋 معلومات المشترك</h2>
          <div className="info-grid">
            <div className="info-row">
              <div className="info-item">
                <span className="label">الاسم:</span>
                <span className="value">{member.name}</span>
              </div>
              <div className="info-item">
                <span className="label">العمر:</span>
                <span className="value">{member.age} سنة</span>
              </div>
              <div className="info-item">
                <span className="label">الوزن:</span>
                <span className="value">{member.weight} كيلو</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <span className="label">الطول:</span>
                <span className="value">{member.height} سم</span>
              </div>
              <div className="info-item">
                <span className="label">الهاتف:</span>
                <span className="value">{member.phone}</span>
              </div>
              <div className="info-item">
                <span className="label">تاريخ الاشتراك:</span>
                <span className="value">{formatDate(member.created_at)}</span>
              </div>
            </div>
          </div>
          {member.notes && (
            <div className="notes-section">
              <span className="label">الملاحظات:</span>
              <span className="value">{member.notes}</span>
            </div>
          )}
        </div>

        {/* Courses Section */}
        <div className="courses-section">
          <h2 className="section-title">
            🏋️ الكورسات والتمارين ({member.course_groups.length} مجموعة)
          </h2>
          {member.course_groups.length === 0 ? (
            <p className="empty-message">لا توجد كورسات مضافة</p>
          ) : (
            <div className="courses-table">
              <div className="table-header">
                <div className="col-header day-col">اليوم/المجموعة</div>
                <div className="col-header exercises-col">التمارين</div>
                <div className="col-header count-col">العدد</div>
              </div>
              {member.course_groups.map((group, index) => (
                <div key={group.id} className="table-row">
                  <div className="col-content day-col">
                    <strong>{group.title || `اليوم ${index + 1}`}</strong>
                    <small className="date-small">
                      {formatDate(group.created_at)}
                    </small>
                  </div>
                  <div className="col-content exercises-col">
                    {group.items.map((item, itemIndex) => (
                      <span key={item.id} className="exercise-item">
                        {itemIndex + 1}. {item.name}
                        {itemIndex < group.items.length - 1 ? " • " : ""}
                      </span>
                    ))}
                  </div>
                  <div className="col-content count-col">
                    <span className="count-badge">{group.items.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diet Section */}
        <div className="diet-section">
          <h2 className="section-title">
            🍎 النظام الغذائي ({member.diet_groups.length} مجموعة)
          </h2>
          {member.diet_groups.length === 0 ? (
            <p className="empty-message">لا توجد أنظمة غذائية مضافة</p>
          ) : (
            <div className="diet-table">
              <div className="table-header">
                <div className="col-header meal-col">الوقت/الوجبة</div>
                <div className="col-header foods-col">العناصر الغذائية</div>
                <div className="col-header count-col">العدد</div>
              </div>
              {member.diet_groups.map((group, index) => (
                <div key={group.id} className="table-row">
                  <div className="col-content meal-col">
                    <strong>{group.title || `وجبة ${index + 1}`}</strong>
                    <small className="date-small">
                      {formatDate(group.created_at)}
                    </small>
                  </div>
                  <div className="col-content foods-col">
                    {group.items.map((item, itemIndex) => (
                      <span key={item.id} className="food-item">
                        {itemIndex + 1}. {item.name}
                        {itemIndex < group.items.length - 1 ? " • " : ""}
                      </span>
                    ))}
                  </div>
                  <div className="col-content count-col">
                    <span className="count-badge">{group.items.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">إجمالي مجموعات التمارين:</span>
              <span className="summary-value">
                {member.course_groups.length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                إجمالي مجموعات الأنظمة الغذائية:
              </span>
              <span className="summary-value">{member.diet_groups.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                إجمالي التمارين والعناصر الغذائية:
              </span>
              <span className="summary-value">{totalItems}</span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="footer-section">
          <div className="footer-line"></div>
          <div className="footer-content">
            <div className="signature-section">
              <p className="signature-label">توقيع المدرب:</p>
              <div className="signature-line"></div>
            </div>
            <div className="contact-section">
              <p className="footer-note">
                للاستفسارات والمتابعة: صالة حسام الرياضية لكمال ا��أجسام
                والرشاقة
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Print styles - Hidden during normal view */
        @media print {
          * {
            box-sizing: border-box;
          }

          .no-print {
            display: none !important;
          }

          body {
            font-family: "Cairo", "Amiri", "Segoe UI", Tahoma, Geneva, Verdana,
              sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }

          .print-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 auto !important;
            padding: 15mm !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
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
            gap: 20px !important;
          }

          .gym-logo-img {
            width: 80px !important;
            height: 80px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            border: 3px solid #f97316 !important;
          }

          .title-section {
            text-align: center !important;
            flex: 1 !important;
          }

          .main-title {
            font-size: 18px !important;
            font-weight: bold !important;
            color: #1f2937 !important;
            margin: 0 0 5px 0 !important;
          }

          .sub-title {
            font-size: 16px !important;
            font-weight: bold !important;
            color: #f97316 !important;
            margin: 0 0 3px 0 !important;
          }

          .subtitle {
            font-size: 12px !important;
            color: #6b7280 !important;
            margin: 0 !important;
          }

          .date-section {
            text-align: left !important;
            font-size: 10px !important;
            color: #6b7280 !important;
          }

          .print-date {
            margin: 0 !important;
            font-weight: 600 !important;
          }

          .date-value {
            margin: 2px 0 0 0 !important;
          }

          .member-info-section,
          .courses-section,
          .diet-section,
          .summary-section {
            margin-bottom: 15px !important;
            page-break-inside: avoid !important;
          }

          .section-title {
            font-size: 14px !important;
            font-weight: bold !important;
            color: #374151 !important;
            margin-bottom: 8px !important;
            padding: 5px 0 !important;
            border-bottom: 1px solid #d1d5db !important;
          }

          .info-grid {
            display: block !important;
          }

          .info-row {
            display: flex !important;
            gap: 20px !important;
            margin-bottom: 5px !important;
          }

          .info-item {
            flex: 1 !important;
            display: flex !important;
            gap: 5px !important;
          }

          .label {
            font-weight: 600 !important;
            color: #4b5563 !important;
            min-width: 50px !important;
            font-size: 10px !important;
          }

          .value {
            color: #1f2937 !important;
            font-size: 10px !important;
          }

          .notes-section {
            margin-top: 8px !important;
            display: flex !important;
            gap: 5px !important;
            font-size: 10px !important;
          }

          .courses-table,
          .diet-table {
            border: 1px solid #d1d5db !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            margin-bottom: 10px !important;
          }

          .table-header {
            display: flex !important;
            background-color: #f3f4f6 !important;
            font-weight: 600 !important;
            border-bottom: 1px solid #d1d5db !important;
            font-size: 10px !important;
          }

          .table-row {
            display: flex !important;
            border-bottom: 1px solid #e5e7eb !important;
            page-break-inside: avoid !important;
          }

          .table-row:last-child {
            border-bottom: none !important;
          }

          .col-header,
          .col-content {
            padding: 6px 8px !important;
            border-left: 1px solid #e5e7eb !important;
            vertical-align: top !important;
          }

          .col-header:last-child,
          .col-content:last-child {
            border-left: none !important;
          }

          .day-col,
          .meal-col {
            width: 25% !important;
            min-width: 25% !important;
          }

          .exercises-col,
          .foods-col {
            width: 65% !important;
            min-width: 65% !important;
          }

          .count-col {
            width: 10% !important;
            min-width: 10% !important;
            text-align: center !important;
          }

          .date-small {
            display: block !important;
            font-size: 8px !important;
            color: #9ca3af !important;
            margin-top: 2px !important;
          }

          .exercise-item,
          .food-item {
            font-size: 9px !important;
            line-height: 1.2 !important;
          }

          .count-badge {
            background-color: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 3px !important;
            padding: 2px 6px !important;
            font-size: 8px !important;
            font-weight: bold !important;
          }

          .empty-message {
            text-align: center !important;
            color: #6b7280 !important;
            font-style: italic !important;
            padding: 15px !important;
            background-color: #f9fafb !important;
            border: 1px dashed #d1d5db !important;
            border-radius: 4px !important;
            font-size: 10px !important;
          }

          .summary-section {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 4px !important;
            padding: 10px !important;
            margin: 15px 0 !important;
          }

          .summary-content {
            display: flex !important;
            justify-content: space-around !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          .summary-item {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }

          .summary-label {
            font-size: 9px !important;
            color: #6b7280 !important;
            margin-bottom: 2px !important;
          }

          .summary-value {
            font-size: 14px !important;
            font-weight: bold !important;
            color: #f97316 !important;
          }

          .footer-section {
            margin-top: 20px !important;
            padding-top: 15px !important;
            page-break-inside: avoid !important;
          }

          .footer-line {
            height: 1px !important;
            background-color: #d1d5db !important;
            margin-bottom: 10px !important;
          }

          .footer-content {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .signature-section {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }

          .signature-label {
            font-weight: 600 !important;
            color: #4b5563 !important;
            margin: 0 !important;
            font-size: 10px !important;
          }

          .signature-line {
            width: 80px !important;
            height: 1px !important;
            border-bottom: 1px solid #6b7280 !important;
          }

          .footer-note {
            font-size: 9px !important;
            color: #6b7280 !important;
            margin: 0 !important;
            text-align: left !important;
          }
        }

        /* Screen styles */
        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          font-family: "Cairo", "Amiri", "Segoe UI", Tahoma, Geneva, Verdana,
            sans-serif;
        }

        .print-content {
          padding: 20px;
          font-size: 13px;
          line-height: 1.5;
          color: #333;
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
          gap: 20px;
        }

        .gym-logo-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #f97316;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .title-section {
          text-align: center;
          flex: 1;
        }

        .main-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .sub-title {
          font-size: 20px;
          font-weight: bold;
          color: #f97316;
          margin: 0 0 4px 0;
        }

        .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .date-section {
          text-align: left;
          font-size: 12px;
          color: #6b7280;
        }

        .print-date {
          margin: 0;
          font-weight: 600;
        }

        .date-value {
          margin: 4px 0 0 0;
        }

        .member-info-section,
        .courses-section,
        .diet-section,
        .summary-section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #d1d5db;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-row {
          display: flex;
          gap: 20px;
        }

        .info-item {
          flex: 1;
          display: flex;
          gap: 8px;
        }

        .label {
          font-weight: 600;
          color: #4b5563;
          min-width: 70px;
        }

        .value {
          color: #1f2937;
        }

        .notes-section {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .courses-table,
        .diet-table {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .table-header {
          display: flex;
          background-color: #f3f4f6;
          font-weight: 600;
          border-bottom: 1px solid #d1d5db;
        }

        .table-row {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .col-header,
        .col-content {
          padding: 10px 12px;
          border-left: 1px solid #e5e7eb;
          vertical-align: top;
        }

        .col-header:last-child,
        .col-content:last-child {
          border-left: none;
        }

        .day-col,
        .meal-col {
          width: 25%;
          min-width: 25%;
        }

        .exercises-col,
        .foods-col {
          width: 65%;
          min-width: 65%;
        }

        .count-col {
          width: 10%;
          min-width: 10%;
          text-align: center;
        }

        .date-small {
          display: block;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .exercise-item,
        .food-item {
          font-size: 13px;
          line-height: 1.4;
        }

        .count-badge {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          color: #374151;
        }

        .empty-message {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 20px;
          background-color: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
        }

        .summary-section {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .summary-content {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 15px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .summary-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #f97316;
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
          align-items: center;
          gap: 15px;
        }

        .signature-label {
          font-weight: 600;
          color: #4b5563;
          margin: 0;
        }

        .signature-line {
          width: 120px;
          height: 1px;
          border-bottom: 1px solid #6b7280;
        }

        .footer-note {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .info-row {
            flex-direction: column;
            gap: 8px;
          }

          .footer-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .summary-content {
            flex-direction: column;
            gap: 10px;
          }

          .table-header,
          .table-row {
            flex-direction: column;
          }

          .col-header,
          .col-content {
            border-left: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .col-header:last-child,
          .col-content:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}
