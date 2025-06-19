import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Printer, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, Subscriber } from "@/lib/database";

const Print = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Subscriber | null>(null);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (memberId) {
      const memberData = db.getSubscriberById(memberId);
      if (memberData) {
        setMember(memberData);

        const memberGroups = db.getGroupsBySubscriber(memberId);
        const groupsWithItems = memberGroups.map((group) => {
          const items = db
            .getGroupItemsByGroup(group.id)
            .map((groupItem) => {
              if (group.type === "course") {
                return db
                  .getCoursePoints()
                  .find((c) => c.id === groupItem.item_id);
              } else {
                return db
                  .getDietItems()
                  .find((d) => d.id === groupItem.item_id);
              }
            })
            .filter(Boolean);

          return { ...group, items };
        });

        setGroups(groupsWithItems);
      }
    }
  }, [memberId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            عضو غير موجود
          </h1>
          <Button onClick={() => navigate("/members")} variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمشتركين
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print controls - hidden during print */}
      <div className="no-print bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/members")} variant="outline">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للمشتركين
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              طباعة بيانات: {member.name}
            </h1>
          </div>
          <Button onClick={handlePrint} className="gym-button">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Print content */}
      <div className="print-container bg-white min-h-screen">
        <div className="max-w-4xl mx-auto p-8 page-break">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gray-300 pb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gym-primary rounded-full flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">حسام جم</h1>
                <p className="text-lg text-gray-600">كمال الأجسام</p>
              </div>
            </div>
            <p className="text-gray-600">
              {formatDate(new Date().toISOString())} | www.hussam-gym.com
            </p>
          </div>

          {/* Member Info Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-r-4 border-gym-primary pr-3">
              معلومات المشترك
            </h2>
            <table className="w-full border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300 w-1/4">
                    الاسم
                  </td>
                  <td className="p-3">{member.name}</td>
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300 w-1/4">
                    رقم الهاتف
                  </td>
                  <td className="p-3">{member.phone}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300">
                    العمر
                  </td>
                  <td className="p-3">
                    {member.age > 0 ? `${member.age} سنة` : "غير محدد"}
                  </td>
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300">
                    تاريخ الانضمام
                  </td>
                  <td className="p-3">{formatDate(member.created_at)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300">
                    الوزن
                  </td>
                  <td className="p-3">
                    {member.weight > 0 ? `${member.weight} كجم` : "غير محدد"}
                  </td>
                  <td className="bg-gray-100 font-medium p-3 border-l border-gray-300">
                    الطول
                  </td>
                  <td className="p-3">
                    {member.height > 0 ? `${member.height} سم` : "غير محدد"}
                  </td>
                </tr>
                {member.notes && (
                  <tr>
                    <td className="bg-gray-100 font-medium p-3 border-l border-gray-300">
                      ملاحظات
                    </td>
                    <td className="p-3" colSpan={3}>
                      {member.notes}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Training Groups */}
          {groups.filter((g) => g.type === "course").length > 0 && (
            <div className="mb-8 page-break">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-r-4 border-purple-500 pr-3">
                البرامج التدريبية
              </h2>
              {groups
                .filter((g) => g.type === "course")
                .map((group, index) => (
                  <div key={group.id} className="mb-4">
                    <h3 className="text-lg font-semibold text-purple-700 mb-2 bg-purple-50 p-2 rounded">
                      {index + 1}. {group.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.items.map((item: any, itemIndex: number) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 border-b border-gray-200"
                        >
                          <span className="font-medium">
                            {itemIndex + 1}. {item.name}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Diet Groups */}
          {groups.filter((g) => g.type === "diet").length > 0 && (
            <div className="mb-8 page-break">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-r-4 border-green-500 pr-3">
                الأنظمة الغذائية
              </h2>
              {groups
                .filter((g) => g.type === "diet")
                .map((group, index) => (
                  <div key={group.id} className="mb-4">
                    <h3 className="text-lg font-semibold text-green-700 mb-2 bg-green-50 p-2 rounded">
                      {index + 1}. {group.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.items.map((item: any, itemIndex: number) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 border-b border-gray-200"
                        >
                          <span className="font-medium">
                            {itemIndex + 1}. {item.name}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-gray-600">
            <p className="text-sm">
              نتمنى لك تحقيق أهدافك الرياضية • حسام جم لكمال الأجسام
            </p>
            <p className="text-xs mt-2">
              للاستفسارات: [رقم الهاتف] | [البريد الإلكتروني] | [العنوان]
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Print;
