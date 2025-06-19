import React from "react";
import { Member, Course, DietPlan } from "@/lib/types";
import GymLogo from "./GymLogo";

interface MemberPrintTemplateEnhancedProps {
  member: Member;
  courses: Course[];
  dietPlans: DietPlan[];
}

export const MemberPrintTemplateEnhanced: React.FC<
  MemberPrintTemplateEnhancedProps
> = ({ member, courses, dietPlans }) => {
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB");
  };

  return (
    <div className="print-container" style={{ display: "none" }}>
      <div
        id="member-print-content"
        className="bg-white font-arabic"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          fontSize: "14px",
          lineHeight: "1.6",
          direction: "rtl",
          fontFamily: "Cairo, Tajawal, Arial, sans-serif",
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBF0 100%)",
        }}
      >
        {/* Decorative Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)",
            padding: "2rem",
            borderRadius: "0 0 2rem 2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              left: "-30px",
              width: "150px",
              height: "150px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
            }}
          />

          <div className="flex items-center justify-center relative z-10">
            <div className="flex items-center gap-6">
              <div
                style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "1rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              >
                <GymLogo size="lg" />
              </div>
              <div className="text-center">
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "0.5rem",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  صالة حسام لكمال الأجسام والرشاقة
                </h1>
                <p
                  style={{
                    fontSize: "18px",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: "500",
                  }}
                >
                  بطاقة عضوية مميزة
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Member Card */}
        <div style={{ padding: "2rem" }}>
          {/* Personal Information Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.5rem",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              border: "1px solid #F3F4F6",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "2rem",
                paddingBottom: "1rem",
                borderBottom: "2px solid #F59E0B",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1F2937",
                  margin: "0",
                }}
              >
                🏆 المعلومات الشخصية
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #F59E0B",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "20px", marginLeft: "0.5rem" }}>
                    👤
                  </span>
                  <span style={{ fontWeight: "bold", color: "#92400E" }}>
                    الاسم الكامل:
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#1F2937",
                    fontWeight: "600",
                  }}
                >
                  {member.name}
                </span>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #3B82F6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "20px", marginLeft: "0.5rem" }}>
                    📞
                  </span>
                  <span style={{ fontWeight: "bold", color: "#1E40AF" }}>
                    رقم الهاتف:
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#1F2937",
                    fontWeight: "600",
                  }}
                >
                  {member.phone}
                </span>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #22C55E",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "20px", marginLeft: "0.5rem" }}>
                    🎂
                  </span>
                  <span style={{ fontWeight: "bold", color: "#15803D" }}>
                    العمر:
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#1F2937",
                    fontWeight: "600",
                  }}
                >
                  {member.age} سنة
                </span>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #EC4899",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "20px", marginLeft: "0.5rem" }}>
                    📅
                  </span>
                  <span style={{ fontWeight: "bold", color: "#BE185D" }}>
                    تاريخ الانضمام:
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#1F2937",
                    fontWeight: "600",
                  }}
                >
                  {formatDate(member.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
            }}
          >
            {/* Courses Section */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1.5rem",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                border: "1px solid #F3F4F6",
                minHeight: "400px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  paddingBottom: "1rem",
                  borderBottom: "2px solid #3B82F6",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1F2937",
                    margin: "0",
                  }}
                >
                  💪 البرامج التدريبية
                </h3>
              </div>

              {/* Course Groups */}
              {courseGroups.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  {courseGroups.map((group, index) => (
                    <div
                      key={group.id}
                      style={{
                        background: `linear-gradient(135deg, ${
                          index % 2 === 0 ? "#EFF6FF" : "#F0F9FF"
                        } 0%, ${index % 2 === 0 ? "#DBEAFE" : "#E0F2FE"} 100%)`,
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        marginBottom: "1rem",
                        border: "1px solid #93C5FD",
                      }}
                    >
                      {group.title && (
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#1E40AF",
                            marginBottom: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ marginLeft: "0.5rem" }}>🎯</span>
                          {group.title}
                        </h4>
                      )}
                      <div
                        style={{ paddingRight: group.title ? "1.5rem" : "0" }}
                      >
                        {group.courses.map((course, courseIndex) => (
                          <div
                            key={course.id}
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "white",
                              borderRadius: "0.5rem",
                              marginBottom: "0.3rem",
                              fontSize: "14px",
                              color: "#374151",
                              border: "1px solid #E5E7EB",
                            }}
                          >
                            • {course.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Courses */}
              {memberCourses.length > 0 && (
                <div>
                  {memberCourses.map((course) => (
                    <div
                      key={course.id}
                      style={{
                        background:
                          "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "14px",
                        color: "#374151",
                        border: "1px solid #D1D5DB",
                      }}
                    >
                      • {course.name}
                    </div>
                  ))}
                </div>
              )}

              {memberCourses.length === 0 && courseGroups.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#6B7280",
                    fontSize: "16px",
                    padding: "2rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "48px",
                      display: "block",
                      marginBottom: "1rem",
                    }}
                  >
                    📝
                  </span>
                  لم يتم تحديد برامج تدريبية بعد
                </div>
              )}
            </div>

            {/* Diet Plans Section */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1.5rem",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                border: "1px solid #F3F4F6",
                minHeight: "400px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  paddingBottom: "1rem",
                  borderBottom: "2px solid #10B981",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1F2937",
                    margin: "0",
                  }}
                >
                  🥗 الأنظمة الغذائية
                </h3>
              </div>

              {/* Diet Plan Groups */}
              {dietPlanGroups.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  {dietPlanGroups.map((group, index) => (
                    <div
                      key={group.id}
                      style={{
                        background: `linear-gradient(135deg, ${
                          index % 2 === 0 ? "#ECFDF5" : "#F0FDF4"
                        } 0%, ${index % 2 === 0 ? "#D1FAE5" : "#DCFCE7"} 100%)`,
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        marginBottom: "1rem",
                        border: "1px solid #86EFAC",
                      }}
                    >
                      {group.title && (
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#047857",
                            marginBottom: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ marginLeft: "0.5rem" }}>🍽️</span>
                          {group.title}
                        </h4>
                      )}
                      <div
                        style={{ paddingRight: group.title ? "1.5rem" : "0" }}
                      >
                        {group.dietPlans.map((diet, dietIndex) => (
                          <div
                            key={diet.id}
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "white",
                              borderRadius: "0.5rem",
                              marginBottom: "0.3rem",
                              fontSize: "14px",
                              color: "#374151",
                              border: "1px solid #E5E7EB",
                            }}
                          >
                            • {diet.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Diet Plans */}
              {memberDietPlans.length > 0 && (
                <div>
                  {memberDietPlans.map((diet) => (
                    <div
                      key={diet.id}
                      style={{
                        background:
                          "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "14px",
                        color: "#374151",
                        border: "1px solid #D1D5DB",
                      }}
                    >
                      • {diet.name}
                    </div>
                  ))}
                </div>
              )}

              {memberDietPlans.length === 0 && dietPlanGroups.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#6B7280",
                    fontSize: "16px",
                    padding: "2rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "48px",
                      display: "block",
                      marginBottom: "1rem",
                    }}
                  >
                    🍎
                  </span>
                  لم يتم تحديد أنظمة غذائية بعد
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: "3rem",
              padding: "2rem",
              background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
              borderRadius: "1rem",
              border: "1px solid #E5E7EB",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#EA580C",
                marginBottom: "0.5rem",
              }}
            >
              🏋️‍♂️ نتمنى لك رحلة تدريبية موفقة 🏋️‍♀️
            </div>
            <div style={{ fontSize: "14px", color: "#6B7280" }}>
              للاستفسارات والدعم الفني، يرجى التواصل مع إدارة الصالة
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: "12px",
                color: "#9CA3AF",
                borderTop: "1px solid #E5E7EB",
                paddingTop: "1rem",
              }}
            >
              تم إنشاء هذه البطاقة في: {formatDate(new Date())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPrintTemplateEnhanced;
