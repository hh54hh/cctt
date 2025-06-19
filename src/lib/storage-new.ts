import { Member, Course, DietPlan, Product, Sale, AuthState } from "./types";
import gymDB from "./database";

// Authentication functions
export async function getAuthState(): Promise<AuthState> {
  try {
    return await gymDB.getAuthState();
  } catch (error) {
    console.error("Error getting auth state:", error);
    return { isAuthenticated: false };
  }
}

export async function saveAuthState(authState: AuthState): Promise<void> {
  try {
    await gymDB.saveAuthState(authState);
  } catch (error) {
    console.error("Error saving auth state:", error);
  }
}

export async function login(): Promise<void> {
  await saveAuthState({ isAuthenticated: true, loginTime: new Date() });
}

export async function logout(): Promise<void> {
  await saveAuthState({ isAuthenticated: false });
}

// Members functions
export async function getMembers(): Promise<Member[]> {
  try {
    return await gymDB.getMembers();
  } catch (error) {
    console.error("Error getting members:", error);
    return [];
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  try {
    return await gymDB.getMemberById(id);
  } catch (error) {
    console.error("Error getting member by ID:", error);
    return null;
  }
}

export async function saveMember(member: Member): Promise<void> {
  try {
    await gymDB.saveMember(member);
  } catch (error) {
    console.error("Error saving member:", error);
    throw error;
  }
}

export async function updateMember(member: Member): Promise<void> {
  try {
    await gymDB.updateMember(member.id, member);
  } catch (error) {
    console.error("Error updating member:", error);
    throw error;
  }
}

export async function deleteMember(id: string): Promise<void> {
  try {
    await gymDB.deleteMember(id);
  } catch (error) {
    console.error("Error deleting member:", error);
    throw error;
  }
}

export async function searchMembers(searchTerm: string): Promise<Member[]> {
  try {
    return await gymDB.searchMembers(searchTerm);
  } catch (error) {
    console.error("Error searching members:", error);
    return [];
  }
}

// Courses functions
export async function getCourses(): Promise<Course[]> {
  try {
    return await gymDB.getCourses();
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
}

export async function saveCourse(course: Course): Promise<void> {
  try {
    await gymDB.saveCourse(course);
  } catch (error) {
    console.error("Error saving course:", error);
    throw error;
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    await gymDB.deleteCourse(id);
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
}

// Diet Plans functions
export async function getDietPlans(): Promise<DietPlan[]> {
  try {
    return await gymDB.getDietPlans();
  } catch (error) {
    console.error("Error getting diet plans:", error);
    return [];
  }
}

export async function saveDietPlan(dietPlan: DietPlan): Promise<void> {
  try {
    await gymDB.saveDietPlan(dietPlan);
  } catch (error) {
    console.error("Error saving diet plan:", error);
    throw error;
  }
}

export async function deleteDietPlan(id: string): Promise<void> {
  try {
    await gymDB.deleteDietPlan(id);
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    throw error;
  }
}

// Products functions
export async function getProducts(): Promise<Product[]> {
  try {
    return await gymDB.getProducts();
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await gymDB.getProductById(id);
  } catch (error) {
    console.error("Error getting product by ID:", error);
    return null;
  }
}

export async function saveProduct(product: Product): Promise<void> {
  try {
    await gymDB.saveProduct(product);
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await gymDB.deleteProduct(id);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function updateProductQuantity(
  id: string,
  quantityChange: number,
): Promise<boolean> {
  try {
    return await gymDB.updateProductQuantity(id, quantityChange);
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return false;
  }
}

// Sales functions
export async function getSales(): Promise<Sale[]> {
  try {
    return await gymDB.getSales();
  } catch (error) {
    console.error("Error getting sales:", error);
    return [];
  }
}

export async function saveSale(sale: Sale): Promise<void> {
  try {
    await gymDB.saveSale(sale);
  } catch (error) {
    console.error("Error saving sale:", error);
    throw error;
  }
}

export async function deleteSale(id: string): Promise<void> {
  try {
    await gymDB.deleteSale(id);
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
}

export async function updateSale(
  id: string,
  updates: Partial<Sale>,
): Promise<void> {
  try {
    await gymDB.updateSale(id, updates);
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
}

export async function searchSales(searchTerm: string): Promise<Sale[]> {
  try {
    return await gymDB.searchSales(searchTerm);
  } catch (error) {
    console.error("Error searching sales:", error);
    return [];
  }
}

// Analytics functions
export async function getRevenueByDateRange(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    return await gymDB.getRevenueByDateRange(startDate, endDate);
  } catch (error) {
    console.error("Error getting revenue by date range:", error);
    return 0;
  }
}

export async function getLowStockProducts(
  threshold: number = 5,
): Promise<Product[]> {
  try {
    return await gymDB.getLowStockProducts(threshold);
  } catch (error) {
    console.error("Error getting low stock products:", error);
    return [];
  }
}

export async function getMembersByDateRange(
  startDate: Date,
  endDate: Date,
): Promise<Member[]> {
  try {
    return await gymDB.getMembersByDateRange(startDate, endDate);
  } catch (error) {
    console.error("Error getting members by date range:", error);
    return [];
  }
}

// Data management functions
export async function exportAllData(): Promise<string> {
  try {
    return await gymDB.exportData();
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
}

export async function importAllData(jsonData: string): Promise<void> {
  try {
    await gymDB.importData(jsonData);
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await gymDB.clearAllData();
  } catch (error) {
    console.error("Error clearing all data:", error);
    throw error;
  }
}

// Initialize sample data (for backward compatibility)
export async function initializeSampleData(): Promise<void> {
  try {
    await gymDB.initializeSampleData();
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}
