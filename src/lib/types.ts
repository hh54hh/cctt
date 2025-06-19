export interface CourseGroup {
  id: string;
  title?: string; // Optional title for the group
  courseIds: string[];
  createdAt: Date;
}

export interface DietPlanGroup {
  id: string;
  title?: string; // Optional title for the group
  dietPlanIds: string[];
  createdAt: Date;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  gender?: "male" | "female"; // Optional gender field for better nutrition calculations
  courses: string[]; // Keep for backward compatibility
  dietPlans: string[]; // Keep for backward compatibility
  courseGroups: CourseGroup[]; // New grouped courses
  dietPlanGroups: DietPlanGroup[]; // New grouped diet plans
  subscriptionStart: Date; // تاريخ بدء الاشتراك
  subscriptionEnd: Date; // تاريخ انتهاء الاشتراك
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  name: string;
  createdAt: Date;
}

export interface DietPlan {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number; // per unit
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  buyerName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  loginTime?: Date;
}
