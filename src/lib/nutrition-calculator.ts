export interface NutritionGoal {
  type: "weight_loss" | "muscle_gain" | "maintenance" | "fat_loss_muscle_gain";
  name: string;
  description: string;
}

export interface MacroBreakdown {
  protein: number;
  carbs: number;
  fats: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface DailyNutrition {
  calories: number;
  macros: MacroBreakdown;
  water: number; // liters
  fiber: number; // grams
}

export interface MealPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions: string[];
  timing: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface DietRecommendation {
  member: {
    name: string;
    age: number;
    weight: number;
    height: number;
    gender: "male" | "female";
  };
  currentBMI: number;
  idealWeight: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  dailyNutrition: DailyNutrition;
  goalTimeline: string;
  mealPlans: MealPlan[];
  tips: string[];
  warnings: string[];
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_LEVELS = {
  sedentary: 1.2, // قليل الحركة
  light: 1.375, // نشاط خفيف
  moderate: 1.55, // نشاط متوسط
  active: 1.725, // نشاط عالي
  very_active: 1.9, // نشاط عالي جداً
};

// Calculate BMR using Mifflin-St Jeor Equation
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female",
): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(
  bmr: number,
  activityLevel: keyof typeof ACTIVITY_LEVELS = "moderate",
): number {
  return bmr * ACTIVITY_LEVELS[activityLevel];
}

// Calculate BMI
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Get BMI category
export function getBMICategory(bmi: number): {
  category: string;
  color: string;
  description: string;
} {
  if (bmi < 18.5) {
    return {
      category: "نقص في الوزن",
      color: "text-blue-600",
      description: "وزنك أقل من الطبيعي",
    };
  } else if (bmi < 25) {
    return {
      category: "وزن طبيعي",
      color: "text-green-600",
      description: "وزنك في المعدل الطبيعي",
    };
  } else if (bmi < 30) {
    return {
      category: "زيادة في الوزن",
      color: "text-orange-600",
      description: "لديك زيادة في الوزن",
    };
  } else {
    return {
      category: "سمنة",
      color: "text-red-600",
      description: "لديك سمنة، يُنصح بمراجعة طبيب",
    };
  }
}

// Calculate ideal weight range
export function calculateIdealWeight(height: number): {
  min: number;
  max: number;
  average: number;
} {
  const heightInMeters = height / 100;
  const min = 18.5 * heightInMeters * heightInMeters;
  const max = 24.9 * heightInMeters * heightInMeters;
  const average = (min + max) / 2;

  return { min, max, average };
}

// Calculate macro breakdown based on goal
export function calculateMacros(
  calories: number,
  goal: NutritionGoal["type"],
): MacroBreakdown {
  let proteinPercent: number;
  let carbsPercent: number;
  let fatsPercent: number;

  switch (goal) {
    case "weight_loss":
      proteinPercent = 35;
      carbsPercent = 30;
      fatsPercent = 35;
      break;
    case "muscle_gain":
      proteinPercent = 30;
      carbsPercent = 40;
      fatsPercent = 30;
      break;
    case "fat_loss_muscle_gain":
      proteinPercent = 40;
      carbsPercent = 30;
      fatsPercent = 30;
      break;
    default: // maintenance
      proteinPercent = 25;
      carbsPercent = 45;
      fatsPercent = 30;
      break;
  }

  const proteinCalories = (calories * proteinPercent) / 100;
  const carbsCalories = (calories * carbsPercent) / 100;
  const fatsCalories = (calories * fatsPercent) / 100;

  return {
    protein: proteinPercent,
    carbs: carbsPercent,
    fats: fatsPercent,
    proteinGrams: proteinCalories / 4, // 1g protein = 4 calories
    carbsGrams: carbsCalories / 4, // 1g carbs = 4 calories
    fatsGrams: fatsCalories / 9, // 1g fat = 9 calories
  };
}

// Get nutrition goals
export function getNutritionGoals(): NutritionGoal[] {
  return [
    {
      type: "weight_loss",
      name: "فقدان الوزن",
      description: "تقليل السعرات لحرق الدهون المتراكمة",
    },
    {
      type: "muscle_gain",
      name: "زيادة الكتلة العضلية",
      description: "زيادة السعرات والبروتين لبناء العضلات",
    },
    {
      type: "maintenance",
      name: "الحفاظ على الوزن",
      description: "نظام متوازن للحفاظ على الوزن الحالي",
    },
    {
      type: "fat_loss_muscle_gain",
      name: "حرق الدهون وبناء العضلات",
      description: "نظام عالي البروتين لتحسين تركيب الجسم",
    },
  ];
}

// Generate meal plans based on goal and calories
export function generateMealPlans(
  calories: number,
  macros: MacroBreakdown,
  goal: NutritionGoal["type"],
): MealPlan[] {
  const mealPlans: MealPlan[] = [];

  // Breakfast - 25% of daily calories
  const breakfastCalories = Math.round(calories * 0.25);
  mealPlans.push({
    id: "breakfast",
    name: "وجبة الإفطار",
    calories: breakfastCalories,
    protein: Math.round(macros.proteinGrams * 0.25),
    carbs: Math.round(macros.carbsGrams * 0.25),
    fats: Math.round(macros.fatsGrams * 0.25),
    timing: "breakfast",
    ingredients: getBreakfastIngredients(goal),
    instructions: getBreakfastInstructions(goal),
  });

  // Lunch - 35% of daily calories
  const lunchCalories = Math.round(calories * 0.35);
  mealPlans.push({
    id: "lunch",
    name: "وجبة الغداء",
    calories: lunchCalories,
    protein: Math.round(macros.proteinGrams * 0.35),
    carbs: Math.round(macros.carbsGrams * 0.35),
    fats: Math.round(macros.fatsGrams * 0.35),
    timing: "lunch",
    ingredients: getLunchIngredients(goal),
    instructions: getLunchInstructions(goal),
  });

  // Dinner - 30% of daily calories
  const dinnerCalories = Math.round(calories * 0.3);
  mealPlans.push({
    id: "dinner",
    name: "وجبة العشاء",
    calories: dinnerCalories,
    protein: Math.round(macros.proteinGrams * 0.3),
    carbs: Math.round(macros.carbsGrams * 0.3),
    fats: Math.round(macros.fatsGrams * 0.3),
    timing: "dinner",
    ingredients: getDinnerIngredients(goal),
    instructions: getDinnerInstructions(goal),
  });

  // Snack - 10% of daily calories
  const snackCalories = Math.round(calories * 0.1);
  mealPlans.push({
    id: "snack",
    name: "وجبة خفيفة",
    calories: snackCalories,
    protein: Math.round(macros.proteinGrams * 0.1),
    carbs: Math.round(macros.carbsGrams * 0.1),
    fats: Math.round(macros.fatsGrams * 0.1),
    timing: "snack",
    ingredients: getSnackIngredients(goal),
    instructions: getSnackInstructions(goal),
  });

  return mealPlans;
}

// Helper functions for meal ingredients and instructions
function getBreakfastIngredients(goal: NutritionGoal["type"]): string[] {
  const baseIngredients = ["بيض مسلوق أو مقلي", "خبز أسمر", "خضار ورقية"];

  switch (goal) {
    case "weight_loss":
      return [...baseIngredients, "أفوكادو", "طماطم", "خيار"];
    case "muscle_gain":
      return [...baseIngredients, "شوفان", "موز", "عسل طبيعي", "مكسرات"];
    case "fat_loss_muscle_gain":
      return [...baseIngredients, "بروتين باودر", "توت", "لوز"];
    default:
      return [...baseIngredients, "جبن قليل الدسم", "زيتون"];
  }
}

function getBreakfastInstructions(goal: NutritionGoal["type"]): string[] {
  switch (goal) {
    case "weight_loss":
      return [
        "اسلقي البيض واتركيه ينضج جيداً",
        "قطعي الأفوكادو والطماطم والخيار",
        "قدمي مع قطعة من الخبز الأسمر",
      ];
    case "muscle_gain":
      return [
        "حضري الشوفان بالماء أو الحليب",
        "أضيفي الموز المقطع والعسل",
        "اقلي البيض وقدميه مع المكسرات",
      ];
    case "fat_loss_muscle_gain":
      return [
        "امزجي البروتين باودر مع الماء",
        "أضيفي التوت واللوز",
        "قدمي مع البيض المسلوق",
      ];
    default:
      return [
        "حضري البيض المقلي بقليل من الزيت",
        "قدمي مع الجبن والزيتون",
        "تناولي مع الخبز الأسمر",
      ];
  }
}

function getLunchIngredients(goal: NutritionGoal["type"]): string[] {
  const baseIngredients = ["دجاج مشوي أو مسلوق", "أرز أو برغل", "خضار مطبوخة"];

  switch (goal) {
    case "weight_loss":
      return [...baseIngredients, "سلطة خضراء", "ليمون", "زيت زيتون"];
    case "muscle_gain":
      return [...baseIngredients, "بطاطا مسلوقة", "عدس", "خضار متنوعة"];
    case "fat_loss_muscle_gain":
      return [...baseIngredients, "خضار ورقية", "طماطم", "خيار"];
    default:
      return [...baseIngredients, "سلطة", "خبز", "لبن"];
  }
}

function getLunchInstructions(goal: NutritionGoal["type"]): string[] {
  switch (goal) {
    case "weight_loss":
      return [
        "اشوي الدجاج بدون زيت",
        "حضري الأرز بكمية قليلة",
        "اطبخي الخضار بالبخار",
        "قدمي مع السلطة بزيت الزيتون والليمون",
      ];
    case "muscle_gain":
      return [
        "اطبخي الدجاج مع البصل والثوم",
        "حضري الأرز مع العدس",
        "اسلقي البطاطا والخضار",
        "قدمي الوجبة مع كمية كافية من الكربوهيدرات",
      ];
    default:
      return [
        "حضري الدجاج المشوي",
        "اطبخي الأرز أو البرغل",
        "قدمي مع السلطة والخضار",
      ];
  }
}

function getDinnerIngredients(goal: NutritionGoal["type"]): string[] {
  const baseIngredients = ["سمك مشوي أو دجاج", "خضار مشوية", "سلطة"];

  switch (goal) {
    case "weight_loss":
      return [...baseIngredients, "بروكلي", "كوسا", "فلفل ملون"];
    case "muscle_gain":
      return [...baseIngredients, "بطاطا حلوة", "أرز", "مكسرات"];
    case "fat_loss_muscle_gain":
      return [...baseIngredients, "سبانخ", "أفوكادو", "طماطم"];
    default:
      return [...baseIngredients, "خضار متنوعة", "خبز قليل"];
  }
}

function getDinnerInstructions(goal: NutritionGoal["type"]): string[] {
  switch (goal) {
    case "weight_loss":
      return [
        "اشوي السمك بالليمون والأعشاب",
        "اشوي الخضار في الفرن",
        "حضري سلطة خضراء طازجة",
      ];
    case "muscle_gain":
      return [
        "حضري الدجاج المشوي",
        "اشوي البطاطا الحلوة",
        "قدمي مع الأرز والمكسرات",
      ];
    default:
      return [
        "حضري السمك أو الدجاج المشوي",
        "قدمي مع الخضار المشوية",
        "أضيفي السلطة الطازجة",
      ];
  }
}

function getSnackIngredients(goal: NutritionGoal["type"]): string[] {
  switch (goal) {
    case "weight_loss":
      return ["تفاح", "جزر", "خيار", "ماء"];
    case "muscle_gain":
      return ["مكسرات", "تمر", "موز", "حليب"];
    case "fat_loss_muscle_gain":
      return ["بروتين شيك", "توت", "لوز"];
    default:
      return ["فواكه", "مكسرات قليلة", "شاي أخضر"];
  }
}

function getSnackInstructions(goal: NutritionGoal["type"]): string[] {
  switch (goal) {
    case "weight_loss":
      return ["تناولي الفواكه والخضار النيئة", "اشربي كمية كافية من الماء"];
    case "muscle_gain":
      return ["تناولي المكسرات مع التمر", "اشربي الحليب مع الموز"];
    case "fat_loss_muscle_gain":
      return ["حضري البروتين شيك", "أضيفي التوت واللوز"];
    default:
      return ["تناولي الفواكه الطازجة", "اشربي الشاي الأخضر"];
  }
}

// Generate personalized tips
export function generateTips(
  bmi: number,
  goal: NutritionGoal["type"],
  age: number,
): string[] {
  const tips: string[] = [];

  // General tips
  tips.push("اشرب 8-10 أكواب من الماء يومياً");
  tips.push("احرص على النوم 7-8 ساعات يومياً");
  tips.push("مارس الرياضة بانتظام 3-5 مرات في الأسبوع");

  // BMI-based tips
  if (bmi < 18.5) {
    tips.push("ركز على زيادة السعرات الحرارية تدريجياً");
    tips.push("تناول وجبات صغيرة ومتكررة");
  } else if (bmi > 25) {
    tips.push("قلل من السكريات والدهون المشبعة");
    tips.push("زد من كمية الخضار والفواكه");
  }

  // Goal-based tips
  switch (goal) {
    case "weight_loss":
      tips.push("اتبع نظام العجز في السعرات الحرارية");
      tips.push("مارس تمارين الكارديو والمقاومة");
      break;
    case "muscle_gain":
      tips.push("تناول البروتين بعد التمرين مباشرة");
      tips.push("ركز على تمارين رفع الأثقال");
      break;
    case "fat_loss_muscle_gain":
      tips.push("امزج بين تمارين القوة والكارديو");
      tips.push("تناول البروتين في كل وجبة");
      break;
  }

  // Age-based tips
  if (age > 40) {
    tips.push("احرص على تناول الكالسيوم وفيتامين D");
    tips.push("قم بفحوصات دورية للتأكد من سلامتك");
  }

  return tips;
}

// Generate warnings
export function generateWarnings(
  bmi: number,
  age: number,
  targetCalories: number,
): string[] {
  const warnings: string[] = [];

  if (bmi < 16 || bmi > 35) {
    warnings.push("يُنصح بشدة بمراجعة طبيب مختص ق��ل اتباع أي نظام غذائي");
  }

  if (targetCalories < 1200) {
    warnings.push(
      "السعرات الحرارية أقل من الحد الأدنى الآمن، راجع اختصاصي تغذية",
    );
  }

  if (age > 65) {
    warnings.push(
      "كبار السن يحتاجون متابعة طبية خاصة مع أي تغيير في النظام الغذائي",
    );
  }

  if (age < 18) {
    warnings.push("الأطفال والمراهقون يحتاجون نظام غذائي خاص، راجع طبيب أطفال");
  }

  return warnings;
}

// Main function to generate complete diet recommendation
export function generateDietRecommendation(
  member: {
    name: string;
    age: number;
    weight: number;
    height: number;
    gender?: "male" | "female";
  },
  goal: NutritionGoal["type"] = "maintenance",
  activityLevel: keyof typeof ACTIVITY_LEVELS = "moderate",
): DietRecommendation {
  const gender = member.gender || "male"; // Default to male if not specified
  const bmi = calculateBMI(member.weight, member.height);
  const idealWeight = calculateIdealWeight(member.height);
  const bmr = calculateBMR(member.weight, member.height, member.age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  // Adjust calories based on goal
  let targetCalories = tdee;
  switch (goal) {
    case "weight_loss":
      targetCalories = tdee - 500; // 500 calorie deficit
      break;
    case "muscle_gain":
      targetCalories = tdee + 300; // 300 calorie surplus
      break;
    case "fat_loss_muscle_gain":
      targetCalories = tdee - 200; // Small deficit
      break;
  }

  // Ensure minimum calories
  if (targetCalories < 1200) targetCalories = 1200;

  const macros = calculateMacros(targetCalories, goal);
  const mealPlans = generateMealPlans(targetCalories, macros, goal);
  const tips = generateTips(bmi, goal, member.age);
  const warnings = generateWarnings(bmi, member.age, targetCalories);

  const dailyNutrition: DailyNutrition = {
    calories: targetCalories,
    macros,
    water: Math.round(member.weight * 0.035), // 35ml per kg
    fiber: Math.round(targetCalories / 100), // 1g per 100 calories
  };

  // Calculate timeline
  let goalTimeline = "الحفاظ على الوزن الحالي";
  if (goal === "weight_loss" && member.weight > idealWeight.average) {
    const weightToLose = member.weight - idealWeight.average;
    const weeksNeeded = Math.ceil((weightToLose * 7700) / (500 * 7)); // 500 cal deficit per day
    goalTimeline = `فقدان ${weightToLose.toFixed(1)} كيلو في حوالي ${weeksNeeded} أسبوع`;
  } else if (goal === "muscle_gain") {
    goalTimeline = "زيادة 0.5-1 كيلو شهرياً من الكتلة العضلية";
  }

  return {
    member: { ...member, gender },
    currentBMI: bmi,
    idealWeight: idealWeight.average,
    bmr,
    tdee,
    targetCalories,
    dailyNutrition,
    goalTimeline,
    mealPlans,
    tips,
    warnings,
  };
}
