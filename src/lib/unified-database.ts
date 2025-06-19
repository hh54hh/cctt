import { Member, Course, DietPlan, Product, Sale, AuthState } from "./types";
import gymDB from "./database";
import { syncManager } from "./sync-manager";
import { offlineManager } from "./offline-manager";
import { setupSupabaseSchema } from "./supabase";

// Unified database layer that works both offline and online
class UnifiedDatabase {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize local IndexedDB first (this is critical and must succeed)
      await gymDB.init();
      // Database ready (no demo data)

      // Mark as initialized immediately after local DB is ready
      this.isInitialized = true;
      console.log("✅ Database ready - working offline/online");

      // Setup Supabase schema and start sync process if online (non-blocking)
      if (offlineManager.getOnlineStatus()) {
        // Do this in background without blocking initialization
        setTimeout(async () => {
          try {
            await setupSupabaseSchema();
            await syncManager.performFullSync();
            console.log("✅ Cloud sync active");
          } catch (error) {
            // Silent - will retry automatically
          }
        }, 500);
      } else {
        console.log("📱 Working offline - Supabase sync disabled");
      }
    } catch (error) {
      console.error("❌ Critical database initialization failed:", error);
      // Even if there's an error, mark as initialized so app doesn't hang
      this.isInitialized = true;
      console.log("⚠️ Continuing with limited functionality");
    }
  }

  // Auth operations
  async getAuthState(): Promise<AuthState> {
    return await gymDB.getAuthState();
  }

  async saveAuthState(authState: AuthState): Promise<void> {
    await gymDB.saveAuthState(authState);
  }

  // Members operations with sync
  async getMembers(): Promise<Member[]> {
    return await gymDB.getMembers();
  }

  async getMemberById(id: string): Promise<Member | null> {
    return await gymDB.getMemberById(id);
  }

  async saveMember(member: Member): Promise<void> {
    // Save locally first (for immediate response)
    await gymDB.saveMember(member);

    // Trigger immediate sync attempt in background
    setTimeout(async () => {
      try {
        await syncManager.syncMember(member);
      } catch (error) {
        // Silent - will be handled by the sync queue
      }
    }, 1000);
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<void> {
    await gymDB.updateMember(id, updates);

    // Get updated member and sync
    const updatedMember = await gymDB.getMemberById(id);
    if (updatedMember) {
      syncManager.syncMember(updatedMember).catch(() => {
        // Silent - handled by sync queue
      });
    }
  }

  async deleteMember(id: string): Promise<void> {
    await gymDB.deleteMember(id);

    // Add to sync queue for deletion
    offlineManager.addToSyncQueue({
      table: "members",
      operation: "DELETE",
      data: { id },
    });
  }

  async searchMembers(searchTerm: string): Promise<Member[]> {
    return await gymDB.searchMembers(searchTerm);
  }

  // Courses operations with sync
  async getCourses(): Promise<Course[]> {
    return await gymDB.getCourses();
  }

  async saveCourse(course: Course): Promise<void> {
    await gymDB.saveCourse(course);

    // Immediate sync attempt
    setTimeout(async () => {
      try {
        await syncManager.syncCourse(course);
      } catch (error) {
        // Silent - handled by sync queue
      }
    }, 1000);
  }

  async deleteCourse(id: string): Promise<void> {
    await gymDB.deleteCourse(id);

    offlineManager.addToSyncQueue({
      table: "courses",
      operation: "DELETE",
      data: { id },
    });
  }

  // Diet Plans operations with sync
  async getDietPlans(): Promise<DietPlan[]> {
    return await gymDB.getDietPlans();
  }

  async saveDietPlan(dietPlan: DietPlan): Promise<void> {
    await gymDB.saveDietPlan(dietPlan);

    // Immediate sync attempt
    setTimeout(async () => {
      try {
        await syncManager.syncDietPlan(dietPlan);
      } catch (error) {
        // Silent - handled by sync queue
      }
    }, 1000);
  }

  async deleteDietPlan(id: string): Promise<void> {
    await gymDB.deleteDietPlan(id);

    offlineManager.addToSyncQueue({
      table: "dietPlans",
      operation: "DELETE",
      data: { id },
    });
  }

  // Products operations with sync
  async getProducts(): Promise<Product[]> {
    return await gymDB.getProducts();
  }

  async getProductById(id: string): Promise<Product | null> {
    return await gymDB.getProductById(id);
  }

  async saveProduct(product: Product): Promise<void> {
    await gymDB.saveProduct(product);

    syncManager.syncProduct(product).catch(() => {
      // Silent - handled by sync queue
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await gymDB.deleteProduct(id);

    offlineManager.addToSyncQueue({
      table: "products",
      operation: "DELETE",
      data: { id },
    });
  }

  async updateProductQuantity(
    id: string,
    quantityChange: number,
  ): Promise<boolean> {
    const result = await gymDB.updateProductQuantity(id, quantityChange);

    if (result) {
      // Get updated product and sync
      const updatedProduct = await gymDB.getProductById(id);
      if (updatedProduct) {
        syncManager.syncProduct(updatedProduct).catch(() => {
          // Silent - handled by sync queue
        });
      }
    }

    return result;
  }

  // Sales operations with sync
  async getSales(): Promise<Sale[]> {
    return await gymDB.getSales();
  }

  async saveSale(sale: Sale): Promise<void> {
    await gymDB.saveSale(sale);

    syncManager.syncSale(sale).catch(() => {
      // Silent - handled by sync queue
    });
  }

  async deleteSale(id: string): Promise<void> {
    await gymDB.deleteSale(id);

    offlineManager.addToSyncQueue({
      table: "sales",
      operation: "DELETE",
      data: { id },
    });
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<void> {
    await gymDB.updateSale(id, updates);

    // Get updated sale and sync
    const sales = await gymDB.getSales();
    const updatedSale = sales.find((s) => s.id === id);
    if (updatedSale) {
      syncManager.syncSale(updatedSale).catch(() => {
        // Silent - handled by sync queue
      });
    }
  }

  async searchSales(searchTerm: string): Promise<Sale[]> {
    return await gymDB.searchSales(searchTerm);
  }

  // Analytics operations (local only for now)
  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return await gymDB.getRevenueByDateRange(startDate, endDate);
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    return await gymDB.getLowStockProducts(threshold);
  }

  async getMembersByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Member[]> {
    return await gymDB.getMembersByDateRange(startDate, endDate);
  }

  // Data management operations
  async exportData(): Promise<string> {
    return await gymDB.exportData();
  }

  async importData(jsonData: string): Promise<void> {
    await gymDB.importData(jsonData);

    // Force full sync after import
    if (offlineManager.getOnlineStatus()) {
      syncManager.forceSyncNow().catch(() => {
        // Silent - will retry automatically
      });
    }
  }

  async clearAllData(): Promise<void> {
    await gymDB.clearAllData();

    // Clear sync queue as well
    offlineManager.clearSyncQueue();
  }

  // Sync management
  async forceSyncNow(): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      await syncManager.forceSyncNow();
    } else {
      throw new Error("Cannot sync while offline");
    }
  }

  getSyncStatus() {
    return syncManager.getSyncStatus();
  }

  getOnlineStatus(): boolean {
    return offlineManager.getOnlineStatus();
  }
}

// Create singleton instance
const unifiedDB = new UnifiedDatabase();

// Export database instance and initialization function
export { unifiedDB };
export default unifiedDB;

// Export helper function to ensure database is initialized
export async function initializeUnifiedDatabase(): Promise<void> {
  try {
    await unifiedDB.init();
    console.log("🚀 Unified database ready for offline/online operation");
  } catch (error) {
    console.error("💥 Failed to initialize unified database:", error);
    throw error;
  }
}
