import React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SubscriberData {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  phone: string;
  notes?: string;
  created_at: string;
  groups: Array<{
    id: string;
    title?: string;
    type: "course" | "diet";
    group_items: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

interface SubscriberPrintTemplateProps {
  subscriber: SubscriberData;
}

export function SubscriberPrintTemplate({
  subscriber,
}: SubscriberPrintTemplateProps) {
  const courseGroups = subscriber.groups.filter(
    (group) => group.type === "course",
  );
  const dietGroups = subscriber.groups.filter((group) => group.type === "diet");

  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap');
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      @page {
        size: A4;
        margin: 1cm;
      }
      
      body {
        font-family: 'Cairo', 'Noto Kufi Arabic', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.3;
        color: #000;
        direction: rtl;
        background: white;
      }
      
      .print-container {
        width: 100%;
        max-width: 19cm;
        margin: 0 auto;
        background: white;
        page-break-inside: avoid;
      }
      
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1E40AF;
      }
      
      .logo {
        width: 3cm;
        height: 3cm;
        border-radius: 50%;
        background: linear-gradient(135deg, #1E40AF, #059669, #DC2626);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        flex-shrink: 0;
      }
      
      .header-title {
        flex: 1;
        text-align: center;
        margin: 0 20px;
      }
      
      .header-title h1 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        color: #1E40AF;
      }
      
      .header-title h2 {
        font-size: 14px;
        font-weight: 600;
        margin: 5px 0 0 0;
        color: #059669;
      }
      
      .date-info {
        text-align: left;
        font-size: 10px;
        color: #666;
        width: 3cm;
        flex-shrink: 0;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
        background: #f8f9ff;
        padding: 10px;
        border-radius: 5px;
      }
      
      .info-section {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2px 0;
        border-bottom: 1px dotted #ddd;
      }
      
      .info-label {
        font-weight: 600;
        color: #1E40AF;
        font-size: 11px;
      }
      
      .info-value {
        font-weight: 400;
        color: #000;
        font-size: 11px;
      }
      
      .section-title {
        font-size: 14px;
        font-weight: 700;
        color: #1E40AF;
        margin: 15px 0 8px 0;
        padding: 5px 10px;
        background: linear-gradient(90deg, #e0f2fe, transparent);
        border-right: 4px solid #1E40AF;
      }
      
      .content-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 11px;
      }
      
      .content-table th {
        background: #1E40AF;
        color: white;
        padding: 6px 8px;
        text-align: center;
        font-weight: 600;
        font-size: 11px;
      }
      
      .content-table td {
        padding: 4px 8px;
        border: 1px solid #e0e0e0;
        vertical-align: top;
      }
      
      .content-table tr:nth-child(even) {
        background: #f8f9ff;
      }
      
      .group-title {
        font-weight: 600;
        color: #059669;
        min-width: 80px;
      }
      
      .group-items {
        line-height: 1.2;
        color: #000;
      }
      
      .item-separator {
        color: #666;
        margin: 0 3px;
      }
      
      .notes-section {
        margin-top: 15px;
        padding: 8px;
        background: #fffbf0;
        border: 1px solid #f0c614;
        border-radius: 4px;
      }
      
      .notes-title {
        font-weight: 600;
        color: #b45309;
        font-size: 11px;
        margin-bottom: 4px;
      }
      
      .notes-content {
        font-size: 10px;
        color: #000;
        line-height: 1.3;
      }
      
      .footer {
        margin-top: 20px;
        text-align: center;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        font-size: 10px;
        color: #666;
      }
      
      .signature-area {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        font-size: 10px;
      }
      
      .signature-box {
        width: 120px;
        height: 40px;
        border: 1px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }
      
      /* تحسينات للطباعة */
      .no-page-break {
        page-break-inside: avoid;
      }
      
      .compact-spacing {
        margin: 0;
        padding: 0;
      }
    }
    
    @media screen {
      .print-container {
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 1cm;
        margin: 20px auto;
        background: white;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <div className="print-container">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <div>
              صالة
              <br />
              حسام جم
              <br />
              💪
            </div>
          </div>
          <div className="header-title">
            <h1>خطة المشترك</h1>
            <h2>برنامج تدريبي وغذائي شامل</h2>
          </div>
          <div className="date-info">
            <div>تاريخ الطباعة:</div>
            <div>{format(new Date(), "dd/MM/yyyy", { locale: ar })}</div>
            <div>{format(new Date(), "HH:mm", { locale: ar })}</div>
          </div>
        </div>

        {/* معلومات المشترك */}
        <div className="info-grid no-page-break">
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">الاسم الكامل:</span>
              <span className="info-value">{subscriber.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">العمر:</span>
              <span className="info-value">{subscriber.age} سنة</span>
            </div>
            <div className="info-row">
              <span className="info-label">الوزن:</span>
              <span className="info-value">{subscriber.weight} كيلو</span>
            </div>
          </div>
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">الطول:</span>
              <span className="info-value">{subscriber.height} سم</span>
            </div>
            <div className="info-row">
              <span className="info-label">رقم الهاتف:</span>
              <span className="info-value">{subscriber.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">تاريخ الاشتراك:</span>
              <span className="info-value">
                {format(new Date(subscriber.created_at), "dd/MM/yyyy", {
                  locale: ar,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* الكورسات التدريبية */}
        {courseGroups.length > 0 && (
          <div className="no-page-break">
            <h3 className="section-title">📋 البرنامج التدريبي</h3>
            <table className="content-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>اليوم / المجموعة</th>
                  <th style={{ width: "75%" }}>التمارين</th>
                </tr>
              </thead>
              <tbody>
                {courseGroups.map((group, index) => (
                  <tr key={group.id}>
                    <td className="group-title">
                      {group.title || `اليوم ${index + 1}`}
                    </td>
                    <td className="group-items">
                      {group.group_items.map((item) => item.name).join(" • ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* النظام الغذائي */}
        {dietGroups.length > 0 && (
          <div className="no-page-break">
            <h3 className="section-title">🍎 النظام الغذائي</h3>
            <table className="content-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>الوقت / الوجبة</th>
                  <th style={{ width: "75%" }}>العناصر الغذائية</th>
                </tr>
              </thead>
              <tbody>
                {dietGroups.map((group, index) => (
                  <tr key={group.id}>
                    <td className="group-title">
                      {group.title ||
                        ["الفطور", "الغداء", "العشاء", "وجبة خفيفة"][index] ||
                        `وجبة ${index + 1}`}
                    </td>
                    <td className="group-items">
                      {group.group_items.map((item) => item.name).join(" • ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ملاحظات */}
        {subscriber.notes && (
          <div className="notes-section no-page-break">
            <div className="notes-title">📝 ملاحظات خاصة:</div>
            <div className="notes-content">{subscriber.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="signature-area">
            <div>
              <div>توقيع المدرب:</div>
              <div className="signature-box">_______________</div>
            </div>
            <div style={{ textAlign: "center", fontSize: "9px" }}>
              <div>
                <strong>صالة حسام جم</strong>
              </div>
              <div>نظام إدارة متكامل • تم الإنشاء تلقائياً</div>
            </div>
            <div>
              <div>توقيع المشترك:</div>
              <div className="signature-box">_______________</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook لطباعة المشترك
export function usePrintSubscriber() {
  const printSubscriber = (subscriber: SubscriberData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح للنوافذ المنبثقة لتتمكن من الطباعة");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>خطة المشترك - ${subscriber.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: A4;
              margin: 1cm;
            }
            
            body {
              font-family: 'Cairo', 'Noto Kufi Arabic', Arial, sans-serif;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
              direction: rtl;
              background: white;
            }
            
            .print-container {
              width: 100%;
              max-width: 19cm;
              margin: 0 auto;
              background: white;
              page-break-inside: avoid;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #1E40AF;
            }
            
            .logo {
              width: 3cm;
              height: 3cm;
              border-radius: 50%;
              background: linear-gradient(135deg, #1E40AF, #059669, #DC2626);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              text-align: center;
              flex-shrink: 0;
            }
            
            .header-title {
              flex: 1;
              text-align: center;
              margin: 0 20px;
            }
            
            .header-title h1 {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
              color: #1E40AF;
            }
            
            .header-title h2 {
              font-size: 14px;
              font-weight: 600;
              margin: 5px 0 0 0;
              color: #059669;
            }
            
            .date-info {
              text-align: left;
              font-size: 10px;
              color: #666;
              width: 3cm;
              flex-shrink: 0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 15px;
              background: #f8f9ff;
              padding: 10px;
              border-radius: 5px;
            }
            
            .info-section {
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2px 0;
              border-bottom: 1px dotted #ddd;
            }
            
            .info-label {
              font-weight: 600;
              color: #1E40AF;
              font-size: 11px;
            }
            
            .info-value {
              font-weight: 400;
              color: #000;
              font-size: 11px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #1E40AF;
              margin: 15px 0 8px 0;
              padding: 5px 10px;
              background: linear-gradient(90deg, #e0f2fe, transparent);
              border-right: 4px solid #1E40AF;
            }
            
            .content-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 11px;
            }
            
            .content-table th {
              background: #1E40AF;
              color: white;
              padding: 6px 8px;
              text-align: center;
              font-weight: 600;
              font-size: 11px;
            }
            
            .content-table td {
              padding: 4px 8px;
              border: 1px solid #e0e0e0;
              vertical-align: top;
            }
            
            .content-table tr:nth-child(even) {
              background: #f8f9ff;
            }
            
            .group-title {
              font-weight: 600;
              color: #059669;
              min-width: 80px;
            }
            
            .group-items {
              line-height: 1.2;
              color: #000;
            }
            
            .notes-section {
              margin-top: 15px;
              padding: 8px;
              background: #fffbf0;
              border: 1px solid #f0c614;
              border-radius: 4px;
            }
            
            .notes-title {
              font-weight: 600;
              color: #b45309;
              font-size: 11px;
              margin-bottom: 4px;
            }
            
            .notes-content {
              font-size: 10px;
              color: #000;
              line-height: 1.3;
            }
            
            .footer {
              margin-top: 20px;
              text-align: center;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
            }
            
            .signature-area {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              font-size: 10px;
            }
            
            .signature-box {
              width: 120px;
              height: 40px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
            }
            
            .no-page-break {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Header -->
            <div class="header">
              <div class="logo">
                <div>
                  صالة<br>
                  حسام جم<br>
                  💪
                </div>
              </div>
              <div class="header-title">
                <h1>خطة المشترك</h1>
                <h2>برنامج تدريبي وغذائي شامل</h2>
              </div>
              <div class="date-info">
                <div>تاريخ الطباعة:</div>
                <div>${format(new Date(), "dd/MM/yyyy", { locale: ar })}</div>
                <div>${format(new Date(), "HH:mm", { locale: ar })}</div>
              </div>
            </div>

            <!-- معلومات المشترك -->
            <div class="info-grid no-page-break">
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">الاسم الكامل:</span>
                  <span class="info-value">${subscriber.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">العمر:</span>
                  <span class="info-value">${subscriber.age} سنة</span>
                </div>
                <div class="info-row">
                  <span class="info-label">الوزن:</span>
                  <span class="info-value">${subscriber.weight} كيلو</span>
                </div>
              </div>
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">الطول:</span>
                  <span class="info-value">${subscriber.height} سم</span>
                </div>
                <div class="info-row">
                  <span class="info-label">رقم الهاتف:</span>
                  <span class="info-value">${subscriber.phone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">تاريخ الاشتراك:</span>
                  <span class="info-value">${format(new Date(subscriber.created_at), "dd/MM/yyyy", { locale: ar })}</span>
                </div>
              </div>
            </div>

            ${
              subscriber.groups.filter((g) => g.type === "course").length > 0
                ? `
            <!-- الكورسات التدريبية -->
            <div class="no-page-break">
              <h3 class="section-title">📋 البرنامج التدريبي</h3>
              <table class="content-table">
                <thead>
                  <tr>
                    <th style="width: 25%">اليوم / المجموعة</th>
                    <th style="width: 75%">التمارين</th>
                  </tr>
                </thead>
                <tbody>
                  ${subscriber.groups
                    .filter((g) => g.type === "course")
                    .map(
                      (group, index) => `
                    <tr>
                      <td class="group-title">${group.title || `اليوم ${index + 1}`}</td>
                      <td class="group-items">${group.group_items.map((item) => item.name).join(" • ")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              subscriber.groups.filter((g) => g.type === "diet").length > 0
                ? `
            <!-- النظام الغذائي -->
            <div class="no-page-break">
              <h3 class="section-title">🍎 النظام الغذائي</h3>
              <table class="content-table">
                <thead>
                  <tr>
                    <th style="width: 25%">الوقت / الو��بة</th>
                    <th style="width: 75%">العناصر الغذائية</th>
                  </tr>
                </thead>
                <tbody>
                  ${subscriber.groups
                    .filter((g) => g.type === "diet")
                    .map(
                      (group, index) => `
                    <tr>
                      <td class="group-title">${
                        group.title ||
                        ["الفطور", "الغداء", "العشاء", "وجبة خفيفة"][index] ||
                        `وجبة ${index + 1}`
                      }</td>
                      <td class="group-items">${group.group_items.map((item) => item.name).join(" • ")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              subscriber.notes
                ? `
            <!-- ملاحظات -->
            <div class="notes-section no-page-break">
              <div class="notes-title">📝 ملاحظات خاصة:</div>
              <div class="notes-content">${subscriber.notes}</div>
            </div>
            `
                : ""
            }

            <!-- Footer -->
            <div class="footer">
              <div class="signature-area">
                <div>
                  <div>توقيع المدرب:</div>
                  <div class="signature-box">_______________</div>
                </div>
                <div style="text-align: center; font-size: 9px;">
                  <div><strong>صالة حسام جم</strong></div>
                  <div>نظام إدارة متكامل • تم الإنشاء تلقائياً</div>
                </div>
                <div>
                  <div>توقيع المشترك:</div>
                  <div class="signature-box">_______________</div>
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return { printSubscriber };
}
