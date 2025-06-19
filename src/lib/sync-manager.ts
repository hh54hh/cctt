import { useState, useEffect } from "react";
import { supabaseManager, checkConnection, TABLES } from "./supabase";
import { offlineManager } from "./offline-manager";
import gymDB from "./database";
import { Member, Course, DietPlan, Product, Sale } from "./types";

// Sync configuration
const SYNC_INTERVAL = 30 * 1000; // 30 seconds
const RETRY_DELAY = 5 * 1000; // 5 seconds
const IMMEDIATE_SYNC_DELAY = 2 * 1000; // 2 seconds for immediate sync

export type SyncableTable =
  | "members"
  | "courses"
  | "dietPlans"
  | "products"
  | "sales";

interface SyncResult {
  success: boolean;
  table: string;
  operation: "pull" | "push";
  count: number;
  error?: string;
}

class SyncManager {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: { [key: string]: number } = {};

  constructor() {
    this.loadLastSyncTimes();
    this.startPeriodicSync();
  }

  private loadLastSyncTimes() {
    try {
      const stored = localStorage.getItem("gym-last-sync-times");
      if (stored) {
        this.lastSyncTime = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading last sync times:", error?.message || error);
      this.lastSyncTime = {};
    }
  }

  private saveLastSyncTime(table: string) {
    this.lastSyncTime[table] = Date.now();
    try {
      localStorage.setItem(
        "gym-last-sync-times",
        JSON.stringify(this.lastSyncTime),
      );
    } catch (error) {
      console.error("Error saving last sync time:", error?.message || error);
    }
  }

  private startPeriodicSync() {
    this.syncTimer = setInterval(() => {
      if (offlineManager.getOnlineStatus() && !this.isSyncing) {
        this.performFullSync();
      }
    }, SYNC_INTERVAL);
  }

  public stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  public async performFullSync(): Promise<SyncResult[]> {
    if (this.isSyncing || !offlineManager.getOnlineStatus()) {
      return [];
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Check if Supabase is reachable
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log(
          "🔄 Supabase not reachable, skipping sync (this is normal)",
        );
        return [];
      }

      // Sync each table
      const tables: SyncableTable[] = [
        "members",
        "courses",
        "dietPlans",
        "products",
        "sales",
      ];

      for (const table of tables) {
        try {
          // Pull from Supabase first
          const pullResult = await this.pullFromSupabase(table);
          results.push(pullResult);

          // Process pending sync queue
          await offlineManager.processSyncQueue();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ Error syncing table ${table}:`, errorMessage);
          results.push({
            success: false,
            table,
            operation: "pull",
            count: 0,
            error: errorMessage,
          });
        }
      }
    } catch (error) {
      // Only log as warning since this is expected when offline
      console.warn(
        "🔄 Sync skipped (offline or connection issues):",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async pullFromSupabase(table: SyncableTable): Promise<SyncResult> {
    try {
      const supabaseTable = this.getSupabaseTableName(table);
      const remoteData = await supabaseManager.getAll(supabaseTable);

      let count = 0;

      for (const item of remoteData) {
        // Check if item exists locally
        const localItem = await this.getLocalItem(table, item.id);

        if (
          !localItem ||
          new Date(item.updated_at) > new Date(localItem.updatedAt)
        ) {
          // Update local database
          await this.saveLocalItem(table, this.transformFromSupabase(item));
          count++;
        }
      }

      this.saveLastSyncTime(table);

      return {
        success: true,
        table,
        operation: "pull",
        count,
      };
    } catch (error) {
      console.error(
        `Error pulling from Supabase for table ${table}:`,
        error?.message || error,
      );
      return {
        success: false,
        table,
        operation: "pull",
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getSupabaseTableName(table: SyncableTable): string {
    switch (table) {
      case "members":
        return TABLES.MEMBERS;
      case "courses":
        return TABLES.COURSES;
      case "dietPlans":
        return TABLES.DIET_PLANS;
      case "products":
        return TABLES.PRODUCTS;
      case "sales":
        return TABLES.SALES;
      default:
        return table;
    }
  }

  private async getLocalItem(table: SyncableTable, id: string): Promise<any> {
    switch (table) {
      case "members":
        return await gymDB.getMemberById(id);
      case "courses":
        const courses = await gymDB.getCourses();
        return courses.find((c) => c.id === id);
      case "dietPlans":
        const dietPlans = await gymDB.getDietPlans();
        return dietPlans.find((d) => d.id === id);
      case "products":
        return await gymDB.getProductById(id);
      case "sales":
        const sales = await gymDB.getSales();
        return sales.find((s) => s.id === id);
      default:
        return null;
    }
  }

  private async saveLocalItem(table: SyncableTable, item: any): Promise<void> {
    switch (table) {
      case "members":
        await gymDB.saveMember(item);
        break;
      case "courses":
        await gymDB.saveCourse(item);
        break;
      case "dietPlans":
        await gymDB.saveDietPlan(item);
        break;
      case "products":
        await gymDB.saveProduct(item);
        break;
      case "sales":
        await gymDB.saveSale(item);
        break;
    }
  }

  private transformFromSupabase(item: any): any {
    // Transform Supabase item to local format
    return {
      ...item,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    };
  }

  // Manual sync methods
  public async syncMember(member: Member): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      try {
        console.log("🔄 Syncing member:", member.name, "ID:", member.id);

        const transformedMember = this.transformToSupabase(member);
        console.log("📝 Transformed member data:", {
          id: transformedMember.id,
          name: transformedMember.name,
          hasGroups: !!(
            transformedMember.course_groups ||
            transformedMember.diet_plan_groups
          ),
        });

        await supabaseManager.upsert(TABLES.MEMBERS, transformedMember);

        console.log("✅ Member synced successfully:", member.name);
      } catch (error) {
        const errorMessage =
          error?.message || error?.toString() || "Unknown error";
        console.error(
          "❌ Error syncing member:",
          member.name,
          "Error:",
          errorMessage,
        );
        console.error("🔍 Full error details:", error);

        // Add to sync queue for later
        offlineManager.addToSyncQueue({
          table: TABLES.MEMBERS,
          operation: "UPDATE",
          data: member,
        });

        // Re-throw with more context
        throw new Error(
          `Failed to sync member ${member.name}: ${errorMessage}`,
        );
      }
    } else {
      // Add to sync queue
      offlineManager.addToSyncQueue({
        table: TABLES.MEMBERS,
        operation: "UPDATE",
        data: member,
      });
    }
  }

  public async syncCourse(course: Course): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      try {
        await supabaseManager.upsert(
          TABLES.COURSES,
          this.transformToSupabase(course),
        );
      } catch (error) {
        console.error("Error syncing course:", error?.message || error);
        offlineManager.addToSyncQueue({
          table: TABLES.COURSES,
          operation: "UPDATE",
          data: course,
        });
      }
    } else {
      offlineManager.addToSyncQueue({
        table: TABLES.COURSES,
        operation: "UPDATE",
        data: course,
      });
    }
  }

  public async syncDietPlan(dietPlan: DietPlan): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      try {
        await supabaseManager.upsert(
          TABLES.DIET_PLANS,
          this.transformToSupabase(dietPlan),
        );
      } catch (error) {
        console.error("Error syncing diet plan:", error?.message || error);
        offlineManager.addToSyncQueue({
          table: TABLES.DIET_PLANS,
          operation: "UPDATE",
          data: dietPlan,
        });
      }
    } else {
      offlineManager.addToSyncQueue({
        table: TABLES.DIET_PLANS,
        operation: "UPDATE",
        data: dietPlan,
      });
    }
  }

  public async syncProduct(product: Product): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      try {
        await supabaseManager.upsert(
          TABLES.PRODUCTS,
          this.transformToSupabase(product),
        );
      } catch (error) {
        console.error("Error syncing product:", error?.message || error);
        offlineManager.addToSyncQueue({
          table: TABLES.PRODUCTS,
          operation: "UPDATE",
          data: product,
        });
      }
    } else {
      offlineManager.addToSyncQueue({
        table: TABLES.PRODUCTS,
        operation: "UPDATE",
        data: product,
      });
    }
  }

  public async syncSale(sale: Sale): Promise<void> {
    if (offlineManager.getOnlineStatus()) {
      try {
        await supabaseManager.upsert(
          TABLES.SALES,
          this.transformToSupabase(sale),
        );
      } catch (error) {
        console.error("Error syncing sale:", error?.message || error);
        offlineManager.addToSyncQueue({
          table: TABLES.SALES,
          operation: "UPDATE",
          data: sale,
        });
      }
    } else {
      offlineManager.addToSyncQueue({
        table: TABLES.SALES,
        operation: "UPDATE",
        data: sale,
      });
    }
  }

  private transformToSupabase(item: any): any {
    // Transform local item to Supabase format
    const transformed = { ...item };

    // Convert dates to ISO strings
    if (transformed.createdAt) {
      transformed.created_at = new Date(transformed.createdAt).toISOString();
      delete transformed.createdAt;
    }

    if (transformed.updatedAt) {
      transformed.updated_at = new Date(transformed.updatedAt).toISOString();
      delete transformed.updatedAt;
    }

    // Handle Member-specific transformations
    // Transform courseGroups and dietPlanGroups as JSON (not PostgreSQL arrays)
    if (transformed.courseGroups) {
      transformed.course_groups = Array.isArray(transformed.courseGroups)
        ? JSON.stringify(transformed.courseGroups)
        : "[]";
      delete transformed.courseGroups;
    }

    if (transformed.dietPlanGroups) {
      transformed.diet_plan_groups = Array.isArray(transformed.dietPlanGroups)
        ? JSON.stringify(transformed.dietPlanGroups)
        : "[]";
      delete transformed.dietPlanGroups;
    }

    if (transformed.subscriptionStart) {
      transformed.subscription_start = new Date(
        transformed.subscriptionStart,
      ).toISOString();
      delete transformed.subscriptionStart;
    }

    if (transformed.subscriptionEnd) {
      transformed.subscription_end = new Date(
        transformed.subscriptionEnd,
      ).toISOString();
      delete transformed.subscriptionEnd;
    }

    // Convert arrays to PostgreSQL format for Supabase
    if (Array.isArray(transformed.courses)) {
      transformed.courses =
        transformed.courses.length > 0
          ? `{${transformed.courses.map((c) => `"${c}"`).join(",")}}`
          : "{}";
    }

    if (Array.isArray(transformed.dietPlans)) {
      transformed.diet_plans =
        transformed.dietPlans.length > 0
          ? `{${transformed.dietPlans.map((d) => `"${d}"`).join(",")}}`
          : "{}";
      delete transformed.dietPlans; // Remove the camelCase version
    }

    // Handle backward compatibility fields that might exist
    if (transformed.dietPlans && !Array.isArray(transformed.dietPlans)) {
      // If dietPlans exists but is not array, remove it as it shouldn't be there
      delete transformed.dietPlans;
    }

    // Transform sales fields from camelCase to snake_case
    if (transformed.buyerName) {
      transformed.buyer_name = transformed.buyerName;
      delete transformed.buyerName;
    }

    if (transformed.productId) {
      transformed.product_id = transformed.productId;
      delete transformed.productId;
    }

    if (transformed.productName) {
      transformed.product_name = transformed.productName;
      delete transformed.productName;
    }

    if (transformed.unitPrice !== undefined) {
      transformed.unit_price = Number(transformed.unitPrice);
      delete transformed.unitPrice;
    }

    if (transformed.totalPrice !== undefined) {
      transformed.total_price = Number(transformed.totalPrice);
      delete transformed.totalPrice;
    }

    // Ensure required fields for sales
    if (transformed.buyer_name || transformed.product_id) {
      // This looks like a sale record, validate required fields
      if (
        !transformed.buyer_name ||
        !transformed.product_id ||
        !transformed.product_name
      ) {
        console.warn("Missing required fields for sale:", transformed);
      }
    }

    return transformed;
  }

  public getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTimes: { ...this.lastSyncTime },
      onlineStatus: offlineManager.getOnlineStatus(),
      syncQueue: offlineManager.getSyncQueueStatus(),
    };
  }

  public async forceSyncNow(): Promise<SyncResult[]> {
    return await this.performFullSync();
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// React hook for sync status
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return syncStatus;
}

// Utility functions
export async function ensureSync() {
  if (offlineManager.getOnlineStatus()) {
    await syncManager.performFullSync();
  }
}
