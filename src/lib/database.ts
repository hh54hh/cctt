import { Member, Course, DietPlan, Product, Sale, AuthState } from "./types";

// Database configuration
const DB_NAME = "GymManagementDB";
const DB_VERSION = 1;

// Store names
const STORES = {
  MEMBERS: "members",
  COURSES: "courses",
  DIET_PLANS: "dietPlans",
  PRODUCTS: "products",
  SALES: "sales",
  AUTH: "auth",
  SETTINGS: "settings",
} as const;

interface DatabaseError {
  message: string;
  code?: string;
}

class GymDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  // Initialize database
  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(
          new Error(`فشل في فتح قاعدة البيانات: ${request.error?.message}`),
        );
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
          const membersStore = db.createObjectStore(STORES.MEMBERS, {
            keyPath: "id",
          });
          membersStore.createIndex("name", "name", { unique: false });
          membersStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.COURSES)) {
          const coursesStore = db.createObjectStore(STORES.COURSES, {
            keyPath: "id",
          });
          coursesStore.createIndex("name", "name", { unique: false });
          coursesStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.DIET_PLANS)) {
          const dietPlansStore = db.createObjectStore(STORES.DIET_PLANS, {
            keyPath: "id",
          });
          dietPlansStore.createIndex("name", "name", { unique: false });
          dietPlansStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS, {
            keyPath: "id",
          });
          productsStore.createIndex("name", "name", { unique: false });
          productsStore.createIndex("quantity", "quantity", { unique: false });
          productsStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const salesStore = db.createObjectStore(STORES.SALES, {
            keyPath: "id",
          });
          salesStore.createIndex("buyerName", "buyerName", { unique: false });
          salesStore.createIndex("productId", "productId", { unique: false });
          salesStore.createIndex("createdAt", "createdAt", { unique: false });
          salesStore.createIndex("totalPrice", "totalPrice", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.AUTH)) {
          db.createObjectStore(STORES.AUTH, { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };
    });
  }

  // Generic database operations
  private async executeTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (stores: IDBObjectStore[]) => Promise<T>,
  ): Promise<T> {
    if (!this.db) {
      throw new Error("قاعدة البيانات غير مهيأة");
    }

    const transaction = this.db.transaction(storeNames, mode);
    const stores = Array.isArray(storeNames)
      ? storeNames.map((name) => transaction.objectStore(name))
      : [transaction.objectStore(storeNames)];

    return new Promise((resolve, reject) => {
      transaction.onerror = () => {
        reject(new Error(`خطأ في المعاملة: ${transaction.error?.message}`));
      };

      operation(stores).then(resolve).catch(reject);
    });
  }

  // Members operations
  async getMembers(): Promise<Member[]> {
    return this.executeTransaction(
      STORES.MEMBERS,
      "readonly",
      async ([store]) => {
        return new Promise<Member[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async getMemberById(id: string): Promise<Member | null> {
    return this.executeTransaction(
      STORES.MEMBERS,
      "readonly",
      async ([store]) => {
        return new Promise<Member | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async saveMember(member: Member): Promise<void> {
    return this.executeTransaction(
      STORES.MEMBERS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put({
            ...member,
            updatedAt: new Date(),
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<void> {
    return this.executeTransaction(
      STORES.MEMBERS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          // First get the existing member
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const existingMember = getRequest.result;
            if (existingMember) {
              // Merge updates with existing data
              const updatedMember = { ...existingMember, ...updates };
              const updateRequest = store.put(updatedMember);
              updateRequest.onsuccess = () => resolve();
              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              reject(new Error("Member not found"));
            }
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      },
    );
  }

  async deleteMember(id: string): Promise<void> {
    return this.executeTransaction(
      STORES.MEMBERS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async searchMembers(searchTerm: string): Promise<Member[]> {
    const allMembers = await this.getMembers();
    return allMembers.filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  // Courses operations
  async getCourses(): Promise<Course[]> {
    return this.executeTransaction(
      STORES.COURSES,
      "readonly",
      async ([store]) => {
        return new Promise<Course[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async saveCourse(course: Course): Promise<void> {
    return this.executeTransaction(
      STORES.COURSES,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(course);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async deleteCourse(id: string): Promise<void> {
    return this.executeTransaction(
      STORES.COURSES,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  // Diet Plans operations
  async getDietPlans(): Promise<DietPlan[]> {
    return this.executeTransaction(
      STORES.DIET_PLANS,
      "readonly",
      async ([store]) => {
        return new Promise<DietPlan[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async saveDietPlan(dietPlan: DietPlan): Promise<void> {
    return this.executeTransaction(
      STORES.DIET_PLANS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(dietPlan);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async deleteDietPlan(id: string): Promise<void> {
    return this.executeTransaction(
      STORES.DIET_PLANS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  // Products operations
  async getProducts(): Promise<Product[]> {
    return this.executeTransaction(
      STORES.PRODUCTS,
      "readonly",
      async ([store]) => {
        return new Promise<Product[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.executeTransaction(
      STORES.PRODUCTS,
      "readonly",
      async ([store]) => {
        return new Promise<Product | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async saveProduct(product: Product): Promise<void> {
    return this.executeTransaction(
      STORES.PRODUCTS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put({
            ...product,
            updatedAt: new Date(),
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async deleteProduct(id: string): Promise<void> {
    return this.executeTransaction(
      STORES.PRODUCTS,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async updateProductQuantity(
    id: string,
    quantityChange: number,
  ): Promise<boolean> {
    try {
      return await this.executeTransaction(
        STORES.PRODUCTS,
        "readwrite",
        async ([store]) => {
          return new Promise<boolean>((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
              const product = getRequest.result;
              if (!product) {
                resolve(false);
                return;
              }

              const newQuantity = product.quantity + quantityChange;
              if (newQuantity < 0) {
                resolve(false);
                return;
              }

              product.quantity = newQuantity;
              product.updatedAt = new Date();

              const putRequest = store.put(product);
              putRequest.onsuccess = () => resolve(true);
              putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
          });
        },
      );
    } catch (error) {
      console.error("خطأ في تحديث كمية المنتج:", error);
      return false;
    }
  }

  // Sales operations
  async getSales(): Promise<Sale[]> {
    return this.executeTransaction(
      STORES.SALES,
      "readonly",
      async ([store]) => {
        return new Promise<Sale[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async saveSale(sale: Sale): Promise<void> {
    return this.executeTransaction(
      STORES.SALES,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(sale);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async deleteSale(id: string): Promise<void> {
    return this.executeTransaction(
      STORES.SALES,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<void> {
    return this.executeTransaction(
      STORES.SALES,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const sale = getRequest.result;
            if (!sale) {
              reject(new Error("المبيعة غير موجودة"));
              return;
            }

            const updatedSale = { ...sale, ...updates };
            const putRequest = store.put(updatedSale);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      },
    );
  }

  async searchSales(searchTerm: string): Promise<Sale[]> {
    const allSales = await this.getSales();
    return allSales.filter(
      (sale) =>
        sale.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  // Analytics and reports
  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const sales = await this.getSales();
    return sales
      .filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= startDate && saleDate <= endDate;
      })
      .reduce((total, sale) => total + sale.totalPrice, 0);
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter((product) => product.quantity <= threshold);
  }

  async getMembersByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Member[]> {
    const members = await this.getMembers();
    return members.filter((member) => {
      const memberDate = new Date(member.createdAt);
      return memberDate >= startDate && memberDate <= endDate;
    });
  }

  // Auth operations
  async getAuthState(): Promise<AuthState> {
    return this.executeTransaction(STORES.AUTH, "readonly", async ([store]) => {
      return new Promise<AuthState>((resolve, reject) => {
        const request = store.get("current");
        request.onsuccess = () =>
          resolve(request.result?.value || { isAuthenticated: false });
        request.onerror = () => reject(request.error);
      });
    });
  }

  async saveAuthState(authState: AuthState): Promise<void> {
    return this.executeTransaction(
      STORES.AUTH,
      "readwrite",
      async ([store]) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put({ key: "current", value: authState });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
    );
  }

  // Database maintenance
  async clearAllData(): Promise<void> {
    const storeNames = Object.values(STORES);
    return this.executeTransaction(storeNames, "readwrite", async (stores) => {
      const promises = stores.map((store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      await Promise.all(promises);
    });
  }

  async exportData(): Promise<string> {
    const [members, courses, dietPlans, products, sales] = await Promise.all([
      this.getMembers(),
      this.getCourses(),
      this.getDietPlans(),
      this.getProducts(),
      this.getSales(),
    ]);

    const exportData = {
      members,
      courses,
      dietPlans,
      products,
      sales,
      exportDate: new Date().toISOString(),
      version: DB_VERSION,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      // Clear existing data
      await this.clearAllData();

      // Import new data
      if (data.members) {
        for (const member of data.members) {
          await this.saveMember(member);
        }
      }

      if (data.courses) {
        for (const course of data.courses) {
          await this.saveCourse(course);
        }
      }

      if (data.dietPlans) {
        for (const dietPlan of data.dietPlans) {
          await this.saveDietPlan(dietPlan);
        }
      }

      if (data.products) {
        for (const product of data.products) {
          await this.saveProduct(product);
        }
      }

      if (data.sales) {
        for (const sale of data.sales) {
          await this.saveSale(sale);
        }
      }
    } catch (error) {
      throw new Error(`فشل في استيراد البيانات: ${error}`);
    }
  }

  // Initialize sample data
  async initializeSampleData(): Promise<void> {
    const [membersCount, coursesCount, dietPlansCount] = await Promise.all([
      this.getMembers().then((members) => members.length),
      this.getCourses().then((courses) => courses.length),
      this.getDietPlans().then((dietPlans) => dietPlans.length),
    ]);

    // Only add sample data if tables are empty
    if (coursesCount === 0) {
      const sampleCourses: Course[] = [
        {
          id: "1",
          name: "تمارين كمال الأجسام المبتدئين",
          createdAt: new Date(),
        },
        { id: "2", name: "تمارين القوة والتحمل", createdAt: new Date() },
        { id: "3", name: "تمارين اللياقة البدنية", createdAt: new Date() },
        { id: "4", name: "تمارين اليوغا والإطالة", createdAt: new Date() },
        { id: "5", name: "تمارين الكارديو المكثفة", createdAt: new Date() },
      ];

      for (const course of sampleCourses) {
        await this.saveCourse(course);
      }
    }

    if (dietPlansCount === 0) {
      const sampleDietPlans: DietPlan[] = [
        {
          id: "1",
          name: "نظام غذائي لزيادة الكتلة العضلية",
          createdAt: new Date(),
        },
        { id: "2", name: "نظام غذائي لحرق الدهون", createdAt: new Date() },
        { id: "3", name: "نظام غذائي متوازن", createdAt: new Date() },
        { id: "4", name: "نظام غذائي نباتي", createdAt: new Date() },
        { id: "5", name: "نظام غذائي للرياضيين", createdAt: new Date() },
      ];

      for (const dietPlan of sampleDietPlans) {
        await this.saveDietPlan(dietPlan);
      }
    }
  }
}

// Create singleton instance
const gymDB = new GymDatabase();

// Export database instance and initialization function
export { gymDB };
export default gymDB;

// Export helper function to ensure database is initialized
export async function initializeDatabase(): Promise<void> {
  try {
    await gymDB.init();
    await gymDB.initializeSampleData();
    console.log("تم تهيئة قاعدة البيانات بنجاح");
  } catch (error) {
    console.error("فشل في تهيئة قاعدة البيانات:", error);
    throw error;
  }
}
