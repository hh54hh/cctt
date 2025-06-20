import React, { useState, useEffect } from "react";
import {
  Cloud,
  Database,
  Users,
  Dumbbell,
  Apple,
  Package,
  ShoppingCart,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  getSyncStats,
  processSyncQueue,
  pullFromSupabase,
  isOnline,
} from "@/lib/syncService";
import { performInitialSync, getSyncStatusCounts } from "@/lib/initialSync";
import { toast } from "sonner";

interface SyncStatsData {
  local: { [key: string]: number };
  cloud: { [key: string]: number };
  pending: number;
}

const tableConfig = {
  subscribers: {
    name: "المشتركين",
    icon: Users,
    color: "text-blue-600",
  },
  groups: {
    name: "المجموعات",
    icon: Dumbbell,
    color: "text-green-600",
  },
  groupItems: {
    name: "عناصر المجموعات",
    icon: Dumbbell,
    color: "text-green-500",
  },
  coursePoints: {
    name: "نقاط التدريب",
    icon: Dumbbell,
    color: "text-purple-600",
  },
  dietItems: {
    name: "عناصر النظام الغذائي",
    icon: Apple,
    color: "text-orange-600",
  },
  products: {
    name: "المنتجات",
    icon: Package,
    color: "text-indigo-600",
  },
  sales: {
    name: "المبيعات",
    icon: ShoppingCart,
    color: "text-pink-600",
  },
};

export default function SyncStatistics() {
  const [stats, setStats] = useState<SyncStatsData>({
    local: {},
    cloud: {},
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      const data = await getSyncStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading sync stats:", error);
      toast.error("فشل في تحميل إحصائيات المزامنة");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleFullSync = async () => {
    if (!isOnline()) {
      toast.error("لا يوجد اتصال بالإنترنت");
      return;
    }

    setIsSyncing(true);
    try {
      await Promise.all([processSyncQueue(), pullFromSupabase()]);

      await loadStats();
      toast.success("تم إج��اء مزامنة كاملة مع سوبربيس");
    } catch (error) {
      console.error("Full sync failed:", error);
      toast.error("فشل في المزامنة الكاملة");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInitialSync = async () => {
    if (!isOnline()) {
      toast.error("لا يوجد اتصال بالإنترنت");
      return;
    }

    setIsSyncing(true);
    try {
      await performInitialSync();
      await loadStats();
    } catch (error) {
      console.error("Initial sync failed:", error);
      toast.error("فشل في المزامنة الأولية");
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateSyncPercentage = (local: number, cloud: number) => {
    if (local === 0 && cloud === 0) return 100;
    if (local === 0) return 0;
    return Math.round((cloud / local) * 100);
  };

  const getTotalLocal = () =>
    Object.values(stats.local).reduce((sum, count) => sum + count, 0);
  const getTotalCloud = () =>
    Object.values(stats.cloud).reduce((sum, count) => sum + count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="mr-2 text-muted-foreground">
              جاري تحميل الإحصائيات...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="w-4 h-4 mr-2 text-blue-600" />
              البيانات المحلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getTotalLocal()}
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي السجلات المحفوظة محلياً
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cloud className="w-4 h-4 mr-2 text-green-600" />
              بيانات سوبربيس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getTotalCloud()}
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي السجلات في سوبربيس
            </p>
            {!isOnline() && (
              <Badge variant="secondary" className="mt-1">
                غير متصل
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              في انتظار المزامنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              عناصر لم يتم مزامنتها بعد
            </p>
            {stats.pending > 0 && (
              <Badge variant="secondary" className="mt-1">
                يحتاج مزامنة
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Control */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">التحكم في المزامنة</CardTitle>
            <div className="flex items-center gap-2">
              {isOnline() ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  متصل
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  غير متصل
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">مزامنة أولية مع سوبربيس</p>
                  <p className="text-sm text-muted-foreground">
                    رفع جميع البيانات المحلية غير المتزامنة إلى سوبربيس
                  </p>
                </div>
                <Button
                  onClick={handleInitialSync}
                  disabled={!isOnline() || isSyncing}
                  size="sm"
                  variant="outline"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      جاري المزامنة...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      مزامنة أولية
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">مزامنة كاملة مع سوبربيس</p>
                  <p className="text-sm text-muted-foreground">
                    رفع جميع البيانات المحلية وتحديث البيانات من سوبربيس
                  </p>
                </div>
                <Button
                  onClick={handleFullSync}
                  disabled={!isOnline() || isSyncing}
                  size="sm"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      جاري المزامنة...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      مزامنة كاملة
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              آخر تحديث: {lastUpdated.toLocaleString("ar-EG")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل المزامنة حسب الجدول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tableConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              const localCount = stats.local[key] || 0;
              const cloudCount = stats.cloud[key] || 0;
              const syncPercentage = calculateSyncPercentage(
                localCount,
                cloudCount,
              );

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${config.color}`} />
                      <span className="font-medium">{config.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <span className="text-muted-foreground">محلي: </span>
                        <span className="font-medium">{localCount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">سوبربيس: </span>
                        <span className="font-medium">{cloudCount}</span>
                      </div>
                      <Badge
                        variant={
                          syncPercentage === 100 ? "default" : "secondary"
                        }
                        className="min-w-[60px] justify-center"
                      >
                        {syncPercentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={syncPercentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sync Queue Information */}
      {stats.pending > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-orange-800">
              <Clock className="w-5 h-5 mr-2" />
              عناصر في انتظار المزامنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-orange-700">
                يوجد {stats.pending} عنصر في قائمة الانتظار للمزامنة مع سوبربيس.
              </p>
              <p className="text-xs text-orange-600">
                ستتم المزامنة تلقائياً عند توفر الاتصال بالإنترنت، أو يمكنك
                الضغط على "مزامنة كاملة" لإجراء المزامنة الآن.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
