import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Server,
  HardDrive,
  RotateCcw,
  Users,
  Package,
  ShoppingCart,
  Dumbbell,
  Apple,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { syncService } from "@/lib/sync";
import { indexedDBService } from "@/lib/indexeddb";
import { toast } from "sonner";

interface DiagnosticData {
  // Connection status
  isOnline: boolean;
  supabaseConnected: boolean;
  lastSync: string | null;

  // Local storage stats
  localData: {
    subscribers: number;
    groups: number;
    group_items: number;
    course_points: number;
    diet_items: number;
    products: number;
    sales: number;
    sync_queue: number;
  };

  // Remote database stats
  remoteData: {
    subscribers: number;
    groups: number;
    group_items: number;
    course_points: number;
    diet_items: number;
    products: number;
    sales: number;
  };

  // Sync status
  pendingSyncCount: number;
  isSyncing: boolean;
  syncErrors: string[];
}

export function DatabaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchDiagnostics = async () => {
    try {
      setIsLoading(true);

      // Check connection status
      const isOnline = navigator.onLine;
      let supabaseConnected = false;
      let remoteData = {
        subscribers: 0,
        groups: 0,
        group_items: 0,
        course_points: 0,
        diet_items: 0,
        products: 0,
        sales: 0,
      };

      // Test Supabase connection
      try {
        const { data, error } = await supabase
          .from("subscribers")
          .select("id", { count: "exact", head: true });

        if (!error) {
          supabaseConnected = true;

          // Get remote data counts
          const tables = [
            "subscribers",
            "groups",
            "group_items",
            "course_points",
            "diet_items",
            "products",
            "sales",
          ];
          for (const table of tables) {
            try {
              const { count } = await supabase
                .from(table)
                .select("*", { count: "exact", head: true });
              remoteData[table as keyof typeof remoteData] = count || 0;
            } catch (err) {
              console.warn(`Failed to count ${table}:`, err);
            }
          }
        }
      } catch (error) {
        console.warn("Supabase connection test failed:", error);
      }

      // Get local storage stats
      const localData = await indexedDBService.getStorageInfo();

      // Get sync status
      const pendingSyncCount = await syncService.getPendingSyncCount();
      const isSyncing = syncService.isSyncing();

      // Get last sync time
      const lastSync = localStorage.getItem("last_sync_time");

      const diagnosticData: DiagnosticData = {
        isOnline,
        supabaseConnected,
        lastSync,
        localData,
        remoteData,
        pendingSyncCount,
        isSyncing,
        syncErrors: [], // يمكن إضافة تتبع للأخطاء لاحقاً
      };

      setDiagnostics(diagnosticData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Diagnostics fetch failed:", error);
      toast.error("فشل في جلب بيانات التشخيص");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await syncService.forcSync();
      toast.success("تم تحديث البيانات");
      setTimeout(fetchDiagnostics, 1000); // Refresh after sync
    } catch (error) {
      toast.error("فشل في مزامنة البيانات");
    }
  };

  const clearLocalData = async () => {
    if (!confirm("هل أنت متأكد من مسح جميع البيانات المحلية؟")) return;

    try {
      await syncService.clearAllData();
      toast.success("تم مسح البيانات المحلية");
      fetchDiagnostics();
    } catch (error) {
      toast.error("فشل في مسح البيانات");
    }
  };

  useEffect(() => {
    fetchDiagnostics();

    // Auto refresh every 10 seconds
    const interval = setInterval(fetchDiagnostics, 10000);

    // Listen for sync completion
    syncService.onSyncComplete(() => {
      localStorage.setItem("last_sync_time", new Date().toISOString());
      fetchDiagnostics();
    });

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50"
        size="sm"
        variant="outline"
      >
        <Database className="w-4 h-4" />
        إظهار التشخيص
      </Button>
    );
  }

  const getConnectionStatus = () => {
    if (!diagnostics?.isOnline) {
      return { status: "غير متصل", color: "destructive", icon: WifiOff };
    }
    if (!diagnostics.supabaseConnected) {
      return {
        status: "خطأ في قاعدة البيانات",
        color: "destructive",
        icon: AlertTriangle,
      };
    }
    return { status: "متصل", color: "default", icon: Wifi };
  };

  const getSyncStatus = () => {
    if (!diagnostics) return { status: "غير معروف", color: "secondary" };

    if (diagnostics.isSyncing) {
      return { status: "جاري المزامنة", color: "default" };
    }
    if (diagnostics.pendingSyncCount > 0) {
      return {
        status: `${diagnostics.pendingSyncCount} في الانتظار`,
        color: "secondary",
      };
    }
    return { status: "محدث", color: "default" };
  };

  const connectionStatus = getConnectionStatus();
  const syncStatus = getSyncStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              تشخيص النظام
            </CardTitle>
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>تشخيص شامل للنظام</DialogTitle>
                  </DialogHeader>
                  <DetailedDiagnostics
                    diagnostics={diagnostics}
                    onRefresh={fetchDiagnostics}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              جاري التحديث...
            </div>
          ) : diagnostics ? (
            <>
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الاتصال:</span>
                <Badge
                  variant={connectionStatus.color as any}
                  className="text-xs"
                >
                  <ConnectionIcon className="w-3 h-3 mr-1" />
                  {connectionStatus.status}
                </Badge>
              </div>

              {/* Sync Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">المزامنة:</span>
                <Badge variant={syncStatus.color as any} className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {syncStatus.status}
                </Badge>
              </div>

              {/* Data Summary */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">البيانات المحلية:</span>
                  <span className="font-mono">
                    {Object.values(diagnostics.localData).reduce(
                      (a, b) => a + b,
                      0,
                    )}{" "}
                    عنصر
                  </span>
                </div>
                {diagnostics.supabaseConnected && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">قاعدة البيانات:</span>
                    <span className="font-mono">
                      {Object.values(diagnostics.remoteData).reduce(
                        (a, b) => a + b,
                        0,
                      )}{" "}
                      عنصر
                    </span>
                  </div>
                )}
              </div>

              {/* Last Update */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>آخر تحديث:</span>
                <span className="font-mono">
                  {lastUpdate.toLocaleTimeString("ar-SA")}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleForceSync}
                  disabled={!diagnostics.isOnline}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  مزامنة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDiagnostics}
                  className="text-xs"
                >
                  تحديث
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-500">
              فشل في جلب بيانات التشخيص
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailedDiagnostics({
  diagnostics,
  onRefresh,
}: {
  diagnostics: DiagnosticData | null;
  onRefresh: () => void;
}) {
  if (!diagnostics) {
    return <div>لا توجد بيانات تشخيص متاحة</div>;
  }

  const tables = [
    { key: "subscribers", label: "المشتركين", icon: Users },
    { key: "groups", label: "المجموعات", icon: Database },
    { key: "group_items", label: "عناصر المجموعات", icon: Database },
    { key: "course_points", label: "نقاط الكورسات", icon: Dumbbell },
    { key: "diet_items", label: "العناصر الغذائية", icon: Apple },
    { key: "products", label: "المنتجات", icon: Package },
    { key: "sales", label: "المبيعات", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {diagnostics.isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">حالة الإ��ترنت</span>
            </div>
            <div className="text-sm text-gray-600">
              {diagnostics.isOnline ? "متصل" : "غير متصل"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {diagnostics.supabaseConnected ? (
                <Server className="w-5 h-5 text-green-600" />
              ) : (
                <Server className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">قاعدة البيانات</span>
            </div>
            <div className="text-sm text-gray-600">
              {diagnostics.supabaseConnected ? "متصل" : "غير متصل"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {diagnostics.pendingSyncCount === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">حالة المزامنة</span>
            </div>
            <div className="text-sm text-gray-600">
              {diagnostics.pendingSyncCount === 0
                ? "محدث"
                : `${diagnostics.pendingSyncCount} عملية في الانتظار`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">مقارنة البيانات</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">الجدول</th>
                <th className="text-center p-2">
                  <div className="flex items-center justify-center gap-1">
                    <HardDrive className="w-4 h-4" />
                    محلي
                  </div>
                </th>
                <th className="text-center p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Server className="w-4 h-4" />
                    قاعدة البيانات
                  </div>
                </th>
                <th className="text-center p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => {
                const Icon = table.icon;
                const localCount =
                  diagnostics.localData[
                    table.key as keyof typeof diagnostics.localData
                  ] || 0;
                const remoteCount =
                  diagnostics.remoteData[
                    table.key as keyof typeof diagnostics.remoteData
                  ] || 0;
                const isInSync = localCount === remoteCount;

                return (
                  <tr key={table.key} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {table.label}
                      </div>
                    </td>
                    <td className="text-center p-2 font-mono">{localCount}</td>
                    <td className="text-center p-2 font-mono">
                      {diagnostics.supabaseConnected ? remoteCount : "غير متاح"}
                    </td>
                    <td className="text-center p-2">
                      {diagnostics.supabaseConnected ? (
                        isInSync ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            محدث
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            غير متطابق
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          غير متاح
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Queue */}
      {diagnostics.pendingSyncCount > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">العمليات المعلقة</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">
                  {diagnostics.pendingSyncCount} عملية في انتظار المزامنة
                </span>
              </div>
              <div className="text-sm text-gray-600">
                هذه العمليات ستتم مزامنتها تلقائياً عند توفر الاتصال بالإنترنت
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Sync */}
      {diagnostics.lastSync && (
        <div>
          <h3 className="text-lg font-semibold mb-4">آخر مزامنة</h3>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                آخر مزامنة تمت في:{" "}
                {new Date(diagnostics.lastSync).toLocaleString("ar-SA")}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          تحديث التشخيص
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (diagnostics.isOnline) {
              syncService.forcSync();
            } else {
              toast.error("لا يمكن المزامنة بدون اتصال إنترنت");
            }
          }}
          disabled={!diagnostics.isOnline}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          فرض ا��مزامنة
        </Button>
      </div>
    </div>
  );
}
