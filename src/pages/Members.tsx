import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Users,
  Search,
  Trash2,
  Eye,
  Printer,
  Plus,
  UserPlus,
  Calendar,
  Weight,
  Ruler,
  Phone,
  User,
  GraduationCap,
  Apple,
  Edit,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Subscriber, SubscriberWithGroups } from "@/lib/gym-types";
import {
  getSubscribers,
  getSubscriberWithGroups,
  deleteSubscriber,
  initializeTables,
} from "@/lib/gym-database-enhanced";
import MemberPrintTemplateCompact from "@/components/MemberPrintTemplateCompact";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";
import { offlineManager } from "@/lib/offline-manager";

export default function Members() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriberWithGroups | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Subscriber | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [memberToPrint, setMemberToPrint] =
    useState<SubscriberWithGroups | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      offlineManager.syncPendingOperations();
      loadData(); // Refresh data when back online
    };

    const handleOffline = () => setIsOnline(false);

    const updatePendingOps = async () => {
      const ops = await offlineManager.getPendingOperations();
      setPendingOps(ops.length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dataRefreshNeeded", updatePendingOps);

    // Check pending operations periodically
    updatePendingOps();
    const interval = setInterval(updatePendingOps, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dataRefreshNeeded", updatePendingOps);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      try {
        await initializeTables();
      } catch (initError) {
        if (
          initError instanceof Error &&
          (initError.message === "TABLES_NOT_EXIST" ||
            initError.message.includes("Network error"))
        ) {
          console.log(
            "Tables don't exist or network error, showing setup screen",
          );
          setNeedsSetup(true);
          return;
        }
        console.warn(
          "Table initialization had issues, but continuing:",
          initError,
        );
      }

      const subscribersData = await getSubscribers();
      setSubscribers(subscribersData);

      if (subscribersData.length === 0 && isOnline) {
        console.log("💡 النظام جاهز! يمكنك الآن إضافة أول مشترك.");
      }
    } catch (error) {
      console.error("Error loading data:", error);

      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST" ||
          error.message.includes("Network error") ||
          error.message.includes("Failed to fetch"))
      ) {
        setNeedsSetup(true);
      } else {
        setError(
          "فشل في تحميل بيانات المشتركين" +
            (isOnline ? "" : " - وضع عدم الاتصال"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriberDetails = async (subscriberId: string) => {
    try {
      const subscriberDetails = await getSubscriberWithGroups(subscriberId);
      setSelectedSubscriber(subscriberDetails);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading subscriber details:", error);
      setError("فشل في تحميل تفاصيل المشترك");
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!memberToDelete) return;

    try {
      await deleteSubscriber(memberToDelete.id);

      if (!isOnline) {
        setSuccess(
          "تم حفظ عملية الحذف محلياً - ستتم المزامنة عند عودة الإنترنت",
        );
      } else {
        setSuccess("تم حذف المشترك بنجاح");
      }

      // Refresh the list
      await loadData();

      if (selectedSubscriber?.id === memberToDelete.id) {
        setSelectedSubscriber(null);
        setDetailsDialogOpen(false);
      }

      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      setError("فشل في حذف المشترك");
    }
  };

  const handlePrintMember = async (subscriber: Subscriber) => {
    try {
      const subscriberDetails = await getSubscriberWithGroups(subscriber.id);
      if (subscriberDetails) {
        setMemberToPrint(subscriberDetails);
        setPrintDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading subscriber for printing:", error);
      setError("فشل في تحضير بيانات الطباعة");
    }
  };

  const handleEditMember = (subscriber: Subscriber) => {
    // Navigate to enhanced add member page with edit mode
    navigate(`/dashboard/add-member?edit=${subscriber.id}`);
  };

  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.phone.includes(searchTerm),
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              جاري الاتصال بقاعدة البيانات...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              يرجى التأكد من الاتصال بالإنترنت
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with offline/online status */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    المشتركين
                  </h1>
                  {!isOnline && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <WifiOff className="h-4 w-4" />
                      <span>غير متصل</span>
                      {pendingOps > 0 && (
                        <span className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs">
                          {pendingOps}
                        </span>
                      )}
                    </div>
                  )}
                  {isOnline && pendingOps > 0 && (
                    <div className="flex items-center gap-1 text-blue-600 text-sm">
                      <Wifi className="h-4 w-4 animate-pulse" />
                      <span>مزامنة {pendingOps} عملية</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600">إدارة وعرض بيانات المشتركين</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/add-member")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              <UserPlus className="w-5 h-5 ml-2" />
              إضافة مشترك جديد
            </Button>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!isOnline && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <WifiOff className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                وضع عدم الاتصال - يمكنك الاستمرار في العمل. ستتم مزامنة البيانات
                عند عودة الإنترنت.
                {pendingOps > 0 && ` (${pendingOps} عملية معلقة)`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث عن مشترك (الاسم أو رقم الهاتف)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-white border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              قائمة المشتركين ({filteredSubscribers.length})
              {!isOnline && (
                <span className="text-sm font-normal text-amber-600 mr-2">
                  (البيانات المحفوظة محلياً)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد مشتركين"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate("/dashboard/add-member")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول مشترك
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">الوزن</TableHead>
                    <TableHead className="text-right">الطول</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">تاريخ الاشتراك</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {subscriber.name}
                          {subscriber.id.startsWith("temp_") && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              محلي
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{subscriber.age} سنة</TableCell>
                      <TableCell>{subscriber.weight} كيلو</TableCell>
                      <TableCell>{subscriber.height} سم</TableCell>
                      <TableCell>{subscriber.phone}</TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(subscriber.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadSubscriberDetails(subscriber.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMember(subscriber)}
                            className="text-green-600 hover:text-green-700"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintMember(subscriber)}
                            className="text-purple-600 hover:text-purple-700"
                            title="طباعة"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMemberToDelete(subscriber);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تفاصيل المشترك: {selectedSubscriber?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSubscriber && (
            <div className="p-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="info">المعلومات الأساسية</TabsTrigger>
                  <TabsTrigger value="courses">الكورسات</TabsTrigger>
                  <TabsTrigger value="diet">الأنظمة الغذائية</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        الاسم الكامل
                      </label>
                      <p className="text-lg font-semibold">
                        {selectedSubscriber.name}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        العمر
                      </label>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {selectedSubscriber.age} سنة
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        الوزن
                      </label>
                      <p className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-500" />
                        {selectedSubscriber.weight} كيلو
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        الطول
                      </label>
                      <p className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-500" />
                        {selectedSubscriber.height} سم
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        رقم الهاتف
                      </label>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {selectedSubscriber.phone}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        تاريخ الإنشاء
                      </label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(selectedSubscriber.created_at)}
                      </p>
                    </div>
                  </div>
                  {selectedSubscriber.notes && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        الملاحظات
                      </label>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedSubscriber.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setDetailsDialogOpen(false);
                        handleEditMember(selectedSubscriber);
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل المشترك
                    </Button>
                    <Button
                      onClick={() => handlePrintMember(selectedSubscriber)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Printer className="w-4 h-4 ml-2" />
                      طباعة البيانات
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="courses" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">مجموعات الكورسات</h3>
                  </div>

                  {selectedSubscriber.course_groups.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">لا توجد كورسات مضافة</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedSubscriber.course_groups.map((group) => (
                        <Card
                          key={group.id}
                          className="bg-orange-50 border-orange-200"
                        >
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-orange-800 mb-2">
                              {group.title || "مجموعة تمارين"}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {group.items.map((item) => (
                                <Badge
                                  key={item.id}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-700"
                                >
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              تم الإنشاء: {formatDate(group.created_at)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="diet" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Apple className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">
                      مجموعات الأنظمة الغذائية
                    </h3>
                  </div>

                  {selectedSubscriber.diet_groups.length === 0 ? (
                    <div className="text-center py-8">
                      <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        لا توجد أنظمة غذائية مضافة
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedSubscriber.diet_groups.map((group) => (
                        <Card
                          key={group.id}
                          className="bg-green-50 border-green-200"
                        >
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-green-800 mb-2">
                              {group.title || "مجموعة غذائية"}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {group.items.map((item) => (
                                <Badge
                                  key={item.id}
                                  variant="secondary"
                                  className="bg-green-100 text-green-700"
                                >
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              تم الإنشاء: {formatDate(group.created_at)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المشترك "{memberToDelete?.name}"؟ سيتم حذف
              جميع البيانات المرتبطة به نهائياً.
              {!isOnline && (
                <div className="mt-2 text-amber-600 text-sm">
                  سيتم حفظ عملية الحذف محلياً وتنفيذها عند عودة الإنترنت.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscriber}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طباعة بيانات المشترك</DialogTitle>
          </DialogHeader>
          {memberToPrint && (
            <MemberPrintTemplateCompact member={memberToPrint} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
