import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Apple,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Eye,
  Copy,
  Download,
  X,
  Utensils,
  Leaf,
  Star,
  Clock,
  TrendingUp,
  Heart,
} from "lucide-react";
import { DietItem } from "@/lib/gym-types";
import {
  getDietItems,
  createDietItem,
  updateDietItem,
  deleteDietItem,
  searchDietItems,
  initializeTables,
} from "@/lib/gym-database";
import DatabaseSetupWarning from "@/components/DatabaseSetupWarning";

// Food categories for better organization
const FOOD_CATEGORIES = [
  { id: "protein", name: "البروتينات", icon: "🥩", color: "red" },
  { id: "carbs", name: "الكربوهيدرات", icon: "🍞", color: "yellow" },
  { id: "fats", name: "الدهون الصحية", icon: "🥑", color: "green" },
  { id: "vegetables", name: "الخضروات", icon: "🥬", color: "green" },
  { id: "fruits", name: "الفواكه", icon: "🍎", color: "red" },
  { id: "dairy", name: "منتجات الألبان", icon: "🥛", color: "blue" },
  { id: "supplements", name: "المكملات", icon: "💊", color: "purple" },
  { id: "beverages", name: "المشروبات", icon: "🧃", color: "orange" },
  { id: "other", name: "أخرى", icon: "🍽️", color: "gray" },
];

export default function DietPlansEnhanced() {
  const [dietItems, setDietItems] = useState<DietItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DietItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<DietItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DietItem | null>(null);
  const [itemToPreview, setItemToPreview] = useState<DietItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other",
  });

  useEffect(() => {
    loadDietItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [dietItems, searchTerm, selectedCategory, sortBy, sortOrder]);

  const loadDietItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsSetup(false);

      try {
        await initializeTables();
      } catch (initError) {
        if (
          initError instanceof Error &&
          initError.message === "TABLES_NOT_EXIST"
        ) {
          setNeedsSetup(true);
          return;
        }
      }

      const itemsData = await getDietItems();
      setDietItems(itemsData);
    } catch (error) {
      console.error("Error loading diet items:", error);
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message === "TABLES_NOT_EXIST")
      ) {
        setNeedsSetup(true);
      } else {
        setError("فشل في تحميل العناصر الغذائية");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = dietItems;

    // Apply search filter
    if (searchTerm) {
      filtered = dietItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Apply category filter (if we had categories)
    // This is for future enhancement when you add category field to the database

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name, "ar");
      } else if (sortBy === "date") {
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  };

  const checkDuplicate = (name: string, excludeId?: string): boolean => {
    return dietItems.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() && item.id !== excludeId,
    );
  };

  const handleAddItem = async () => {
    if (!formData.name.trim()) {
      setError("اسم العنصر الغذائي مطلوب");
      return;
    }

    if (checkDuplicate(formData.name.trim())) {
      setDuplicateError(
        `العنصر الغذائي "${formData.name.trim()}" موجود بالفعل`,
      );
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateError(null);
      await createDietItem(formData.name.trim(), formData.description.trim());
      await loadDietItems();
      setAddDialogOpen(false);
      setFormData({ name: "", description: "", category: "other" });
      setSuccess("تم إضافة العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding diet item:", error);
      setError("فشل في إضافة العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = async () => {
    if (!itemToEdit || !formData.name.trim()) {
      setError("اسم العنصر الغذائي مطلوب");
      return;
    }

    if (checkDuplicate(formData.name.trim(), itemToEdit.id)) {
      setDuplicateError(
        `العنصر الغذائي "${formData.name.trim()}" موجود بالفعل`,
      );
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateError(null);
      await updateDietItem(
        itemToEdit.id,
        formData.name.trim(),
        formData.description.trim(),
      );
      await loadDietItems();
      setEditDialogOpen(false);
      setItemToEdit(null);
      setFormData({ name: "", description: "", category: "other" });
      setSuccess("تم تحديث العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating diet item:", error);
      setError("فشل في تحديث العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsSaving(true);
      await deleteDietItem(itemToDelete.id);
      await loadDietItems();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setSuccess("تم حذف العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting diet item:", error);
      setError("فشل في حذف العنصر الغذائي");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateItem = async (item: DietItem) => {
    const newName = `${item.name} - نسخة`;
    const finalName = checkDuplicate(newName)
      ? `${newName} ${Date.now()}`
      : newName;

    try {
      await createDietItem(finalName, item.description || "");
      await loadDietItems();
      setSuccess("تم نسخ العنصر الغذائي بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error duplicating diet item:", error);
      setError("فشل في نسخ العنصر الغذائي");
    }
  };

  const openEditDialog = (item: DietItem) => {
    setItemToEdit(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: "other", // Default category for now
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item: DietItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = (item: DietItem) => {
    setItemToPreview(item);
    setPreviewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "other" });
    setError(null);
    setDuplicateError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSort = (field: "name" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = FOOD_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.color || "gray";
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = FOOD_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.icon || "🍽️";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              جاري تحميل مكتبة العناصر الغذائية
            </h2>
            <p className="text-gray-600">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <DatabaseSetupWarning onRetry={loadDietItems} />;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <Apple className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {filteredItems.length}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  مكتبة الأنظمة الغذائية
                </h1>
                <p className="text-gray-600 text-lg">
                  إدارة وتنظيم العناصر الغذائية والمكملات
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                  setAddDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة عنصر غذائي
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 shadow-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Enhanced Controls */}
        <Card className="mb-6 shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="البحث في العناصر الغذائية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 text-lg bg-white border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
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

              {/* Controls */}
              <div className="flex gap-2">
                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4 ml-2" />
                        ) : (
                          <SortDesc className="h-4 w-4 ml-2" />
                        )
                      ) : sortOrder === "asc" ? (
                        <SortAsc className="h-4 w-4 ml-2" />
                      ) : (
                        <SortDesc className="h-4 w-4 ml-2" />
                      )}
                      ترتيب
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleSort("name")}>
                      <span className="mr-2">الاسم</span>
                      {sortBy === "name" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        ))}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort("date")}>
                      <span className="mr-2">التاريخ</span>
                      {sortBy === "date" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        ))}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode */}
                <div className="flex rounded-lg border border-gray-200 bg-white">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Food Categories (Future Enhancement) */}
        <Card className="mb-6 shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                الكل ({dietItems.length})
              </Button>
              {FOOD_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  <span className="ml-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {filteredItems.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-20">
              <div className="mb-6">
                <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                  <Apple className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? "لا توجد نتائج" : "ابدأ ببناء مكتبة الأغذية"}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm
                  ? `لم يتم العثور على عناصر غذائية تحتوي على "${searchTerm}"`
                  : "أضف الأطعمة والمكملات الغذائية لبناء برامج غذائية متكاملة"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة أول عنصر غذائي
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 truncate group-hover:text-yellow-100 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 text-green-100">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                          <Utensils className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-3 min-h-[60px]">
                        {item.description || "لا يوجد وصف لهذا العنصر الغذائي"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreviewDialog(item)}
                        className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateItem(item)}
                          >
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                قائمة العناصر الغذائية ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        اسم العنصر
                        {sortBy === "name" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        تاريخ الإضافة
                        {sortBy === "date" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Utensils className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs">
                        <p className="truncate">
                          {item.description || "لا يوجد وصف"}
                        </p>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex flex-col">
                          <span>{formatDate(item.created_at)}</span>
                          <span className="text-xs">
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreviewDialog(item)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(item)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateItem(item)}
                            className="text-gray-600 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(item)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              ➕ إضافة عنصر غذائي جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name" className="text-sm font-medium">
                اسم العنصر الغذائي *
              </Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setDuplicateError(null);
                }}
                placeholder="مثال: دجاج مشوي، بيض مسلوق، شوفان..."
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description" className="text-sm font-medium">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف مفصل للعنصر الغذائي، فوائده، كيفية تناوله..."
                rows={4}
              />
            </div>

            {(error || duplicateError) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {duplicateError || error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={isSaving || !formData.name.trim()}
                className="bg-green-500 hover:bg-green-600"
              >
                {isSaving ? "جاري الحفظ..." : "إضافة العنصر"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setItemToEdit(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              ✏️ تعديل العنصر الغذائي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                اسم العنصر الغذائي *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setDuplicateError(null);
                }}
                placeholder="اسم العنصر الغذائي"
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف العنصر الغذائي..."
                rows={4}
              />
            </div>

            {(error || duplicateError) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {duplicateError || error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditItem}
                disabled={isSaving || !formData.name.trim()}
                className="bg-green-500 hover:bg-green-600"
              >
                {isSaving ? "جاري التحديث..." : "حفظ التعديلات"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              👁️ معاينة العنصر الغذائي
            </DialogTitle>
          </DialogHeader>
          {itemToPreview && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {itemToPreview.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-green-200 text-green-800"
                >
                  عنصر غذائي
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">الوصف:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {itemToPreview.description ||
                      "لا يوجد وصف لهذا العنصر الغذائي"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    معلومات إضافية:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        تم الإنشاء: {formatDate(itemToPreview.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>صحي ومفيد</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setPreviewDialogOpen(false);
                    openEditDialog(itemToPreview);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل العنصر
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDuplicateItem(itemToPreview)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 ml-2" />
                  ن��خ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              هل أنت متأكد من حذف العنصر الغذائي{" "}
              <strong>"{itemToDelete?.name}"</strong>؟
              <br />
              <span className="text-red-600 font-medium">
                لا يمكن التراجع عن هذا الإجراء وقد يؤثر على الخطط الغذائية
                الموجودة.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              {isSaving ? "جاري الحذف..." : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
