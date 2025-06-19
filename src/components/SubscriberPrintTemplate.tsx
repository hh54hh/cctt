import { SubscriberWithGroups } from "@/lib/types-new";
import { GYM_NAME } from "@/lib/auth-new";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SubscriberPrintTemplateProps {
  subscriber: SubscriberWithGroups;
}

export default function SubscriberPrintTemplate({
  subscriber,
}: SubscriberPrintTemplateProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "تاريخ غير صحيح";
    }
  };

  const printDate = format(new Date(), "dd MMMM yyyy", { locale: ar });

  return (
    <div className="print-template bg-white p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center border-b-2 border-orange-500 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">{GYM_NAME}</h1>
        <p className="text-xl text-gray-600">بطاقة المشترك</p>
        <p className="text-sm text-gray-500 mt-2">تاريخ الطباعة: {printDate}</p>
      </div>

      {/* Subscriber Basic Info */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          المعلومات الأساسية
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <strong className="text-gray-700">الاسم:</strong>
            <span className="mr-2 text-xl font-semibold">
              {subscriber.name}
            </span>
          </div>
          <div>
            <strong className="text-gray-700">تاريخ الاشتراك:</strong>
            <span className="mr-2">{formatDate(subscriber.created_at)}</span>
          </div>
          {subscriber.age && (
            <div>
              <strong className="text-gray-700">العمر:</strong>
              <span className="mr-2">{subscriber.age} سنة</span>
            </div>
          )}
          {subscriber.weight && (
            <div>
              <strong className="text-gray-700">الوزن:</strong>
              <span className="mr-2">{subscriber.weight} كج</span>
            </div>
          )}
          {subscriber.height && (
            <div>
              <strong className="text-gray-700">الطول:</strong>
              <span className="mr-2">{subscriber.height} سم</span>
            </div>
          )}
          {subscriber.phone && (
            <div>
              <strong className="text-gray-700">الهاتف:</strong>
              <span className="mr-2">{subscriber.phone}</span>
            </div>
          )}
        </div>
        {subscriber.notes && (
          <div className="mt-4">
            <strong className="text-gray-700">ملاحظات:</strong>
            <p className="mr-2 mt-2 p-3 bg-gray-50 rounded-lg border">
              {subscriber.notes}
            </p>
          </div>
        )}
      </div>

      {/* Course Groups */}
      {subscriber.courseGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 border-b border-blue-300 pb-2">
            مجموعات التمارين ({subscriber.courseGroups.length})
          </h2>
          <div className="space-y-6">
            {subscriber.courseGroups.map((group, index) => (
              <div
                key={group.id}
                className="border border-blue-200 rounded-lg p-4 bg-blue-50"
              >
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  {group.title || `مجموعة التمارين ${index + 1}`}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items?.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-white rounded border"
                    >
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {itemIndex + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diet Groups */}
      {subscriber.dietGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4 border-b border-green-300 pb-2">
            مجموعات الأنظمة الغذائية ({subscriber.dietGroups.length})
          </h2>
          <div className="space-y-6">
            {subscriber.dietGroups.map((group, index) => (
              <div
                key={group.id}
                className="border border-green-200 rounded-lg p-4 bg-green-50"
              >
                <h3 className="text-xl font-semibold text-green-900 mb-3">
                  {group.title || `المجموعة الغذائية ${index + 1}`}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items?.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-white rounded border"
                    >
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {itemIndex + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No groups message */}
      {subscriber.courseGroups.length === 0 &&
        subscriber.dietGroups.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 text-lg">
              لم يتم إضافة مجموعات تمارين أو أنظمة غذائية لهذا المشترك
            </p>
          </div>
        )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 border-orange-500 text-center">
        <p className="text-gray-600">
          هذه البطاقة تم إنتاجها من نظام إدارة {GYM_NAME}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          للاستفسارات أو التعديلات، يرجى مراجعة الإدارة
        </p>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          .print-template {
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          * {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
