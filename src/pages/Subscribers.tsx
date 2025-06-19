import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Trash2,
  Eye,
  Printer,
  Plus,
  UserPlus,
  Calendar,
  User,
  Phone,
  Weight,
  Ruler,
  FileText,
  GraduationCap,
  Apple,
  AlertCircle,
  Edit,
} from "lucide-react";
import {
  getSubscribers,
  deleteSubscriber,
  getSubscriberWithGroups,
} from "@/lib/database-offline";
import { Subscriber, SubscriberWithGroups } from "@/lib/types-new";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SubscriberPrintCard from "@/components/SubscriberPrintCard";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Subscribers() {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] =
    useState<Subscriber | null>(null);

  // Details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriberWithGroups | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error("Error loading subscribers:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في تحميل البيانات",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (subscriber: Subscriber) => {
    setSubscriberToDelete(subscriber);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (subscriber: Subscriber) => {
    navigate(`/dashboard/edit-subscriber/${subscriber.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriberToDelete) return;

    try {
      await deleteSubscriber(subscriberToDelete.id);
      await loadSubscribers(); // Refresh the list
      setDeleteDialogOpen(false);
      setSubscriberToDelete(null);
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      setError(error instanceof Error ? error.message : "خطأ في حذف المشترك");
    }
  };

  const handleViewDetails = async (subscriber: Subscriber) => {
    try {
      setLoadingDetails(true);
      setDetailsDialogOpen(true);
      const details = await getSubscriberWithGroups(subscriber.id);
      setSelectedSubscriber(details);
    } catch (error) {
      console.error("Error loading subscriber details:", error);
      setError(
        error instanceof Error ? error.message : "خطأ في تحميل تفاصيل المشترك",
      );
      setDetailsDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = async (subscriber: Subscriber) => {
    try {
      // Get full subscriber data with groups
      const fullSubscriber = await getSubscriberWithGroups(subscriber.id);
      if (!fullSubscriber) {
        console.error("Could not load subscriber details for printing");
        return;
      }

      // Create print window with compact design
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>خطة ${fullSubscriber.name} - صالة حسام</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          <div id="print-content">جاري التحميل...</div>
        </body>
        </html>
      `);

      // Import and render compact print component
      setTimeout(async () => {
        try {
          const { default: CompactPrintCard } = await import(
            "@/components/CompactPrintCard"
          );
          const { createRoot } = await import("react-dom/client");

          const printElement = document.createElement("div");
          const root = createRoot(printElement);

          root.render(
            React.createElement(CompactPrintCard, {
              subscriber: fullSubscriber,
            }),
          );

          setTimeout(() => {
            const content =
              printWindow.document.getElementById("print-content");
            if (content && printElement.innerHTML) {
              content.innerHTML = printElement.innerHTML;

              // Auto print after content is loaded
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 500);
            }
          }, 100);
        } catch (error) {
          console.error("Failed to load print component:", error);
          printWindow.document.getElementById("print-content").innerHTML =
            `<div style="text-align: center; padding: 2cm; font-family: Arial;">
              <h2>خطأ في تحميل ورقة الطباعة</h2>
              <p>يرجى المحاولة مرة أخرى</p>
              <button onclick="window.close()">إغلاق</button>
            </div>`;
        }
      }, 500);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.phone && subscriber.phone.includes(searchTerm)),
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "تاريخ غير صحيح";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            جاري تحميل المشتركين...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">المشتركين</h1>
              <p className="text-gray-600">
                إدارة وعرض جميع المشتركين في الصالة
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate("/dashboard/add-subscriber")}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            <UserPlus className="h-5 w-5 ml-2" />
            إضافة مشترك جديد
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="البحث في المشتركين (ا��اسم أو رقم الهاتف)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Subscribers Count */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            عدد المشتركين: {filteredSubscribers.length}
          </h2>
          {searchTerm && (
            <Badge variant="secondary" className="text-sm">
              نتائج البحث: {filteredSubscribers.length} من أصل{" "}
              {subscribers.length}
            </Badge>
          )}
        </div>

        {/* Subscribers Grid */}
        {filteredSubscribers.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مشتركين"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm
                  ? "جرب البحث بكلمات أخرى"
                  : "ابدأ بإضافة أول مشترك في الصالة"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate("/dashboard/add-subscriber")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة مشترك جديد
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscribers.map((subscriber) => (
              <Card
                key={subscriber.id}
                className="hover:shadow-lg transition-all duration-200 border-0 shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg">
                        <User className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 text-right">
                          {subscriber.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {formatDate(subscriber.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Quick Info */}
                  <div className="space-y-2 mb-4">
                    {subscriber.age && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>العمر: {subscriber.age} سنة</span>
                      </div>
                    )}
                    {subscriber.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{subscriber.phone}</span>
                      </div>
                    )}
                    {subscriber.weight && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Weight className="h-4 w-4" />
                        <span>الوزن: {subscriber.weight} كج</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(subscriber)}
                      className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(subscriber)}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(subscriber)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(subscriber)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف المشترك "{subscriberToDelete?.name}"؟
              <br />
              <span className="text-red-600 font-medium">
                هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات
                المرتبطة.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscriber Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">
              تفاصيل المشترك
            </DialogTitle>
            <DialogDescription className="text-right">
              عرض شامل لبيانات المشترك ومجموعاته
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="mr-3">جاري تحميل التفاصيل...</span>
            </div>
          ) : selectedSubscriber ? (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-1">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-right">
                      <User className="h-5 w-5" />
                      المعلومات الأساسية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          الاسم
                        </label>
                        <p className="text-lg font-semibold">
                          {selectedSubscriber.name}
                        </p>
                      </div>
                      {selectedSubscriber.age && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            العمر
                          </label>
                          <p className="text-lg">
                            {selectedSubscriber.age} سنة
                          </p>
                        </div>
                      )}
                      {selectedSubscriber.weight && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            الوزن
                          </label>
                          <p className="text-lg">
                            {selectedSubscriber.weight} كج
                          </p>
                        </div>
                      )}
                      {selectedSubscriber.height && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            الطول
                          </label>
                          <p className="text-lg">
                            {selectedSubscriber.height} سم
                          </p>
                        </div>
                      )}
                      {selectedSubscriber.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            الهاتف
                          </label>
                          <p className="text-lg">{selectedSubscriber.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          تاريخ الاشتراك
                        </label>
                        <p className="text-lg">
                          {formatDate(selectedSubscriber.created_at)}
                        </p>
                      </div>
                    </div>
                    {selectedSubscriber.notes && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600">
                          الملاحظات
                        </label>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                          {selectedSubscriber.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Course Groups */}
                {selectedSubscriber.courseGroups.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <GraduationCap className="h-5 w-5" />
                        مجموعات الكورسات (
                        {selectedSubscriber.courseGroups.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedSubscriber.courseGroups.map((group, index) => (
                          <div
                            key={group.id}
                            className="border rounded-lg p-4 bg-blue-50"
                          >
                            <h4 className="font-semibold text-blue-900 mb-2">
                              {group.title || `مجموعة كورسات ${index + 1}`}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {group.items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 text-sm bg-white p-2 rounded"
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  {item.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Diet Groups */}
                {selectedSubscriber.dietGroups.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <Apple className="h-5 w-5" />
                        مجموعات الأنظمة الغذائية (
                        {selectedSubscriber.dietGroups.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedSubscriber.dietGroups.map((group, index) => (
                          <div
                            key={group.id}
                            className="border rounded-lg p-4 bg-green-50"
                          >
                            <h4 className="font-semibold text-green-900 mb-2">
                              {group.title || `مجموعة غذا��ية ${index + 1}`}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {group.items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 text-sm bg-white p-2 rounded"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {item.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No Groups Message */}
                {selectedSubscriber.courseGroups.length === 0 &&
                  selectedSubscriber.dietGroups.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          لم يتم إضافة مجموعات كورسات أو أنظمة غذائية لهذا
                          المشترك بعد
                        </p>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600">خطأ في تحميل بيانات المشترك</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
