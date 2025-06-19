import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Target,
  Scale,
  Heart,
  Zap,
  Droplets,
  Clock,
  ChefHat,
  TrendingUp,
  AlertTriangle,
  Info,
  Apple,
  Beef,
  Wheat,
  Activity,
  Calculator,
  BookOpen,
  Utensils,
  Timer,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Member } from "@/lib/types";
import { getMemberById } from "@/lib/storage-new";
import {
  generateDietRecommendation,
  getNutritionGoals,
  getBMICategory,
  type DietRecommendation,
  type NutritionGoal,
} from "@/lib/nutrition-calculator";

export default function NutritionRecommendation() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [selectedGoal, setSelectedGoal] =
    useState<NutritionGoal["type"]>("maintenance");
  const [selectedActivity, setSelectedActivity] = useState<string>("moderate");
  const [recommendation, setRecommendation] =
    useState<DietRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const nutritionGoals = getNutritionGoals();

  useEffect(() => {
    loadMember();
  }, [memberId]);

  useEffect(() => {
    if (member) {
      generateRecommendation();
    }
  }, [member, selectedGoal, selectedActivity]);

  const loadMember = async () => {
    if (!memberId) {
      navigate("/dashboard/members");
      return;
    }

    try {
      setIsLoading(true);
      const memberData = await getMemberById(memberId);
      if (!memberData) {
        navigate("/dashboard/members");
        return;
      }
      setMember(memberData);
    } catch (error) {
      console.error("Error loading member:", error);
      navigate("/dashboard/members");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendation = () => {
    if (!member) return;

    const rec = generateDietRecommendation(
      {
        name: member.name,
        age: member.age,
        weight: member.weight,
        height: member.height,
        gender: member.gender || "male", // Use member's gender or default to male
      },
      selectedGoal,
      selectedActivity as any,
    );
    setRecommendation(rec);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600">
              جاري تحليل البيانات وإنشاء التوصيات...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!member || !recommendation) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            لا يمكن العثور على بيانات العضو أو حدث خطأ في إنشاء التوصيات
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const bmiCategory = getBMICategory(recommendation.currentBMI);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/members")}
            className="hover:bg-orange-50 hover:border-orange-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للأعضاء
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                نظام غذائي مقترح للعضو {member.name}
              </h1>
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
            </div>
            <p className="text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              نظام مخصص ومحسوب بدقة علمية باستخدام الذكاء الاصطناعي
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                الهدف من النظام الغذائي
              </label>
              <Select
                value={selectedGoal}
                onValueChange={(value: any) => setSelectedGoal(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nutritionGoals.map((goal) => (
                    <SelectItem key={goal.type} value={goal.type}>
                      <div className="text-right">
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-sm text-gray-500">
                          {goal.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                مستوى النشاط البدني
              </label>
              <Select
                value={selectedActivity}
                onValueChange={setSelectedActivity}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">
                    قليل الحركة (عمل مكتبي)
                  </SelectItem>
                  <SelectItem value="light">
                    نشاط خفيف (1-3 أيام/أسبوع)
                  </SelectItem>
                  <SelectItem value="moderate">
                    نشاط متوسط (3-5 أيام/أسبوع)
                  </SelectItem>
                  <SelectItem value="active">
                    نشاط عالي (6-7 أيام/أسبوع)
                  </SelectItem>
                  <SelectItem value="very_active">
                    نشاط عالي جداً (مرتين يومياً)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Scale className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-800">
              {member.weight} كغ
            </div>
            <div className="text-sm text-blue-600">الوزن الحالي</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-800">
              {member.height} سم
            </div>
            <div className="text-sm text-green-600">الطول</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-800">
              {member.age} سنة
            </div>
            <div className="text-sm text-purple-600">العمر</div>
          </CardContent>
        </Card>

        <Card
          className={`${
            bmiCategory.color.includes("green")
              ? "bg-green-50 border-green-200"
              : bmiCategory.color.includes("orange")
                ? "bg-orange-50 border-orange-200"
                : bmiCategory.color.includes("red")
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
          }`}
        >
          <CardContent className="p-4 text-center">
            <Target
              className="h-8 w-8 mx-auto mb-2"
              style={{ color: bmiCategory.color.replace("text-", "") }}
            />
            <div
              className="text-2xl font-bold"
              style={{ color: bmiCategory.color.replace("text-", "") }}
            >
              {recommendation.currentBMI.toFixed(1)}
            </div>
            <div
              className="text-sm"
              style={{ color: bmiCategory.color.replace("text-", "") }}
            >
              {bmiCategory.category}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Breakdown */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Calculator className="h-5 w-5 animate-pulse" />
              حساب السعرات الحرارية الذكي
              <Sparkles className="h-4 w-4 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(recommendation.bmr)}
                </div>
                <div className="text-sm text-gray-600">
                  معدل الأيض الأساسي (BMR)
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(recommendation.tdee)}
                </div>
                <div className="text-sm text-gray-600">
                  السعرات المطلوبة (TDEE)
                </div>
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-800 mb-1">
                {Math.round(recommendation.targetCalories)}
              </div>
              <div className="text-sm font-medium text-orange-700">
                السعرات المستهدفة يومياً
              </div>
              <div className="text-xs text-orange-600 mt-1">
                {recommendation.goalTimeline}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macro Breakdown */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Activity className="h-5 w-5" />
              توزيع العناصر الغذائية المتوازن
              <Target className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span className="font-medium">البروتين</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {Math.round(
                      recommendation.dailyNutrition.macros.proteinGrams,
                    )}
                    غ
                  </div>
                  <div className="text-sm text-gray-500">
                    {recommendation.dailyNutrition.macros.protein}%
                  </div>
                </div>
              </div>
              <Progress
                value={recommendation.dailyNutrition.macros.protein}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">الكربوهيدرات</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {Math.round(
                      recommendation.dailyNutrition.macros.carbsGrams,
                    )}
                    غ
                  </div>
                  <div className="text-sm text-gray-500">
                    {recommendation.dailyNutrition.macros.carbs}%
                  </div>
                </div>
              </div>
              <Progress
                value={recommendation.dailyNutrition.macros.carbs}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-500" />
                  <span className="font-medium">الدهون</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {Math.round(recommendation.dailyNutrition.macros.fatsGrams)}
                    غ
                  </div>
                  <div className="text-sm text-gray-500">
                    {recommendation.dailyNutrition.macros.fats}%
                  </div>
                </div>
              </div>
              <Progress
                value={recommendation.dailyNutrition.macros.fats}
                className="h-2"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="font-bold text-blue-800">
                  {recommendation.dailyNutrition.water}L
                </div>
                <div className="text-xs text-blue-600">الماء يومياً</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Zap className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="font-bold text-green-800">
                  {recommendation.dailyNutrition.fiber}غ
                </div>
                <div className="text-xs text-green-600">الألياف يومياً</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            خطة الوجبات اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendation.mealPlans.map((meal) => (
              <Card
                key={meal.id}
                className="bg-gradient-to-b from-gray-50 to-white"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    {meal.name}
                  </CardTitle>
                  <div className="text-2xl font-bold text-orange-600">
                    {meal.calories} سعرة
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-600">
                        {meal.protein}غ
                      </div>
                      <div className="text-red-500">بروتين</div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <div className="font-bold text-yellow-600">
                        {meal.carbs}غ
                      </div>
                      <div className="text-yellow-500">كارب</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">
                        {meal.fats}غ
                      </div>
                      <div className="text-green-500">دهون</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      المكونات:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {meal.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      طريقة التحضير:
                    </h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      {meal.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="font-medium text-orange-500">
                            {index + 1}.
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tips */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <BookOpen className="h-5 w-5" />
              نصائح مهمة للنجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendation.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Warnings */}
        {recommendation.warnings.length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                تحذيرات هامة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        {recommendation.warnings.length === 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="h-5 w-5" />
                معلومات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">
                  الوزن المثالي المقترح: {recommendation.idealWeight.toFixed(1)}{" "}
                  كغ
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">
                  الخطة مصممة خصيصاً لك حسب بياناتك الشخصية
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">
                  لا تتردد في استشارة اختصاصي التغذية لمتابعة أفضل
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          onClick={() => window.print()}
        >
          طباعة النظام الغذائي
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/dashboard/members")}
        >
          العودة للأعضاء
        </Button>
      </div>
    </div>
  );
}
