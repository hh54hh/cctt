import React from "react";
import { Member, Course, DietPlan } from "@/lib/types";

interface EnhancedMemberPrintTemplateProps {
  member: Member;
  courses: Course[];
  dietPlans: DietPlan[];
}

const EnhancedMemberPrintTemplate: React.FC<
  EnhancedMemberPrintTemplateProps
> = ({ member, courses, dietPlans }) => {
  // Get courses and diet plans with grouping
  const getCourseGroups = (member: Member) => {
    const groups = [];

    // Add course groups
    if (member.courseGroups && member.courseGroups.length > 0) {
      member.courseGroups.forEach((group, index) => {
        const groupCourses = group.courseIds
          .map((courseId) => courses.find((c) => c.id === courseId))
          .filter(Boolean);

        groups.push({
          title: group.title || `مجموعة الكورسات ${index + 1}`,
          items: groupCourses,
          type: "course",
        });
      });
    }

    // Add individual courses
    if (member.courses && member.courses.length > 0) {
      const individualCourses = member.courses
        .map((courseId) => courses.find((c) => c.id === courseId))
        .filter(Boolean);

      if (individualCourses.length > 0) {
        groups.push({
          title: "الكورسات الفردية",
          items: individualCourses,
          type: "course",
        });
      }
    }

    return groups;
  };

  const getDietGroups = (member: Member) => {
    const groups = [];

    // Add diet plan groups
    if (member.dietPlanGroups && member.dietPlanGroups.length > 0) {
      member.dietPlanGroups.forEach((group, index) => {
        const groupDiets = group.dietPlanIds
          .map((dietId) => dietPlans.find((d) => d.id === dietId))
          .filter(Boolean);

        groups.push({
          title: group.title || `مجموعة الأنظمة الغذائية ${index + 1}`,
          items: groupDiets,
          type: "diet",
        });
      });
    }

    // Add individual diet plans
    if (member.dietPlans && member.dietPlans.length > 0) {
      const individualDiets = member.dietPlans
        .map((dietId) => dietPlans.find((d) => d.id === dietId))
        .filter(Boolean);

      if (individualDiets.length > 0) {
        groups.push({
          title: "الأنظمة الغذائية الفردية",
          items: individualDiets,
          type: "diet",
        });
      }
    }

    return groups;
  };

  const courseGroups = getCourseGroups(member);
  const dietGroups = getDietGroups(member);

  // Split groups into pages (2 course groups + 2 diet groups per page)
  const getGroupsForPage = (pageNumber: number) => {
    const coursesPerPage = 2;
    const dietsPerPage = 2;

    const courseStart = (pageNumber - 1) * coursesPerPage;
    const courseEnd = courseStart + coursesPerPage;
    const dietStart = (pageNumber - 1) * dietsPerPage;
    const dietEnd = dietStart + dietsPerPage;

    return {
      courses: courseGroups.slice(courseStart, courseEnd),
      diets: dietGroups.slice(dietStart, dietEnd),
    };
  };

  const totalPages = Math.max(
    Math.ceil(courseGroups.length / 2),
    Math.ceil(dietGroups.length / 2),
    1,
  );

  const renderPage = (pageNumber: number) => {
    const { courses: pageCourses, diets: pageDiets } =
      getGroupsForPage(pageNumber);
    const isFirstPage = pageNumber === 1;

    return (
      <div
        key={pageNumber}
        className="page"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          margin: "0 auto",
          backgroundColor: "white",
          boxSizing: "border-box",
          position: "relative",
          pageBreakAfter: pageNumber < totalPages ? "always" : "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "25px",
            borderBottom: "3px solid #f97316",
            paddingBottom: "15px",
          }}
        >
          <div style={{ textAlign: "right", flex: 1 }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 8px 0",
                fontFamily: "Cairo, Tajawal, Arial, sans-serif",
              }}
            >
              {isFirstPage ? "بطاقة عضوية" : `بطاقة عضوية - صفحة ${pageNumber}`}
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: "#6b7280",
                margin: "0",
                fontFamily: "Cairo, Tajawal, Arial, sans-serif",
              }}
            >
              صالة حسام للياقة البدنية
            </p>
          </div>

          {/* Circular Logo */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "20px",
              boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "white",
                fontFamily: "Cairo, Tajawal, Arial, sans-serif",
              }}
            >
              💪
            </span>
          </div>
        </div>

        {/* Member Info - Only on first page */}
        {isFirstPage && (
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: "0 0 15px 0",
                    fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                  }}
                >
                  {member.name}
                </h2>
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.8",
                    fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                  }}
                >
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                        minWidth: "100px",
                      }}
                    >
                      رقم الهاتف:
                    </span>
                    <span style={{ color: "#6b7280" }}>{member.phone}</span>
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                        minWidth: "100px",
                      }}
                    >
                      العمر:
                    </span>
                    <span style={{ color: "#6b7280" }}>{member.age} سنة</span>
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                        minWidth: "100px",
                      }}
                    >
                      الطول:
                    </span>
                    <span style={{ color: "#6b7280" }}>{member.height} سم</span>
                  </div>
                  <div style={{ display: "flex" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                        minWidth: "100px",
                      }}
                    >
                      الوزن:
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      {member.weight} كيلو
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: "0 0 15px 0",
                    fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                  }}
                >
                  معلومات الاشتراك
                </h3>
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.8",
                    fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                  }}
                >
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                        minWidth: "120px",
                      }}
                    >
                      تاريخ الانضمام:
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      {new Date(member.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  {member.subscriptionStart && (
                    <div style={{ display: "flex", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#374151",
                          minWidth: "120px",
                        }}
                      >
                        بداية الاشتراك:
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        {new Date(member.subscriptionStart).toLocaleDateString(
                          "ar-SA",
                        )}
                      </span>
                    </div>
                  )}
                  {member.subscriptionEnd && (
                    <div style={{ display: "flex" }}>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#374151",
                          minWidth: "120px",
                        }}
                      >
                        نهاية الاشتراك:
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        {new Date(member.subscriptionEnd).toLocaleDateString(
                          "ar-SA",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25px",
            flex: 1,
          }}
        >
          {/* Courses Section */}
          <div>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 20px 0",
                padding: "10px 0",
                borderBottom: "2px solid #3b82f6",
                fontFamily: "Cairo, Tajawal, Arial, sans-serif",
              }}
            >
              🏋️ الكورسات التدريبية
            </h3>

            {pageCourses.length > 0 ? (
              pageCourses.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #dbeafe",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#1e40af",
                      margin: "0 0 12px 0",
                      fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                    }}
                  >
                    {group.title}
                  </h4>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: "0",
                      margin: "0",
                    }}
                  >
                    {group.items.map((item: any, itemIndex: number) => (
                      <li
                        key={itemIndex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px 0",
                          fontSize: "16px",
                          fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                          borderBottom:
                            itemIndex < group.items.length - 1
                              ? "1px solid #e0e7ff"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            borderRadius: "50%",
                            textAlign: "center",
                            lineHeight: "24px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginLeft: "10px",
                          }}
                        >
                          {itemIndex + 1}
                        </span>
                        <span style={{ color: "#374151" }}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : pageNumber === 1 && courseGroups.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "16px",
                  padding: "20px",
                  fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                }}
              >
                لم يتم تسجيل أي كورسات بعد
              </div>
            ) : null}
          </div>

          {/* Diet Plans Section */}
          <div>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 20px 0",
                padding: "10px 0",
                borderBottom: "2px solid #10b981",
                fontFamily: "Cairo, Tajawal, Arial, sans-serif",
              }}
            >
              🥗 الأنظمة الغذائية
            </h3>

            {pageDiets.length > 0 ? (
              pageDiets.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#ecfdf5",
                    borderRadius: "8px",
                    border: "1px solid #d1fae5",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#047857",
                      margin: "0 0 12px 0",
                      fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                    }}
                  >
                    {group.title}
                  </h4>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: "0",
                      margin: "0",
                    }}
                  >
                    {group.items.map((item: any, itemIndex: number) => (
                      <li
                        key={itemIndex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px 0",
                          fontSize: "16px",
                          fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                          borderBottom:
                            itemIndex < group.items.length - 1
                              ? "1px solid #d1fae5"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#10b981",
                            color: "white",
                            borderRadius: "50%",
                            textAlign: "center",
                            lineHeight: "24px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginLeft: "10px",
                          }}
                        >
                          {itemIndex + 1}
                        </span>
                        <span style={{ color: "#374151" }}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : pageNumber === 1 && dietGroups.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "16px",
                  padding: "20px",
                  fontFamily: "Cairo, Tajawal, Arial, sans-serif",
                }}
              >
                لم يتم تسجيل أي أنظمة غذائية بعد
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "2px solid #e5e7eb",
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            gap: "20px",
            alignItems: "center",
            fontSize: "14px",
            color: "#6b7280",
            fontFamily: "Cairo, Tajawal, Arial, sans-serif",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              تاريخ الطباعة:
            </div>
            <div>{new Date().toLocaleDateString("ar-SA")}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                color: "#f97316",
                marginBottom: "4px",
              }}
            >
              صالة حسام للياقة البدنية
            </div>
            <div style={{ fontSize: "12px" }}>نحو حياة صحية أفضل</div>
            {totalPages > 1 && (
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                صفحة {pageNumber} من {totalPages}
              </div>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              رقم العضوية:
            </div>
            <div
              style={{ fontSize: "16px", fontWeight: "bold", color: "#f97316" }}
            >
              #{member.id}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="enhanced-member-print-content"
      style={{
        backgroundColor: "white",
        fontFamily: "Cairo, Tajawal, Arial, sans-serif",
        direction: "rtl",
        textAlign: "right",
      }}
    >
      {Array.from({ length: totalPages }, (_, index) => renderPage(index + 1))}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .page {
            page-break-after: always;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        @font-face {
          font-family: 'Cairo';
          src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        }
        
        @font-face {
          font-family: 'Tajawal';
          src: url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap');
        }
      `}</style>
    </div>
  );
};

export default EnhancedMemberPrintTemplate;
