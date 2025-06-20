import React, { useState } from "react";
import {
  MoreVertical,
  Eye,
  Trash2,
  Printer,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  phone: string;
  notes?: string;
  created_at: string;
  courses: Array<{
    id: string;
    name: string;
    exercises: string[];
  }>;
  diet: Array<{
    id: string;
    name: string;
    items: string[];
  }>;
}

interface SubscriberCardProps {
  subscriber: Subscriber;
  onDelete: (id: string) => void;
}

export default function SubscriberCard({
  subscriber,
  onDelete,
}: SubscriberCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFirstPoint = () => {
    if (subscriber.courses.length > 0) {
      return `${subscriber.courses.length} كورس تدريبي`;
    }
    if (subscriber.diet.length > 0) {
      return `${subscriber.diet.length} نظام غذائي`;
    }
    return subscriber.notes || "لا توجد معلومات إضافية";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("تعذر فتح نافذة الطباعة");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير المشترك - ${subscriber.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              direction: rtl;
              background: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #16a34a;
              padding-bottom: 20px;
            }
            .logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: #16a34a;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 15px;
              font-size: 20px;
              font-weight: bold;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 5px;
            }
            .subscriber-info {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .subscriber-info h2 {
              margin: 0 0 15px 0;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 15px;
              border-bottom: 1px solid #16a34a;
              padding-bottom: 5px;
            }
            .course-section, .diet-section {
              background: #f8f9fa;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 6px;
              border-right: 4px solid #16a34a;
            }
            .course-section h4, .diet-section h4 {
              color: #16a34a;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .course-section ul, .diet-section ul {
              padding-right: 20px;
              margin: 0;
            }
            .course-section li, .diet-section li {
              margin-bottom: 5px;
              color: #555;
            }
            .signature-area {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .signature-box {
              text-align: center;
              border: 1px solid #ddd;
              padding: 30px 10px;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .container { max-width: none; margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ح ج</div>
              <div class="company-name">صالة حسام جم</div>
              <div>نظام إدارة المشتركين</div>
            </div>

            <div class="subscriber-info">
              <h2>معلومات المشترك</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">الاسم:</span>
                  <span>${subscriber.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">العمر:</span>
                  <span>${subscriber.age} سنة</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الوزن:</span>
                  <span>${subscriber.weight} كغ</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الطول:</span>
                  <span>${subscriber.height} سم</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الهاتف:</span>
                  <span>${subscriber.phone}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">تاريخ الاشتراك:</span>
                  <span>${formatDate(subscriber.created_at)}</span>
                </div>
              </div>
              ${
                subscriber.notes
                  ? `
                <div style="margin-top: 15px;">
                  <div class="info-label">ملاحظات:</div>
                  <div style="margin-top: 5px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                    ${subscriber.notes}
                  </div>
                </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">البرامج التدريبية</div>
              ${
                subscriber.courses && subscriber.courses.length > 0
                  ? subscriber.courses
                      .map(
                        (course) => `
                  <div class="course-section">
                    <h4>${course.name}</h4>
                    <ul>
                      ${course.exercises.map((exercise) => `<li>${exercise}</li>`).join("")}
                    </ul>
                  </div>
                `,
                      )
                      .join("")
                  : '<p style="color: #888; font-style: italic;">لا توجد برامج تدريبية مسجلة</p>'
              }
            </div>

            <div class="section">
              <div class="section-title">الأنظمة الغذائية</div>
              ${
                subscriber.diet && subscriber.diet.length > 0
                  ? subscriber.diet
                      .map(
                        (dietPlan) => `
                  <div class="diet-section">
                    <h4>${dietPlan.name}</h4>
                    <ul>
                      ${dietPlan.items.map((item) => `<li>${item}</li>`).join("")}
                    </ul>
                  </div>
                `,
                      )
                      .join("")
                  : '<p style="color: #888; font-style: italic;">لا توجد أنظمة غذائية مسجلة</p>'
              }
            </div>

            <div class="signature-area">
              <div class="signature-box">
                <div>توقيع المشترك</div>
              </div>
              <div class="signature-box">
                <div>توقيع المدرب</div>
              </div>
              <div class="signature-box">
                <div>إدارة الصالة</div>
              </div>
            </div>

            <div class="footer">
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p>© 2024 صالة حسام جم - جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();

    toast.success("تم إعداد التقرير للطباعة");
  };

  return (
    <>
      <Card className="gym-card group hover:scale-[1.02] transition-transform">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(subscriber.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{subscriber.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(subscriber.created_at)}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة التقرير
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(subscriber.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف المشترك
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">العمر:</span>
              <span>{subscriber.age} سنة</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الوزن:</span>
              <span>{subscriber.weight} كغ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الطول:</span>
              <span>{subscriber.height} سم</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">نبذة:</p>
              <p className="text-sm">{getFirstPoint()}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="secondary" className="text-xs">
                {subscriber.courses?.length || 0} كورس
              </Badge>
              <Badge variant="outline" className="text-xs">
                {subscriber.diet?.length || 0} نظام غذائي
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-2xl" side="left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-right">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(subscriber.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{subscriber.name}</h2>
                <p className="text-sm text-muted-foreground">تفاصيل المشترك</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">المعلومات</TabsTrigger>
                <TabsTrigger value="courses">الكورسات</TabsTrigger>
                <TabsTrigger value="diet">الغذاء</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      الاسم الكامل
                    </label>
                    <p className="font-medium">{subscriber.name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      العمر
                    </label>
                    <p className="font-medium">{subscriber.age} سنة</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      الوزن
                    </label>
                    <p className="font-medium">{subscriber.weight} كغ</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      الطول
                    </label>
                    <p className="font-medium">{subscriber.height} سم</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      رقم الهاتف
                    </label>
                    <p className="font-medium">{subscriber.phone}</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      تاريخ الاشتراك
                    </label>
                    <p className="font-medium">
                      {formatDate(subscriber.created_at)}
                    </p>
                  </div>
                  {subscriber.notes && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        ملاحظات
                      </label>
                      <p className="font-medium">{subscriber.notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {subscriber.courses && subscriber.courses.length > 0 ? (
                    subscriber.courses.map((course) => (
                      <Card
                        key={course.id}
                        className="border-l-4 border-l-primary"
                      >
                        <CardHeader className="pb-3">
                          <h3 className="font-semibold text-lg">
                            {course.name}
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              التمارين:
                            </h4>
                            <ul className="space-y-1">
                              {course.exercises &&
                                course.exercises.map((exercise, index) => (
                                  <li
                                    key={index}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                                    {exercise}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        لا توجد كورسات مسجلة
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        لم يتم تسجيل أي كورسات تدريبية لهذا المشترك بعد
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="diet" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {subscriber.diet && subscriber.diet.length > 0 ? (
                    subscriber.diet.map((dietPlan) => (
                      <Card
                        key={dietPlan.id}
                        className="border-l-4 border-l-green-500"
                      >
                        <CardHeader className="pb-3">
                          <h3 className="font-semibold text-lg">
                            {dietPlan.name}
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              العناصر الغذائية:
                            </h4>
                            <ul className="space-y-1">
                              {dietPlan.items &&
                                dietPlan.items.map((item, index) => (
                                  <li
                                    key={index}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {item}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        لا توجد أنظمة غذائية مسجلة
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        لم يتم تسجيل أي أنظمة غذائية لهذا المشترك بعد
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
