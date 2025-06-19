import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Apple,
  Plus,
  Trash2,
  Search,
  Save,
  Utensils,
  Users,
  Calendar,
  Heart,
} from "lucide-react";
import { DietPlan } from "@/lib/types";
import {
  getDietPlans,
  saveDietPlan,
  deleteDietPlan,
  getMembers,
} from "@/lib/storage-new";

export default function DietPlans() {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDietPlan, setEditingDietPlan] = useState<DietPlan | null>(null);
  const [dietPlanToDelete, setDietPlanToDelete] = useState<DietPlan | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [followersCounts, setFollowersCounts] = useState<
    Record<string, number>
  >({});

  // Add new diet plan form state
  const [newDietPlanName, setNewDietPlanName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDietPlans();
  }, []);

  const loadDietPlans = async () => {
    try {
      const [dietPlansData, membersData] = await Promise.all([
        getDietPlans(),
        getMembers(),
      ]);

      // Ensure data is valid arrays
      const validDietPlans = Array.isArray(dietPlansData) ? dietPlansData : [];
      const validMembers = Array.isArray(membersData) ? membersData : [];

      setDietPlans(validDietPlans);

      // Calculate followers counts
      const counts: Record<string, number> = {};
      validDietPlans.forEach((dietPlan) => {
        if (dietPlan && dietPlan.id) {
          counts[dietPlan.id] = validMembers.filter(
            (member) =>
              member &&
              Array.isArray(member.dietPlans) &&
              member.dietPlans.includes(dietPlan.id),
          ).length;
        }
      });
      setFollowersCounts(counts);
    } catch (error) {
      console.error("Error loading diet plans:", error);
      setDietPlans([]);
      setFollowersCounts({});
    }
  };

  const filteredDietPlans = Array.isArray(dietPlans)
    ? dietPlans.filter((diet) =>
        diet?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleAddDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDietPlanName.trim()) {
      setError("يجب إدخال اسم النظام الغذائي");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dietPlanData: DietPlan = {
        id: Date.now().toString(),
        name: newDietPlanName.trim(),
        createdAt: new Date(),
      };

      await saveDietPlan(dietPlanData);
      await loadDietPlans();
      setNewDietPlanName("");
    } catch (error) {
      console.error("Error adding diet plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDietPlan = (dietPlan: DietPlan) => {
    setDietPlanToDelete(dietPlan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (dietPlanToDelete) {
      try {
        await deleteDietPlan(dietPlanToDelete.id);
        await loadDietPlans();
        setDeleteDialogOpen(false);
        setDietPlanToDelete(null);
      } catch (error) {
        console.error("Error deleting diet plan:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
          <Apple className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الأنظمة الغذائية</h1>
          <p className="text-gray-600">إضافة وإدارة الأنظمة الغذائية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Utensils className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الأنظمة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dietPlans.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Diet Plan Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-green-600" />
              إضافة نظام غذائي جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDietPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dietPlanName" className="text-right block">
                  اسم النظام الغذائي *
                </Label>
                <Input
                  id="dietPlanName"
                  value={newDietPlanName}
                  onChange={(e) => {
                    setNewDietPlanName(e.target.value);
                    setError("");
                  }}
                  placeholder="مثال: نظام غذائي لحرق الدهون"
                  className="text-right"
                />
                {error && (
                  <p className="text-sm text-red-600 text-right">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    إضافة النظام
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Diet Plans List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الأنظمة الغذائية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </CardContent>
          </Card>

          {/* Diet Plans List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الأنظمة الغذائية</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDietPlans.length === 0 ? (
                <div className="text-center py-8">
                  {dietPlans.length === 0 ? (
                    <div className="space-y-4">
                      <Apple className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          لا توجد أنظمة غذائية حتى الآن
                        </h3>
                        <p className="text-gray-600 mt-1">
                          ابدأ بإضافة أول نظام غذائي
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Search className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          لم يتم العثور على نتائج
                        </h3>
                        <p className="text-gray-600 mt-1">
                          جرب تغيير كلمات البحث
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDietPlans.map((dietPlan) => {
                    const followersCount = followersCounts[dietPlan.id] || 0;

                    return (
                      <div
                        key={dietPlan.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {dietPlan.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                أضيف في{" "}
                                {new Date(
                                  dietPlan.createdAt,
                                ).toLocaleDateString("en-GB")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  followersCount > 0 ? "default" : "secondary"
                                }
                                className={
                                  followersCount > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                {followersCount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDietPlan(dietPlan)}
                          className="text-red-600 border-red-200 hover:bg-red-50 mr-3"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              حذف النظام الغذائي
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف النظام الغذائي "{dietPlanToDelete?.name}"؟ لا
              يمكن التراجع عن هذا الإجراء.
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
