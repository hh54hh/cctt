import { SubscriberWithGroups } from "@/lib/gym-types";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface MemberPrintTemplateProps {
  member: SubscriberWithGroups;
}

export default function MemberPrintTemplate({
  member,
}: MemberPrintTemplateProps) {
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print Button */}
      <div className="mb-4 no-print">
        <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
          <Printer className="w-4 h-4 ml-2" />
          طباعة
        </Button>
      </div>

      {/* Print Content */}
      <div className="print-content bg-white p-8" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-orange-500 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">صالة</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">صالة حسام</h1>
              <p className="text-gray-600">لكمال الأجسام والرشاقة</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-gray-600">تاريخ الطباعة</p>
            <p className="font-medium">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">خطة المشترك</h2>
          <div className="w-24 h-1 bg-orange-500 mx-auto"></div>
        </div>

        {/* Member Info */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 bg-gray-100 p-3 rounded">
            المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">الاسم:</span>
                <span className="text-gray-900">{member.name}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">العمر:</span>
                <span className="text-gray-900">{member.age} سنة</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">الوزن:</span>
                <span className="text-gray-900">{member.weight} كيلو</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">الطول:</span>
                <span className="text-gray-900">{member.height} سم</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">الهاتف:</span>
                <span className="text-gray-900">{member.phone}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-24">التاريخ:</span>
                <span className="text-gray-900">
                  {formatDate(member.created_at)}
                </span>
              </div>
            </div>
          </div>
          {member.notes && (
            <div className="mt-4">
              <span className="font-medium text-gray-700">ملاحظات:</span>
              <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded">
                {member.notes}
              </p>
            </div>
          )}
        </div>

        {/* Courses Section */}
        {member.course_groups.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 bg-orange-100 p-3 rounded">
              الكورسات التدريبية
            </h3>
            <div className="space-y-4">
              {member.course_groups.map((group, index) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded p-4"
                >
                  <h4 className="font-semibold text-orange-800 mb-3">
                    {group.title || `مجموعة ${index + 1}`}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="text-sm p-2 bg-orange-50 rounded border border-orange-200"
                      >
                        <span className="font-medium">{itemIndex + 1}.</span>{" "}
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diet Section */}
        {member.diet_groups.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 bg-green-100 p-3 rounded">
              النظام الغذائي
            </h3>
            <div className="space-y-4">
              {member.diet_groups.map((group, index) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded p-4"
                >
                  <h4 className="font-semibold text-green-800 mb-3">
                    {group.title || `وجبة ${index + 1}`}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="text-sm p-2 bg-green-50 rounded border border-green-200"
                      >
                        <span className="font-medium">{itemIndex + 1}.</span>{" "}
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-300">
          <div className="text-gray-600">
            <p className="font-medium">صالة حسام لكمال الأجسام والرشاقة</p>
            <p className="text-sm mt-2">نظام إدارة احترافي للصالات الرياضية</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-content {
            font-size: 12px !important;
            margin: 0 !important;
            padding: 1cm !important;
            max-width: none !important;
            width: 100% !important;
            box-shadow: none !important;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            margin: 0 !important;
          }

          .bg-orange-100 {
            background-color: #fed7aa !important;
          }

          .bg-green-100 {
            background-color: #dcfce7 !important;
          }

          .bg-orange-50 {
            background-color: #fff7ed !important;
          }

          .bg-green-50 {
            background-color: #f0fdf4 !important;
          }

          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }

          .bg-gray-50 {
            background-color: #f9fafb !important;
          }

          .border-orange-500 {
            border-color: #f97316 !important;
          }

          .border-orange-200 {
            border-color: #fed7aa !important;
          }

          .border-green-200 {
            border-color: #bbf7d0 !important;
          }

          .text-orange-800 {
            color: #9a3412 !important;
          }

          .text-green-800 {
            color: #166534 !important;
          }

          * {
            page-break-inside: avoid;
          }

          .grid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
