import { Member, Course, DietPlan, Product, Sale, AuthState } from "./types";

const STORAGE_KEYS = {
  MEMBERS: "gym-members",
  COURSES: "gym-courses",
  DIET_PLANS: "gym-diet-plans",
  PRODUCTS: "gym-products",
  SALES: "gym-sales",
  AUTH: "gym-auth",
} as const;

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
}

// Auth functions
export function getAuthState(): AuthState {
  return getFromStorage(STORAGE_KEYS.AUTH, { isAuthenticated: false });
}

export function saveAuthState(authState: AuthState): void {
  saveToStorage(STORAGE_KEYS.AUTH, authState);
}

export function login(): void {
  saveAuthState({ isAuthenticated: true, loginTime: new Date() });
}

export function logout(): void {
  saveAuthState({ isAuthenticated: false });
}

// Members functions
export function getMembers(): Member[] {
  try {
    return getFromStorage<Member[]>(STORAGE_KEYS.MEMBERS, []);
  } catch (error) {
    console.error("Error getting members:", error);
    return [];
  }
}

export function saveMember(member: Member): void {
  const members = getMembers();
  const existingIndex = members.findIndex((m) => m.id === member.id);

  if (existingIndex >= 0) {
    members[existingIndex] = { ...member, updatedAt: new Date() };
  } else {
    members.push(member);
  }

  saveToStorage(STORAGE_KEYS.MEMBERS, members);
}

export function deleteMember(id: string): void {
  const members = getMembers().filter((m) => m.id !== id);
  saveToStorage(STORAGE_KEYS.MEMBERS, members);
}

// Courses functions
export function getCourses(): Course[] {
  try {
    return getFromStorage<Course[]>(STORAGE_KEYS.COURSES, []);
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
}

export function saveCourse(course: Course): void {
  const courses = getCourses();
  const existingIndex = courses.findIndex((c) => c.id === course.id);

  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }

  saveToStorage(STORAGE_KEYS.COURSES, courses);
}

export function deleteCourse(id: string): void {
  const courses = getCourses().filter((c) => c.id !== id);
  saveToStorage(STORAGE_KEYS.COURSES, courses);
}

// Diet Plans functions
export function getDietPlans(): DietPlan[] {
  try {
    return getFromStorage<DietPlan[]>(STORAGE_KEYS.DIET_PLANS, []);
  } catch (error) {
    console.error("Error getting diet plans:", error);
    return [];
  }
}

export function saveDietPlan(dietPlan: DietPlan): void {
  const dietPlans = getDietPlans();
  const existingIndex = dietPlans.findIndex((d) => d.id === dietPlan.id);

  if (existingIndex >= 0) {
    dietPlans[existingIndex] = dietPlan;
  } else {
    dietPlans.push(dietPlan);
  }

  saveToStorage(STORAGE_KEYS.DIET_PLANS, dietPlans);
}

export function deleteDietPlan(id: string): void {
  const dietPlans = getDietPlans().filter((d) => d.id !== id);
  saveToStorage(STORAGE_KEYS.DIET_PLANS, dietPlans);
}

// Products functions
export function getProducts(): Product[] {
  try {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const existingIndex = products.findIndex((p) => p.id === product.id);

  if (existingIndex >= 0) {
    products[existingIndex] = { ...product, updatedAt: new Date() };
  } else {
    products.push(product);
  }

  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function updateProductQuantity(
  id: string,
  quantityChange: number,
): boolean {
  const products = getProducts();
  const productIndex = products.findIndex((p) => p.id === id);

  if (productIndex === -1) return false;

  const newQuantity = products[productIndex].quantity + quantityChange;
  if (newQuantity < 0) return false;

  products[productIndex].quantity = newQuantity;
  products[productIndex].updatedAt = new Date();
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  return true;
}

// Sales functions
export function getSales(): Sale[] {
  try {
    return getFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  } catch (error) {
    console.error("Error getting sales:", error);
    return [];
  }
}

export function saveSale(sale: Sale): void {
  const sales = getSales();
  sales.push(sale);
  saveToStorage(STORAGE_KEYS.SALES, sales);
}

// Initialize with sample data if empty
export function initializeSampleData(): void {
  if (getCourses().length === 0) {
    const sampleCourses: Course[] = [
      {
        id: "1",
        name: "تمارين كمال الأجسام المبتدئين",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "تمارين القوة والتحمل",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "تمارين اللياقة البدنية",
        createdAt: new Date(),
      },
    ];

    sampleCourses.forEach(saveCourse);
  }

  if (getDietPlans().length === 0) {
    const sampleDietPlans: DietPlan[] = [
      {
        id: "1",
        name: "نظام غذائي لزيادة الكتلة العضلية",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "نظام غذائي لحرق الدهون",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "نظام غذائي متوازن",
        createdAt: new Date(),
      },
    ];

    sampleDietPlans.forEach(saveDietPlan);
  }
}
