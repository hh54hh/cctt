import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  Printer,
  Plus,
  UserPlus,
  Calendar,
  Weight,
  Ruler,
  AlertCircle,
  User,
  GraduationCap,
  Apple,
  ChefHat,
  Sparkles,
  MoreVertical,
} from "lucide-react";
import { Member, Course, DietPlan } from "@/lib/types";
import {
  getMembers,
  deleteMember,
  getCourses,
  getDietPlans,
} from "@/lib/storage-new";
import { getSimpleMembers } from "@/lib/simpleMemberStorage";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import EnhancedMemberPrintTemplate from "@/components/EnhancedMemberPrintTemplate";
import MembersSupabaseStatus from "@/components/MembersSupabaseStatus";
import EmergencySyncFix from "@/components/EmergencySyncFix";

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [memberToShow, setMemberToShow] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [coursesData, dietPlansData] = await Promise.all([
        getCourses(),
        getDietPlans(),
      ]);
      setCourses(coursesData);
      setDietPlans(dietPlansData);

      // Load members simply and safely
      const membersData = await getSimpleMembers();
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const printMember = (member: Member) => {
    // Create a temporary div to render the print template
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    // Render the print template (we'll use a simple approach here)
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بيانات المشترك - ${member.name}</title>
        <style>
          body {
            font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20mm;
            font-size: 14px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #f97316;
            padding-bottom: 20px;
          }
          .header-content {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .logo {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
          }
          .gym-title {
            color: #f97316;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .personal-info {
            margin-bottom: 40px;
            background: #f9fafb;
            padding: 24px;
            border-radius: 8px;
          }
          .personal-info h2 {
            font-size: 22px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 16px;
            text-align: center;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          .info-item {
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            margin-right: 8px;
            color: #111827;
            font-weight: 500;
          }
          .join-date {
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .courses-title {
            color: #1d4ed8;
            border-bottom-color: #bfdbfe;
          }
          .diet-title {
            color: #16a34a;
            border-bottom-color: #bbf7d0;
          }
          .group {
            margin-bottom: 16px;
            padding: 16px;
            border-radius: 8px;
          }
          .course-group {
            background: #eff6ff;
          }
          .diet-group {
            background: #f0fdf4;
          }
          .group-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .course-group-title {
            color: #1e40af;
          }
          .diet-group-title {
            color: #15803d;
          }
          .item-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
          }
          .item-number {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            margin-left: 8px;
          }
          .course-number {
            background: #2563eb;
          }
          .diet-number {
            background: #16a34a;
          }
          .empty-state {
            text-align: center;
            padding: 16px;
            background: #f3f4f6;
            border-radius: 8px;
            color: #6b7280;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 2px solid #d1d5db;
            text-align: center;
          }
          .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            font-size: 12px;
            color: #6b7280;
          }
          .footer-center {
            font-weight: 600;
            color: #f97316;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F07970f70dbda4c93a00aefe2e8b360cb%2F5f65f8b3a8a949ac8a67885487b4dfdf?format=webp&width=200" alt="شعار الصالة" class="logo" />
            <div>
              <div class="gym-title">صالة ��سام لكمال الأجسام والرشاقة</div>
              <div class="subtitle">بطاقة عضوية - معلومات المشترك</div>
            </div>
          </div>
        </div>

        <div class="personal-info">
          <h2>المعلومات الشخصية</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">الاسم:</span>
              <span class="info-value">${member.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">العمر:</span>
              <span class="info-value">${member.age} سنة</span>
            </div>
            <div class="info-item">
              <span class="info-label">الطول:</span>
              <span class="info-value">${member.height} سم</span>
            </div>
            <div class="info-item">
              <span class="info-label">الوزن:</span>
              <span class="info-value">${member.weight} كيلو</span>
            </div>
          </div>
          <div class="join-date">
            <span class="info-label">تاريخ الانضمام:</span>
            <span class="info-value">${new Date(member.createdAt).toLocaleDateString("en-GB")}</span>
          </div>
        </div>

        <div class="two-column">
          <div class="section">
            <h3 class="section-title courses-title">الكورسات التدريبية</h3>
            ${
              member.courseGroups && member.courseGroups.length > 0
                ? member.courseGroups
                    .map(
                      (group, index) => `
                <div class="group course-group">
                  ${group.title ? `<div class="group-title course-group-title">${group.title}</div>` : `<div class="group-title course-group-title">مجموعة ${index + 1}</div>`}
                  <ul class="item-list">
                    ${group.courseIds
                      .map((courseId, courseIndex) => {
                        const course = courses.find((c) => c.id === courseId);
                        return `<li class="item">
                        <span class="item-number course-number">${courseIndex + 1}</span>
                        <span>${course?.name || courseId}</span>
                      </li>`;
                      })
                      .join("")}
                  </ul>
                </div>
              `,
                    )
                    .join("")
                : member.courses && member.courses.length > 0
                  ? `<div class="group course-group">
                  <div class="group-title course-group-title">الكورسات الفردية:</div>
                  <ul class="item-list">
                    ${member.courses
                      .map((courseId, index) => {
                        const course = courses.find((c) => c.id === courseId);
                        return `<li class="item">
                        <span class="item-number course-number">${index + 1}</span>
                        <span>${course?.name || courseId}</span>
                      </li>`;
                      })
                      .join("")}
                  </ul>
                </div>`
                  : '<div class="empty-state">لم يتم تسجيل أي كورسات بعد</div>'
            }
          </div>

          <div class="section">
            <h3 class="section-title diet-title">الأنظمة الغذائية</h3>
            ${
              member.dietPlanGroups && member.dietPlanGroups.length > 0
                ? member.dietPlanGroups
                    .map(
                      (group, index) => `
                <div class="group diet-group">
                  ${group.title ? `<div class="group-title diet-group-title">${group.title}</div>` : `<div class="group-title diet-group-title">مجموعة ${index + 1}</div>`}
                  <ul class="item-list">
                    ${group.dietPlanIds
                      .map((dietId, dietIndex) => {
                        const diet = dietPlans.find((d) => d.id === dietId);
                        return `<li class="item">
                        <span class="item-number diet-number">${dietIndex + 1}</span>
                        <span>${diet?.name || dietId}</span>
                      </li>`;
                      })
                      .join("")}
                  </ul>
                </div>
              `,
                    )
                    .join("")
                : member.dietPlans && member.dietPlans.length > 0
                  ? `<div class="group diet-group">
                  <div class="group-title diet-group-title">الأنظمة الفردية:</div>
                  <ul class="item-list">
                    ${member.dietPlans
                      .map((dietId, index) => {
                        const diet = dietPlans.find((d) => d.id === dietId);
                        return `<li class="item">
                        <span class="item-number diet-number">${index + 1}</span>
                        <span>${diet?.name || dietId}</span>
                      </li>`;
                      })
                      .join("")}
                  </ul>
                </div>`
                  : '<div class="empty-state">لم يتم تسجيل أي أنظمة غذائية بعد</div>'
            }
          </div>
        </div>

        <div class="footer">
          <div class="footer-grid">
            <div>
              <p><strong>تاريخ الطباعة:</strong></p>
              <p>${new Date().toLocaleDateString("en-GB")}</p>
            </div>
            <div class="footer-center">
              <p><strong>صالة حسام للياقة البدنية</strong></p>
              <p>نحو حياة صحية أفضل</p>
            </div>
            <div>
              <p><strong>رقم العضوية:</strong></p>
              <p>#${member.id}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Clean up
    document.body.removeChild(tempDiv);

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleShowMemberDetails = (member: Member) => {
    setMemberToShow(member);
    setDetailsDialogOpen(true);
  };

  // حالة رسالة التجديد
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [memberToRenew, setMemberToRenew] = useState<Member | null>(null);
  const [renewalSuccess, setRenewalSuccess] = useState<string | null>(null);

  // تجديد اشتراك العضو
  const handleRenewSubscription = (member: Member) => {
    setMemberToRenew(member);
    setRenewalDialogOpen(true);
  };

  const confirmRenewal = async () => {
    if (!memberToRenew) return;

    try {
      const currentDate = new Date();
      const newSubscriptionEnd = new Date();
      newSubscriptionEnd.setMonth(newSubscriptionEnd.getMonth() + 1);

      const updatedMember = {
        ...memberToRenew,
        subscriptionStart: currentDate,
        subscriptionEnd: newSubscriptionEnd,
        updatedAt: new Date(),
      };

      // استيراد دالة التحديث من المخزن
      const { updateMember } = await import("@/lib/storage-new");
      await updateMember(updatedMember);
      await loadData(); // إعادة تحميل البيانات

      setRenewalDialogOpen(false);
      setMemberToRenew(null);

      // إظهار رسالة نجاح
      setRenewalSuccess(
        `✅ تم تجديد اشتراك ${updatedMember.name} بنجاح!\n📅 الاشتراك الجديد ينتهي في: ${newSubscriptionEnd.toLocaleDateString("en-GB")}`,
      );

      // إخفاء رسالة النجاح بعد 5 ثوان
      setTimeout(() => setRenewalSuccess(null), 5000);
    } catch (error) {
      console.error("Error renewing subscription:", error);
      setRenewalDialogOpen(false);
      setMemberToRenew(null);
    }
  };

  // التحقق من انتهاء الاشتراك
  const isSubscriptionExpired = (member: Member) => {
    if (!member.subscriptionEnd) return false;
    const today = new Date();
    const subscriptionEnd = new Date(member.subscriptionEnd);
    return today > subscriptionEnd;
  };

  // حساب الأيام المتبقية في الاشتراك
  const getDaysRemaining = (member: Member) => {
    if (!member.subscriptionEnd) return null;
    const today = new Date();
    const subscriptionEnd = new Date(member.subscriptionEnd);
    const diffTime = subscriptionEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      try {
        await deleteMember(memberToDelete.id);
        await loadData();
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const handlePrintMember = async (member: Member) => {
    // Create temporary container for rendering React component
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    document.body.appendChild(tempContainer);

    // Dynamic import React and ReactDOM
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");

    // Create root and render the enhanced print template
    const root = createRoot(tempContainer);

    root.render(
      React.createElement(EnhancedMemberPrintTemplate, {
        member,
        courses,
        dietPlans,
      }),
    );

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get the enhanced print content
    const printContent = document.getElementById(
      "enhanced-member-print-content",
    );

    if (printContent) {
      // Create new window for printing
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        // Clone content and make it visible
        const clonedContent = printContent.cloneNode(true) as HTMLElement;
        clonedContent.style.display = "block";

        // Write complete HTML document with enhanced styles
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>بطاقة عضوية - ${member.name}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              html, body {
                font-family: 'Cairo', 'Tajawal', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
                direction: rtl;
                background: white;
                color: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
                width: 100%;
                height: 100%;
              }

              @media print {
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 210mm;
                  height: 297mm;
                }

                @page {
                  size: A4;
                  margin: 0;
                }

                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }

                .page {
                  page-break-after: always;
                  page-break-inside: avoid;
                }

                .page:last-child {
                  page-break-after: auto;
                }
              }

              /* Ensure all backgrounds and colors print correctly */
              [style*="background"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            ${clonedContent.outerHTML}
          </body>
          </html>
        `);

        printWindow.document.close();

        // Wait for fonts and content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();

            // Close window after printing
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }, 500);
        };

        // Fallback if onload doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 2000);
      }
    }

    // Clean up temporary container
    setTimeout(() => {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الأعضاء</h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-600">عرض وإدارة جميع أعضاء الصالة</p>
              <MembersSupabaseStatus />
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate("/dashboard/add-member-enhanced")}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          إضافة مشترك جديد
        </Button>
      </div>

      {/* Renewal Success Message */}
      {renewalSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-900">تجديد الاشتراك</h3>
                <p className="text-sm text-green-700 whitespace-pre-line">
                  {renewalSuccess}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenewalSuccess(null)}
                className="text-green-600"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Sync Fix */}
      <EmergencySyncFix />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث عن عضو بالاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الأعضاء</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الأعضاء النشطون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredMembers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">اليوم</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            {members.length === 0 ? (
              <div className="space-y-4">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    لا يوجد أعضاء حتى الآن
                  </h3>
                  <p className="text-gray-600 mt-1">
                    ابدأ بإضافة أول عضو في الصالة
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/dashboard/add-member-enhanced")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة عضو جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Search className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    لم يتم العثور على نتائج
                  </h3>
                  <p className="text-gray-600 mt-1">جرب تغيير كلمات البحث</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            return (
              <Card
                key={member.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 text-right">
                        {member.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        📅 عضو منذ{" "}
                        {new Date(member.createdAt).toLocaleDateString("en-GB")}
                      </p>

                      {/* حالة الاشتراك */}
                      <div className="mt-2">
                        {member.subscriptionEnd ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isSubscriptionExpired(member)
                                  ? "bg-red-100 text-red-700"
                                  : getDaysRemaining(member)! <= 7
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {isSubscriptionExpired(member) ? (
                                <>⚠️ منتهي الصلاحية</>
                              ) : getDaysRemaining(member)! <= 7 ? (
                                <>
                                  ⏰ ينتهي خلال {getDaysRemaining(member)} يوم
                                </>
                              ) : (
                                <>
                                  ✅ نشط ({getDaysRemaining(member)} يوم متبقي)
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            🔄 يحتاج تحديث بيانات الاشتراك
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {member.age}
                      </div>
                      <div className="text-gray-500 text-xs">سنة</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Ruler className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {member.height}
                      </div>
                      <div className="text-gray-500 text-xs">سم</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Weight className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {member.weight}
                      </div>
                      <div className="text-gray-500 text-xs">كيلو</div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      الكورسات:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        // Get all courses (individual + from groups)
                        const individualCourses = (member.courses || [])
                          .map((courseId) => {
                            const course = courses?.find(
                              (c) => c.id === courseId,
                            );
                            return course
                              ? {
                                  id: courseId,
                                  name: course.name,
                                  type: "individual",
                                }
                              : null;
                          })
                          .filter(Boolean);

                        const groupCourses = (
                          member.courseGroups || []
                        ).flatMap((group) =>
                          group.courseIds
                            .map((courseId) => {
                              const course = courses?.find(
                                (c) => c.id === courseId,
                              );
                              return course
                                ? {
                                    id: courseId,
                                    name: `${group.title ? group.title + ": " : ""}${course.name}`,
                                    type: "group",
                                  }
                                : null;
                            })
                            .filter(Boolean),
                        );

                        const allCourses = [
                          ...individualCourses,
                          ...groupCourses,
                        ];

                        if (allCourses.length === 0) {
                          return (
                            <span className="text-xs text-gray-500">
                              لا يوجد كورسات
                            </span>
                          );
                        }

                        return (
                          <>
                            {allCourses.slice(0, 2).map((item, index) => (
                              <Badge
                                key={`${item.type}-${item.id}-${index}`}
                                variant="secondary"
                                className={`text-xs ${
                                  item.type === "group"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {item.name}
                              </Badge>
                            ))}
                            {allCourses.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{allCourses.length - 2}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Diet Plans */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      الأنظمة الغذائية:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        // Get all diet plans (individual + from groups)
                        const individualDiets = (member.dietPlans || [])
                          .map((dietId) => {
                            const diet = dietPlans?.find(
                              (d) => d.id === dietId,
                            );
                            return diet
                              ? {
                                  id: dietId,
                                  name: diet.name,
                                  type: "individual",
                                }
                              : null;
                          })
                          .filter(Boolean);

                        const groupDiets = (
                          member.dietPlanGroups || []
                        ).flatMap((group) =>
                          group.dietPlanIds
                            .map((dietId) => {
                              const diet = dietPlans?.find(
                                (d) => d.id === dietId,
                              );
                              return diet
                                ? {
                                    id: dietId,
                                    name: `${group.title ? group.title + ": " : ""}${diet.name}`,
                                    type: "group",
                                  }
                                : null;
                            })
                            .filter(Boolean),
                        );

                        const allDiets = [...individualDiets, ...groupDiets];

                        if (allDiets.length === 0) {
                          return (
                            <span className="text-xs text-gray-500">
                              لا يوجد أنظمة غذائية
                            </span>
                          );
                        }

                        return (
                          <>
                            {allDiets.slice(0, 2).map((item, index) => (
                              <Badge
                                key={`${item.type}-${item.id}-${index}`}
                                variant="secondary"
                                className={`text-xs ${
                                  item.type === "group"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {item.name}
                              </Badge>
                            ))}
                            {allDiets.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{allDiets.length - 2}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 pt-2">
                    {/* ��ر التعديل */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() =>
                        navigate(
                          `/dashboard/add-member-enhanced?edit=${member.id}`,
                        )
                      }
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      تعديل
                    </Button>

                    {/* زر الطباعة */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => handlePrintMember(member)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      طباعة
                    </Button>

                    {/* قائمة الخيارات */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleShowMemberDetails(member)}
                          className="text-green-600 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/dashboard/nutrition-recommendation/${member.id}`,
                            )
                          }
                          className="text-orange-600 cursor-pointer bg-gradient-to-r from-orange-50 to-amber-50 focus:from-orange-100 focus:to-amber-100 font-medium border-b border-orange-200"
                        >
                          <div className="flex items-center">
                            <ChefHat className="h-4 w-4 mr-2" />
                            <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                            <span>نظام غذائي ذكي ✨</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {(member.subscriptionEnd &&
                          isSubscriptionExpired(member)) ||
                        !member.subscriptionEnd ? (
                          <DropdownMenuItem
                            onClick={() => handleRenewSubscription(member)}
                            className="text-green-600 cursor-pointer"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            تجديد الاشتراك
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRenewSubscription(member)}
                            className="text-blue-600 cursor-pointer"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            تمديد الاشتراك
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 cursor-pointer focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف العضو
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Member Details Dialog */}
      <AlertDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-2xl font-bold">
              تفاصيل العضو - {memberToShow?.name}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {memberToShow && (
            <div className="space-y-6 p-4">
              {/* Personal Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  المعلومات الشخصية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">
                      الاسم الكامل:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {memberToShow.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">العمر:</span>
                    <p className="text-lg text-gray-900">
                      {memberToShow.age} سنة
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium text-gray-700">
                      تاريخ الانضمام:
                    </span>
                    <p className="text-lg text-gray-900">
                      {new Date(memberToShow.createdAt).toLocaleDateString(
                        "en-GB",
                      )}
                    </p>
                  </div>
                  {memberToShow.height && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">الطول:</span>
                      <p className="text-lg text-gray-900">
                        {memberToShow.height} سم
                      </p>
                    </div>
                  )}
                  {memberToShow.weight && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">الوزن:</span>
                      <p className="text-lg text-gray-900">
                        {memberToShow.weight} كيلو
                      </p>
                    </div>
                  )}

                  {/* معلومات الاشتراك */}
                  {memberToShow.subscriptionStart && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">
                        بداية الاشتراك:
                      </span>
                      <p className="text-lg text-gray-900">
                        {new Date(
                          memberToShow.subscriptionStart,
                        ).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  )}
                  {memberToShow.subscriptionEnd && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">
                        انتهاء الاشتراك:
                      </span>
                      <p
                        className={`text-lg font-semibold ${
                          isSubscriptionExpired(memberToShow)
                            ? "text-red-600"
                            : getDaysRemaining(memberToShow)! <= 7
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {new Date(
                          memberToShow.subscriptionEnd,
                        ).toLocaleDateString("en-GB")}
                        {isSubscriptionExpired(memberToShow) && " (منتهي)"}
                        {!isSubscriptionExpired(memberToShow) &&
                          ` (${getDaysRemaining(memberToShow)} يوم متبقي)`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Courses Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    البرامج التدريبية
                  </h3>

                  {/* Course Groups */}
                  {memberToShow.courseGroups &&
                    memberToShow.courseGroups.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-md font-semibold text-purple-700 mb-3">
                          مجموعات الكورسات:
                        </h4>
                        {memberToShow.courseGroups.map((group, index) => (
                          <div
                            key={group.id}
                            className="mb-3 p-3 bg-white rounded-lg border border-purple-100"
                          >
                            {group.title && (
                              <h5 className="font-semibold text-purple-600 mb-2">
                                {group.title}
                              </h5>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {group.courseIds.map((courseId) => {
                                const course = courses?.find(
                                  (c) => c.id === courseId,
                                );
                                return course ? (
                                  <Badge
                                    key={courseId}
                                    variant="secondary"
                                    className="bg-purple-100 text-purple-700"
                                  >
                                    {course.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Individual Courses */}
                  {memberToShow.courses && memberToShow.courses.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-purple-700 mb-3">
                        كورسات فردية:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {memberToShow.courses.map((courseId) => {
                          const course = courses?.find(
                            (c) => c.id === courseId,
                          );
                          return course ? (
                            <Badge
                              key={courseId}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              {course.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {(!memberToShow.courses ||
                    memberToShow.courses.length === 0) &&
                    (!memberToShow.courseGroups ||
                      memberToShow.courseGroups.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        لم يتم تسجيل أي برامج تدريبية
                      </p>
                    )}
                </div>

                {/* Diet Plans Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <Apple className="h-5 w-5 mr-2" />
                    الأنظمة الغذائية
                  </h3>

                  {/* Diet Plan Groups */}
                  {memberToShow.dietPlanGroups &&
                    memberToShow.dietPlanGroups.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-md font-semibold text-green-700 mb-3">
                          مجموعات الأنظمة الغذائية:
                        </h4>
                        {memberToShow.dietPlanGroups.map((group, index) => (
                          <div
                            key={group.id}
                            className="mb-3 p-3 bg-white rounded-lg border border-green-100"
                          >
                            {group.title && (
                              <h5 className="font-semibold text-green-600 mb-2">
                                {group.title}
                              </h5>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {group.dietPlanIds.map((dietId) => {
                                const diet = dietPlans?.find(
                                  (d) => d.id === dietId,
                                );
                                return diet ? (
                                  <Badge
                                    key={dietId}
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    {diet.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Individual Diet Plans */}
                  {memberToShow.dietPlans &&
                    memberToShow.dietPlans.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-green-700 mb-3">
                          أنظمة غذائية فردية:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {memberToShow.dietPlans.map((dietId) => {
                            const diet = dietPlans?.find(
                              (d) => d.id === dietId,
                            );
                            return diet ? (
                              <Badge
                                key={dietId}
                                variant="secondary"
                                className="bg-orange-100 text-orange-700"
                              >
                                {diet.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                  {(!memberToShow.dietPlans ||
                    memberToShow.dietPlans.length === 0) &&
                    (!memberToShow.dietPlanGroups ||
                      memberToShow.dietPlanGroups.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        لم يتم تحديد أي أنظمة غذائية
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إغلاق</AlertDialogCancel>
            {memberToShow && (
              <>
                <Button
                  onClick={() => {
                    handlePrintMember(memberToShow);
                    setDetailsDialogOpen(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  طباعة
                </Button>
                <Button
                  onClick={() => {
                    handleRenewSubscription(memberToShow);
                    setDetailsDialogOpen(false);
                  }}
                  className={`${
                    isSubscriptionExpired(memberToShow) ||
                    (getDaysRemaining(memberToShow) &&
                      getDaysRemaining(memberToShow)! <= 7)
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  تجديد الاشتراك
                </Button>
                <Button
                  onClick={() => {
                    navigate(
                      `/dashboard/add-member-enhanced?edit=${memberToShow.id}`,
                    );
                    setDetailsDialogOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renewal Confirmation Dialog */}
      <AlertDialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              تجديد الاشتراك
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-right space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800 mb-2">
                    تفاصيل العملية:
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">العضو:</span>{" "}
                      {memberToRenew?.name}
                    </div>
                    {memberToRenew?.subscriptionEnd && (
                      <div>
                        <span className="font-semibold">
                          الاشتراك الحالي ينتهي في:
                        </span>{" "}
                        {new Date(
                          memberToRenew.subscriptionEnd,
                        ).toLocaleDateString("en-GB")}
                        {isSubscriptionExpired(memberToRenew) && (
                          <span className="text-red-600 font-semibold">
                            {" "}
                            (منتهي)
                          </span>
                        )}
                      </div>
                    )}
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="font-semibold text-green-700">
                        📅 الاشتراك الجديد سيبدأ من:{" "}
                        {new Date().toLocaleDateString("en-GB")}
                      </div>
                      <div className="font-semibold text-green-700">
                        📅 الاشتراك الجديد سينتهي في:{" "}
                        {new Date(
                          new Date().setMonth(new Date().getMonth() + 1),
                        ).toLocaleDateString("en-GB")}
                      </div>
                      <div className="font-semibold text-orange-600">
                        ⏰ مدة الاشتراك: شهر واحد (30 يوم)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-gray-700">
                  عند النقر على "تأكيد التجديد" سيتم:
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 mr-4">
                  <li>تجديد اشتراك العضو لمدة شهر إضافي</li>
                  <li>تحديث تاريخ بدء الاشتراك لليوم الحالي</li>
                  <li>تحديث تاريخ انتهاء الاشتراك للشهر القادم</li>
                  <li>تحديث حالة العضو في النظام</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRenewal}
              className="bg-green-600 hover:bg-green-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              تأكيد التجديد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف العضو
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف العضو "{memberToDelete?.name}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
