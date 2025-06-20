import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Database,
  Bell,
  Palette,
  Info,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DataBackup from "@/components/DataBackup";
import SyncStatus from "@/components/SyncStatus";
import SyncStatistics from "@/components/SyncStatistics";
import DashboardStats from "@/components/DashboardStats";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("data");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">إعدادات النظام</h1>
        <p className="text-muted-foreground">إدارة وتخصيص نظام صالة حسام جم</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="data" className="text-xs sm:text-sm">
            <Database className="w-4 h-4 mr-2" />
            البيانات
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">
            <Bell className="w-4 h-4 mr-2" />
            التنبيهات
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-xs sm:text-sm">
            <Shield className="w-4 h-4 mr-2" />
            المزامنة
          </TabsTrigger>
          <TabsTrigger value="about" className="text-xs sm:text-sm">
            <Info className="w-4 h-4 mr-2" />
            حول النظام
          </TabsTrigger>
        </TabsList>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <DataBackup />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">إدارة التنبيهات</h2>
            <p className="text-muted-foreground">تنبيهات المخزون والنظام</p>
          </div>

          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                إعدادات التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">تنبيهات المخزون المنخفض</h4>
                    <p className="text-sm text-muted-foreground">
                      إشعار عند نفاد أو انخفاض كمية المنتجات
                    </p>
                  </div>
                  <Badge variant="default">مفعل</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">تنبيهات المزامنة</h4>
                    <p className="text-sm text-muted-foreground">
                      إشعارات حالة مزامنة البيانات مع الخادم
                    </p>
                  </div>
                  <Badge variant="default">مفعل</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">المزامنة مع سوبربيس</h2>
            <p className="text-muted-foreground">
              مراقبة وإدارة مزامنة البيانات مع قاعدة بيانات سوبربيس
            </p>
          </div>

          <SyncStatistics />

          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                أمان البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">مزامنة مع سوبربيس</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">النسخ الاحتياطي التلقائي</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">المزامنة الآمنة (HTTPS)</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">العمل في وضع الأوف لاين</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">مزامنة تلقائية كل 5 دقائق</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          {/* System Overview Stats */}
          <div>
            <h2 className="text-2xl font-bold mb-2">نظرة عامة على النظام</h2>
            <p className="text-muted-foreground mb-6">
              إحصائيات شاملة عن جميع بيانات النظام
            </p>
          </div>

          <DashboardStats />
          <div>
            <h2 className="text-2xl font-bold mb-2">حول النظام</h2>
            <p className="text-muted-foreground">
              معلومات النظام والمطورين والدعم الفني
            </p>
          </div>

          <Card className="gym-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-primary" />
                صالة حسام جم - نظام الإدارة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">معلومات النظام</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الإصدار:</span>
                      <span>2.0.0 PWA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تاريخ الإنشاء:</span>
                      <span>2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span>اللغة:</span>
                      <span>العربية</span>
                    </div>
                    <div className="flex justify-between">
                      <span>قاعدة البيانات:</span>
                      <span>IndexedDB + localStorage</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">المزايا المتاحة</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      <span>إدارة المشتركين</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      <span>إدارة الكورسات والأنظمة الغذائية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      <span>إدارة المخزن والمبيعات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      <span>طباعة التقارير والفواتير</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      <span>العمل بدون إنترنت (PWA)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">المواصفات التقنية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>الواجهة:</strong> React + TypeScript
                  </div>
                  <div>
                    <strong>التصميم:</strong> TailwindCSS + Radix UI
                  </div>
                  <div>
                    <strong>PWA:</strong> Service Worker + Offline Support
                  </div>
                  <div>
                    <strong>التخزين:</strong> IndexedDB + localStorage
                  </div>
                  <div>
                    <strong>الطباعة:</strong> CSS Print Media Queries
                  </div>
                  <div>
                    <strong>المتجاوبية:</strong> Mobile-First Design
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gym-card border-success bg-success/5">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-lg mb-2">© 2024 صالة حسام جم</h3>
              <p className="text-muted-foreground">
                نظام إدارة الصالة الرياضية - جميع الحقوق محفوظة
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
