import React from "react";
import { Member, Course, DietPlan } from "@/lib/types";
import GymLogo from "./GymLogo";

interface MemberPrintTemplateProps {
  member: Member;
  courses: Course[];
  dietPlans: DietPlan[];
}

export const MemberPrintTemplate: React.FC<MemberPrintTemplateProps> = ({
  member,
  courses,
  dietPlans,
}) => {
  // Get course names from IDs
  const getMemberCourses = () => {
    const memberCourseIds = member.courses || [];
    return courses.filter((course) => memberCourseIds.includes(course.id));
  };

  // Get diet plan names from IDs
  const getMemberDietPlans = () => {
    const memberDietPlanIds = member.dietPlans || [];
    return dietPlans.filter((diet) => memberDietPlanIds.includes(diet.id));
  };

  // Get course groups with course names
  const getCourseGroupsWithNames = () => {
    if (!member.courseGroups) return [];
    return member.courseGroups.map((group) => ({
      ...group,
      courses: courses.filter((course) => group.courseIds.includes(course.id)),
    }));
  };

  // Get diet plan groups with names
  const getDietPlanGroupsWithNames = () => {
    if (!member.dietPlanGroups) return [];
    return member.dietPlanGroups.map((group) => ({
      ...group,
      dietPlans: dietPlans.filter((diet) =>
        group.dietPlanIds.includes(diet.id),
      ),
    }));
  };

  const memberCourses = getMemberCourses();
  const memberDietPlans = getMemberDietPlans();
  const courseGroups = getCourseGroupsWithNames();
  const dietPlanGroups = getDietPlanGroupsWithNames();

  return (
    <div className="print-container" style={{ display: "none" }}>
      <div
        id="member-print-content"
        className="bg-white p-8 font-arabic"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          fontSize: "14px",
          lineHeight: "1.6",
          direction: "rtl",
          fontFamily: "Cairo, Tajawal, Arial, sans-serif",
        }}
      >
        {/* Header with Logo and Gym Name */}
        <div className="flex items-center justify-center mb-8 border-b-2 border-orange-500 pb-6">
          <div className="flex items-center gap-4">
            <GymLogo size="lg" className="print:block" />
            <div className="text-center">
              <h1
                className="text-3xl font-bold text-orange-600 mb-2"
                style={{ fontSize: "28px", fontWeight: "bold" }}
              >
                صالة حسام لكمال الأجسام والرشاقة
              </h1>
              <p className="text-gray-600" style={{ fontSize: "16px" }}>
                بطاقة عضوية - معلومات المشترك
              </p>
            </div>
          </div>
        </div>

        {/* Member Personal Information */}
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2
            className="text-2xl font-bold text-gray-800 mb-4 text-center"
            style={{ fontSize: "22px", fontWeight: "bold" }}
          >
            المعلومات الشخصية
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <span className="font-semibold text-gray-700">الاسم:</span>
              <span className="mr-2 text-gray-900 font-medium">
                {member.name}
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <span className="font-semibold text-gray-700">العمر:</span>
              <span className="mr-2 text-gray-900 font-medium">
                {member.age} سنة
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <span className="font-semibold text-gray-700">الطول:</span>
              <span className="mr-2 text-gray-900 font-medium">
                {member.height} سم
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <span className="font-semibold text-gray-700">الوزن:</span>
              <span className="mr-2 text-gray-900 font-medium">
                {member.weight} كيلو
              </span>
            </div>
          </div>
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <span className="font-semibold text-gray-700">تاريخ الانضمام:</span>
            <span className="mr-2 text-gray-900 font-medium">
              {new Date(member.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>

        {/* Two Column Layout for Courses and Diet Plans */}
        <div className="grid grid-cols-2 gap-8">
          {/* Right Column - Courses */}
          <div>
            <h3
              className="text-xl font-bold text-blue-700 mb-4 text-center border-b-2 border-blue-200 pb-2"
              style={{ fontSize: "20px", fontWeight: "bold" }}
            >
              الكورسات التدريبية
            </h3>

            {/* Course Groups */}
            {courseGroups.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  المجموعات المخصصة:
                </h4>
                {courseGroups.map((group, index) => (
                  <div
                    key={group.id}
                    className="mb-4 bg-blue-50 p-4 rounded-lg"
                  >
                    {group.title && (
                      <div
                        className="font-bold text-blue-800 mb-2"
                        style={{ fontSize: "16px" }}
                      >
                        {group.title}
                      </div>
                    )}
                    <ul className="space-y-1">
                      {group.courses.map((course, courseIndex) => (
                        <li key={course.id} className="flex items-center">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                            {courseIndex + 1}
                          </span>
                          <span className="text-gray-800">{course.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Courses (for backward compatibility) */}
            {memberCourses.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  الكورسات الفردية:
                </h4>
                <ul className="space-y-2">
                  {memberCourses.map((course, index) => (
                    <li
                      key={course.id}
                      className="flex items-center bg-blue-50 p-3 rounded-lg"
                    >
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {course.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {courseGroups.length === 0 && memberCourses.length === 0 && (
              <p className="text-gray-500 text-center p-4 bg-gray-100 rounded-lg">
                لم يتم تسجيل أي كورسات بعد
              </p>
            )}
          </div>

          {/* Left Column - Diet Plans */}
          <div>
            <h3
              className="text-xl font-bold text-green-700 mb-4 text-center border-b-2 border-green-200 pb-2"
              style={{ fontSize: "20px", fontWeight: "bold" }}
            >
              الأنظمة الغذائية
            </h3>

            {/* Diet Plan Groups */}
            {dietPlanGroups.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  المجموعات المخصصة:
                </h4>
                {dietPlanGroups.map((group, index) => (
                  <div
                    key={group.id}
                    className="mb-4 bg-green-50 p-4 rounded-lg"
                  >
                    {group.title && (
                      <div
                        className="font-bold text-green-800 mb-2"
                        style={{ fontSize: "16px" }}
                      >
                        {group.title}
                      </div>
                    )}
                    <ul className="space-y-1">
                      {group.dietPlans.map((diet, dietIndex) => (
                        <li key={diet.id} className="flex items-center">
                          <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                            {dietIndex + 1}
                          </span>
                          <span className="text-gray-800">{diet.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Diet Plans (for backward compatibility) */}
            {memberDietPlans.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  الأنظمة الفردية:
                </h4>
                <ul className="space-y-2">
                  {memberDietPlans.map((diet, index) => (
                    <li
                      key={diet.id}
                      className="flex items-center bg-green-50 p-3 rounded-lg"
                    >
                      <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {diet.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dietPlanGroups.length === 0 && memberDietPlans.length === 0 && (
              <p className="text-gray-500 text-center p-4 bg-gray-100 rounded-lg">
                لم يتم تسجيل أي أنظمة غذائية بعد
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold">تاريخ الطباعة:</p>
              <p>{new Date().toLocaleDateString("en-GB")}</p>
            </div>
            <div>
              <p className="font-semibold text-orange-600">
                صالة حسام للياقة البدنية
              </p>
              <p>نحو حياة صحية أفضل</p>
            </div>
            <div>
              <p className="font-semibold">رقم العضوية:</p>
              <p>#{member.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print-container {
            display: block !important;
          }
          #member-print-content {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 20mm;
            font-size: 12px;
            box-shadow: none;
          }
          .bg-gray-50,
          .bg-blue-50,
          .bg-green-50,
          .bg-gray-100 {
            background-color: #f9f9f9 !important;
          }
          .bg-white {
            background-color: white !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberPrintTemplate;
