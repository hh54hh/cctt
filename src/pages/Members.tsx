import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Printer,
  Trash2,
  UserPlus,
  User,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import Layout from "@/components/Layout";
import MemberSales from "@/components/MemberSales";
import { db, Subscriber } from "@/lib/database";

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Subscriber[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Subscriber | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm]);

  const loadMembers = () => {
    const allMembers = db.getSubscribers();
    setMembers(allMembers);
  };

  const filterMembers = () => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.includes(searchTerm),
      );
      setFilteredMembers(filtered);
    }
  };

  const handleViewDetails = (member: Subscriber) => {
    setSelectedMember(member);
    setIsDetailsOpen(true);
  };

  const handlePrint = (memberId: string) => {
    navigate(`/print/${memberId}`);
  };

  const handleDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      try {
        await db.deleteSubscriber(memberToDelete);
        loadMembers();
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const getMemberGroups = (memberId: string) => {
    const groups = db.getGroupsBySubscriber(memberId);
    return groups.slice(0, 2); // Show first 2 groups
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              المشتركين
            </h1>
            <p className="text-gray-600 mt-1">
              إدارة ومراجعة بيانات الأعضاء ({filteredMembers.length} عضو)
            </p>
          </div>
          <Button asChild className="gym-button">
            <Link to="/add-member">
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مشترك جديد
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم أو رقم الهاتف..."
                className="pr-10 gym-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const groups = getMemberGroups(member.id);

              return (
                <Card
                  key={member.id}
                  className="gym-card hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gym-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {member.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {member.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>انضم في {formatDate(member.created_at)}</span>
                      </div>

                      {member.age > 0 && (
                        <div className="text-sm text-gray-600">
                          العمر: {member.age} سنة
                        </div>
                      )}

                      {member.weight > 0 && member.height > 0 && (
                        <div className="text-sm text-gray-600">
                          {member.weight} كجم • {member.height} سم
                        </div>
                      )}
                    </div>

                    {/* First training group */}
                    {groups.length > 0 && (
                      <div className="mb-4">
                        <Badge
                          variant={
                            groups[0].type === "course"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {groups[0].title}
                        </Badge>
                        {groups.length > 1 && (
                          <span className="text-xs text-gray-500 mr-2">
                            +{groups.length - 1} مجموعة أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewDetails(member)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>

                      <Button
                        onClick={() => handlePrint(member.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 ml-1" />
                        طباعة
                      </Button>

                      <Button
                        onClick={() => handleDeleteMember(member.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="gym-card">
            <CardContent className="text-center py-16">
              {searchTerm ? (
                <>
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    لا توجد نتائج
                  </h3>
                  <p className="text-gray-600 mb-4">
                    لم يتم العثور على أعضاء يطابقون البحث "{searchTerm}"
                  </p>
                  <Button onClick={() => setSearchTerm("")} variant="outline">
                    مسح البحث
                  </Button>
                </>
              ) : (
                <>
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    لا توجد مشتركين
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ابدأ بإضافة أول عضو في الصالة
                  </p>
                  <Button asChild className="gym-button">
                    <Link to="/add-member">
                      <UserPlus className="w-4 h-4 ml-2" />
                      إضافة أول مشترك
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Member Details Sheet */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent side="left" className="w-full sm:w-[500px] max-w-full">
            {selectedMember && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gym-primary text-white rounded-full flex items-center justify-center font-bold">
                      {selectedMember.name.charAt(0)}
                    </div>
                    {selectedMember.name}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                  <Tabs defaultValue="info" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="info">معلومات العضو</TabsTrigger>
                      <TabsTrigger
                        value="sales"
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        المشتريات
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          المعلومات الأساسية
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">الهاتف:</span>
                            <p className="font-medium">
                              {selectedMember.phone}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              تاريخ الانضمام:
                            </span>
                            <p className="font-medium">
                              {formatDate(selectedMember.created_at)}
                            </p>
                          </div>
                          {selectedMember.age > 0 && (
                            <div>
                              <span className="text-gray-600">العمر:</span>
                              <p className="font-medium">
                                {selectedMember.age} سنة
                              </p>
                            </div>
                          )}
                          {selectedMember.weight > 0 && (
                            <div>
                              <span className="text-gray-600">الوزن:</span>
                              <p className="font-medium">
                                {selectedMember.weight} كجم
                              </p>
                            </div>
                          )}
                          {selectedMember.height > 0 && (
                            <div>
                              <span className="text-gray-600">الطول:</span>
                              <p className="font-medium">
                                {selectedMember.height} سم
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Groups */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          المجموعات التدريبية
                        </h4>
                        {db
                          .getGroupsBySubscriber(selectedMember.id)
                          .map((group) => (
                            <div
                              key={group.id}
                              className="p-3 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={
                                    group.type === "course"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {group.type === "course" ? "تمارين" : "غذاء"}
                                </Badge>
                                <span className="font-medium">
                                  {group.title}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                {db
                                  .getGroupItemsByGroup(group.id)
                                  .map((groupItem) => {
                                    const item =
                                      group.type === "course"
                                        ? db
                                            .getCoursePoints()
                                            .find(
                                              (c) => c.id === groupItem.item_id,
                                            )
                                        : db
                                            .getDietItems()
                                            .find(
                                              (d) => d.id === groupItem.item_id,
                                            );

                                    return item ? (
                                      <div
                                        key={groupItem.id}
                                        className="flex justify-between"
                                      >
                                        <span>{item.name}</span>
                                        <span className="text-gray-500">
                                          {item.description}
                                        </span>
                                      </div>
                                    ) : null;
                                  })}
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Notes */}
                      {selectedMember.notes && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">ملاحظات</h4>
                          <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                            {selectedMember.notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handlePrint(selectedMember.id)}
                          className="w-full gym-button"
                        >
                          <Printer className="w-4 h-4 ml-2" />
                          طباعة بيانات العضو
                        </Button>
                        <Button
                          onClick={() => handleDeleteMember(selectedMember.id)}
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف العضو
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4">
                      <MemberSales memberId={selectedMember.id} />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأك��د الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا العضو؟ سيتم حذف جميع البيانات المرتبطة
                به بما في ذلك المجموعات والمبيعات. هذا الإجراء لا يمكن التراجع
                عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
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
    </Layout>
  );
};

export default Members;
