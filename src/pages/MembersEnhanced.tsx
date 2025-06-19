import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
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
  Clock,
  ArrowLeft,
  FileText,
  Activity,
  Target,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "@/hooks/use-mobile";
import {
  Subscriber,
  SubscriberWithGroups,
  GroupWithItems,
} from "@/lib/gym-types";
import {
  getSubscribers,
  getSubscriberWithGroups,
  deleteSubscriber,
  initializeTables,
} from "@/lib/gym-database";
import MemberPrintTemplate from "@/components/MemberPrintTemplate";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";
import { showSetupInstructions, showSetupSuccess } from "@/lib/console-helper";

export default function MembersEnhanced() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriberWithGroups | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Subscriber | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [memberToPrint, setMemberToPrint] =
    useState<SubscriberWithGroups | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMobile();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      // Try to initialize tables first
      try {
        await initializeTables();
      } catch (initError) {
        if (
          initError instanceof Error &&
          initError.message === "TABLES_NOT_EXIST"
        ) {
          console.log("Tables don't exist, showing setup screen");
          showSetupInstructions();
          setNeedsSetup(true);
          return;
        }
        console.warn(
          "Table initialization had issues, but continuing:",
          initError,
        );
      }

      // Load subscribers data
      const subscribersData = await getSubscribers();
      setSubscribers(subscribersData);

      if (subscribersData.length === 0) {
        console.log("💡 النظام جاهز! يمكنك الآن إضافة أول مشترك.");
      } else {
        showSetupSuccess();
      }
    } catch (error) {
      console.error("Error loading data:", error);

      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل بيانات المشتركين");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriberDetails = async (subscriberId: string) => {
    try {
      setIsLoadingDetails(true);
      setError(null);

      const subscriberDetails = await getSubscriberWithGroups(subscriberId);
      setSelectedSubscriber(subscriberDetails);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error("Error loading subscriber details:", error);
      setError("فشل في تحميل تفاصيل المشترك");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!memberToDelete) return;

    try {
      await deleteSubscriber(memberToDelete.id);
      setSubscribers((prev) => prev.filter((s) => s.id !== memberToDelete.id));
      if (selectedSubscriber?.id === memberToDelete.id) {
        setSelectedSubscriber(null);
        setDetailsModalOpen(false);
      }
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
    });
  };

  const getSubscriberSummary = (subscriber: Subscriber) => {
    // You can customize this based on actual data
    return `${subscriber.age} سنة • ${subscriber.weight} كيلو`;
  };

  const getTotalGroups = (subscriber: SubscriberWithGroups) => {
    return subscriber.course_groups.length + subscriber.diet_groups.length;
  };

  const getTotalItems = (subscriber: SubscriberWithGroups) => {
    const courseItems = subscriber.course_groups.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );
    const dietItems = subscriber.diet_groups.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );
    return courseItems + dietItems;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              جاري تحميل المشتركين
            </h2>
            <p className="text-gray-600">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadData} />;
  }

  // Mobile Detail Modal/Drawer
  const DetailModal = isMobile ? Drawer : Dialog;
  const DetailContent = isMobile ? DrawerContent : DialogContent;
  const DetailHeader = isMobile ? DrawerHeader : DialogHeader;
  const DetailTitle = isMobile ? DrawerTitle : DialogTitle;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {filteredSubscribers.length}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  المشتركين
                </h1>
                <p className="text-gray-600 text-lg">
                  إدارة وعرض بيانات أعضاء الصالة الرياضية
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/add-member")}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <UserPlus className="w-5 h-5 ml-2" />
              إضافة مشترك جديد
            </Button>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 shadow-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Search Bar */}
          <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="البحث في المشتركين (الاسم، الهاتف)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 text-lg bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Grid */}
        {filteredSubscribers.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-20">
              <div className="mb-6">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? "لا توجد نتائج" : "لا توجد مشتركين"}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm
                  ? `لم يتم العثور على مشتركين تحتوي على "${searchTerm}"`
                  : "ابدأ رحلتك بإضافة أول مشترك في صالة حسام الرياضية"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate("/dashboard/add-member")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة أول مشترك
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubscribers.map((subscriber) => (
              <Card
                key={subscriber.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
                onClick={() => loadSubscriberDetails(subscriber.id)}
              >
                <CardContent className="p-0">
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-1 truncate group-hover:text-yellow-100 transition-colors">
                            {subscriber.name}
                          </h3>
                          <div className="flex items-center gap-2 text-orange-100">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {formatShortDate(subscriber.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          الهاتف
                        </span>
                        <span className="font-medium text-gray-900">
                          {subscriber.phone}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          العمر
                        </span>
                        <span className="font-medium text-gray-900">
                          {subscriber.age} سنة
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Weight className="h-4 w-4" />
                          الوزن
                        </span>
                        <span className="font-medium text-gray-900">
                          {subscriber.weight} كيلو
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSubscriberDetails(subscriber.id);
                        }}
                        className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintMember(subscriber);
                        }}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(subscriber);
                          setDeleteDialogOpen(true);
                        }}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal/Drawer */}
      <DetailModal open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DetailContent
          className={
            isMobile ? "max-h-[95vh]" : "max-w-5xl max-h-[90vh] overflow-y-auto"
          }
        >
          <DetailHeader>
            <DetailTitle className="text-2xl font-bold text-gray-900">
              {selectedSubscriber
                ? `تفاصيل المشترك: ${selectedSubscriber.name}`
                : "تفاصيل المشترك"}
            </DetailTitle>
            {isMobile && (
              <DrawerDescription>
                عرض شامل لجميع بيانات المشترك ومجموعاته
              </DrawerDescription>
            )}
          </DetailHeader>

          {isLoadingDetails ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل التفاصيل...</p>
            </div>
          ) : selectedSubscriber ? (
            <div className="p-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={() => handlePrintMember(selectedSubscriber)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة البيانات
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/dashboard/add-member?edit=${selectedSubscriber.id}`,
                    )
                  }
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل البيانات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMemberToDelete(selectedSubscriber);
                    setDeleteDialogOpen(true);
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف المشترك
                </Button>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                  <TabsTrigger value="info">المعلومات</TabsTrigger>
                  <TabsTrigger value="courses">الكورسات</TabsTrigger>
                  <TabsTrigger value="diet">الأنظمة الغذائية</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quick Stats */}
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <GraduationCap className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold">
                          {selectedSubscriber.course_groups.length}
                        </h3>
                        <p>مجموعات كورسات</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <Apple className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold">
                          {selectedSubscriber.diet_groups.length}
                        </h3>
                        <p>مجموعات غذائية</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <Target className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold">
                          {getTotalItems(selectedSubscriber)}
                        </h3>
                        <p>إجمالي النقاط</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Groups Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Latest Course Groups */}
                    <Card className="border-orange-200">
                      <CardHeader className="bg-orange-50">
                        <CardTitle className="text-orange-800 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          آخر مجموعات الكورسات
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {selectedSubscriber.course_groups
                          .slice(0, 3)
                          .map((group) => (
                            <div key={group.id} className="mb-3 last:mb-0">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {group.title || "مجموعة تمارين"}
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {group.items.slice(0, 3).map((item) => (
                                  <Badge
                                    key={item.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {item.name}
                                  </Badge>
                                ))}
                                {group.items.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{group.items.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        {selectedSubscriber.course_groups.length === 0 && (
                          <p className="text-gray-500 text-center py-4">
                            لا توجد مجموعات كورسات
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Latest Diet Groups */}
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-green-800 flex items-center gap-2">
                          <Apple className="h-5 w-5" />
                          آخر مجموعات الأنظمة الغذائية
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {selectedSubscriber.diet_groups
                          .slice(0, 3)
                          .map((group) => (
                            <div key={group.id} className="mb-3 last:mb-0">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {group.title || "مجموعة غذائية"}
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {group.items.slice(0, 3).map((item) => (
                                  <Badge
                                    key={item.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {item.name}
                                  </Badge>
                                ))}
                                {group.items.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{group.items.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        {selectedSubscriber.diet_groups.length === 0 && (
                          <p className="text-gray-500 text-center py-4">
                            لا توجد مجموعات غذائية
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        المعلومات الشخصية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              الاسم الكامل
                            </label>
                            <p className="text-lg font-semibold text-gray-900">
                              {selectedSubscriber.name}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              العمر
                            </label>
                            <p className="text-lg text-gray-800 flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              {selectedSubscriber.age} سنة
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              الوزن
                            </label>
                            <p className="text-lg text-gray-800 flex items-center gap-2">
                              <Weight className="h-4 w-4 text-gray-500" />
                              {selectedSubscriber.weight} كيلوجرام
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              الطول
                            </label>
                            <p className="text-lg text-gray-800 flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-gray-500" />
                              {selectedSubscriber.height} سم
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              رقم الهاتف
                            </label>
                            <p className="text-lg text-gray-800 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {selectedSubscriber.phone}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              تاريخ الانضمام
                            </label>
                            <p className="text-lg text-gray-800 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              {formatDate(selectedSubscriber.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedSubscriber.notes && (
                        <div className="mt-6">
                          <label className="text-sm font-medium text-gray-600">
                            الملاحظات
                          </label>
                          <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                            <p className="text-gray-800">
                              {selectedSubscriber.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <GraduationCap className="h-6 w-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900">
                      مجموعات الكورسات (
                      {selectedSubscriber.course_groups.length})
                    </h3>
                  </div>

                  {selectedSubscriber.course_groups.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="text-center py-12">
                        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          لا توجد كورسات
                        </h4>
                        <p className="text-gray-600 mb-4">
                          لم يتم إضافة أي مجموعات كورسات لهذا المشترك
                        </p>
                        <Button
                          onClick={() =>
                            navigate(
                              `/dashboard/add-member?edit=${selectedSubscriber.id}`,
                            )
                          }
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة كورسات
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {selectedSubscriber.course_groups.map((group, index) => (
                        <Card
                          key={group.id}
                          className="bg-orange-50 border-orange-200 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-orange-800 mb-1">
                                  {group.title || `مجموعة كورسات ${index + 1}`}
                                </h4>
                                <p className="text-sm text-orange-600 flex items-center gap-1">
                                  <Activity className="h-4 w-4" />
                                  {group.items.length} تمرين
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  تم الإنشاء
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                  {formatDate(group.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {group.items.map((item, itemIndex) => (
                                <Badge
                                  key={item.id}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800 p-2 justify-start"
                                >
                                  <span className="ml-2 text-orange-600 font-bold">
                                    {itemIndex + 1}.
                                  </span>
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Diet Tab */}
                <TabsContent value="diet" className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <Apple className="h-6 w-6 text-green-500" />
                    <h3 className="text-xl font-bold text-gray-900">
                      مجموعات الأنظمة الغذائية (
                      {selectedSubscriber.diet_groups.length})
                    </h3>
                  </div>

                  {selectedSubscriber.diet_groups.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="text-center py-12">
                        <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          لا توجد أنظمة غذائية
                        </h4>
                        <p className="text-gray-600 mb-4">
                          لم يتم إضافة أي مجموعات غذائية لهذا المشترك
                        </p>
                        <Button
                          onClick={() =>
                            navigate(
                              `/dashboard/add-member?edit=${selectedSubscriber.id}`,
                            )
                          }
                          variant="outline"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة نظام غذائي
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {selectedSubscriber.diet_groups.map((group, index) => (
                        <Card
                          key={group.id}
                          className="bg-green-50 border-green-200 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-green-800 mb-1">
                                  {group.title || `مجموعة غذائية ${index + 1}`}
                                </h4>
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                  <Apple className="h-4 w-4" />
                                  {group.items.length} عنصر غذائي
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  تم الإنشاء
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                  {formatDate(group.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {group.items.map((item, itemIndex) => (
                                <Badge
                                  key={item.id}
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 p-2 justify-start"
                                >
                                  <span className="ml-2 text-green-600 font-bold">
                                    {itemIndex + 1}.
                                  </span>
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DetailContent>
      </DetailModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              هل أنت متأكد من حذف المشترك{" "}
              <strong>"{memberToDelete?.name}"</strong>؟
              <br />
              <span className="text-red-600 font-medium">
                سيتم حذف جميع البيانات المرتبطة به نهائياً ولا يمكن التراجع عن
                هذا الإجراء.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscriber}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              طباعة بيانات المشترك
            </DialogTitle>
          </DialogHeader>
          {memberToPrint && <MemberPrintTemplate member={memberToPrint} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
