import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Trash2,
  Printer,
  Search,
  Plus,
  User,
  Phone,
  Weight,
  Ruler,
  Calendar,
  StickyNote,
  RefreshCw,
} from "lucide-react";
import { syncService } from "@/lib/sync";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DatabaseDiagnostics } from "@/components/diagnostics/DatabaseDiagnostics";
import { usePrintSubscriber } from "@/components/print/SubscriberPrintTemplate";

interface Subscriber {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  phone: string;
  notes?: string;
  created_at: string;
}

interface SubscriberWithDetails extends Subscriber {
  groups: Array<{
    id: string;
    title?: string;
    type: "course" | "diet";
    group_items: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriberWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { printSubscriber } = usePrintSubscriber();

  const fetchSubscribers = async () => {
    try {
      const data = await syncService.getRecords("subscribers");
      setSubscribers(data || []);
    } catch (error) {
      toast.error("خطأ في جلب بيانات المشتركين");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriberDetails = async (subscriberId: string) => {
    setIsLoadingDetails(true);
    try {
      const data = await syncService.getSubscriberWithDetails(subscriberId);
      setSelectedSubscriber(data);
    } catch (error) {
      toast.error("خطأ في جلب بيانات المشترك");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const deleteSubscriber = async (subscriberId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;

    try {
      await syncService.deleteRecord("subscribers", subscriberId);
      toast.success("تم حذف المشترك بنجاح");
      fetchSubscribers();
    } catch (error) {
      toast.error("خطأ في حذف المشترك");
    }
  };

  const handlePrintSubscriber = () => {
    if (!selectedSubscriber) return;
    printSubscriber(selectedSubscriber);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    syncService.forcSync().then(() => {
      fetchSubscribers();
    });
  };

  useEffect(() => {
    fetchSubscribers();

    // Listen for sync completion
    syncService.onSyncComplete(() => {
      fetchSubscribers();
    });
  }, []);

  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.phone.includes(searchTerm),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">المشتركين</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">المشتركين</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-emerald-600"
          >
            <a href="/add-subscriber">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مشترك جديد
            </a>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="البحث في المشتركين..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Subscribers List */}
      <div className="space-y-4">
        {filteredSubscribers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا يوجد مشتركين
              </h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة أول مشترك لك</p>
              <Button asChild>
                <a href="/add-subscriber">إضافة مشترك جديد</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSubscribers.map((subscriber) => (
            <Card
              key={subscriber.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subscriber.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          تاريخ الاشتراك:{" "}
                          {format(
                            new Date(subscriber.created_at),
                            "dd MMMM yyyy",
                            { locale: ar },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {subscriber.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Weight className="w-4 h-4" />
                        {subscriber.weight} كيلو
                      </span>
                      <span className="flex items-center gap-1">
                        <Ruler className="w-4 h-4" />
                        {subscriber.height} سم
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSubscriberDetails(subscriber.id)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض التفاصيل
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-lg">
                        <SheetHeader>
                          <SheetTitle>تفاصيل المشترك</SheetTitle>
                        </SheetHeader>

                        {isLoadingDetails ? (
                          <div className="space-y-4 mt-6">
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        ) : selectedSubscriber ? (
                          <div className="space-y-6 mt-6">
                            {/* Basic Info */}
                            <div>
                              <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                المعلومات الأساسية
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">الاسم:</span>
                                  <span className="font-medium">
                                    {selectedSubscriber.name}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">العمر:</span>
                                  <span className="font-medium">
                                    {selectedSubscriber.age} سنة
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">الوزن:</span>
                                  <span className="font-medium">
                                    {selectedSubscriber.weight} كيلو
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">الطول:</span>
                                  <span className="font-medium">
                                    {selectedSubscriber.height} سم
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">الهاتف:</span>
                                  <span className="font-medium">
                                    {selectedSubscriber.phone}
                                  </span>
                                </div>
                                {selectedSubscriber.notes && (
                                  <div>
                                    <span className="text-gray-600 block mb-1">
                                      الملاحظات:
                                    </span>
                                    <p className="text-sm bg-gray-50 p-2 rounded">
                                      {selectedSubscriber.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* Groups */}
                            <div>
                              <h3 className="font-semibold mb-3">المجموعات</h3>
                              {selectedSubscriber.groups.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                  لا توجد مجموعات مضافة
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {selectedSubscriber.groups.map((group) => (
                                    <div
                                      key={group.id}
                                      className="border rounded-lg p-3"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          variant={
                                            group.type === "course"
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          {group.type === "course"
                                            ? "تمارين"
                                            : "غذائي"}
                                        </Badge>
                                        <span className="font-medium text-sm">
                                          {group.title ||
                                            (group.type === "course"
                                              ? "مجموعة تمارين"
                                              : "مجموعة غذائية")}
                                        </span>
                                      </div>
                                      {group.group_items.length > 0 && (
                                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                                          {group.group_items.map((item) => (
                                            <li key={item.id}>{item.name}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={handlePrintSubscriber}
                                variant="outline"
                                className="flex-1"
                              >
                                <Printer className="w-4 h-4 ml-1" />
                                طباعة احترافية
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </SheetContent>
                    </Sheet>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSubscriber(subscriber.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* نظام التشخيص */}
      <DatabaseDiagnostics />
    </div>
  );
}
