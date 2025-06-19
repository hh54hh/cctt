import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = "https://efxciplzfivwgdyrayjm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeGNpcGx6Zml2d2dkeXJheWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODg3ODIsImV4cCI6MjA2NTc2NDc4Mn0.xXZVhNJTPtj8lW_e-fBqgAnS5DkasLMJwh0t_8Y6l64";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database tables configuration
export const TABLES = {
  MEMBERS: "members",
  COURSES: "courses",
  DIET_PLANS: "diet_plans",
  PRODUCTS: "products",
  SALES: "sales",
  SYNC_STATUS: "sync_status",
} as const;

// Sync status types
export interface SyncRecord {
  id: string;
  table_name: string;
  record_id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  data?: any;
  created_at: string;
  synced: boolean;
  error?: string;
}

// Connection status checker
export async function checkConnection(): Promise<boolean> {
  try {
    // Simple connection test
    const { data, error } = await supabase
      .from("members")
      .select("count")
      .limit(1);

    return !error;
  } catch (error) {
    console.log(
      "🔄 Supabase connection check:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

// Generic Supabase operations
export class SupabaseManager {
  // Get Supabase client instance
  getClient() {
    return supabase;
  }

  // Get all records from a table
  async getAll<T>(tableName: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get single record by ID
  async getById<T>(tableName: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  }

  // Insert new record
  async insert<T>(
    tableName: string,
    record: Omit<T, "created_at" | "updated_at">,
  ): Promise<T> {
    const { data, error } = await supabase
      .from(tableName)
      .insert([
        {
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update existing record
  async update<T>(
    tableName: string,
    id: string,
    updates: Partial<T>,
  ): Promise<T> {
    const { data, error } = await supabase
      .from(tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete record
  async delete(tableName: string, id: string): Promise<void> {
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) throw error;
  }

  // Upsert (insert or update)
  async upsert<T>(tableName: string, record: T): Promise<T> {
    const { data, error } = await supabase
      .from(tableName)
      .upsert([
        {
          ...record,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Batch operations
  async batchInsert<T>(tableName: string, records: T[]): Promise<T[]> {
    const recordsWithTimestamps = records.map((record) => ({
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from(tableName)
      .insert(recordsWithTimestamps)
      .select();

    if (error) throw error;
    return data || [];
  }

  async batchUpsert<T>(tableName: string, records: T[]): Promise<T[]> {
    const recordsWithTimestamps = records.map((record) => ({
      ...record,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from(tableName)
      .upsert(recordsWithTimestamps)
      .select();

    if (error) throw error;
    return data || [];
  }

  // Sync status operations
  async saveSyncRecord(
    syncRecord: Omit<SyncRecord, "created_at" | "synced">,
  ): Promise<void> {
    const { error } = await supabase.from(TABLES.SYNC_STATUS).insert([
      {
        ...syncRecord,
        created_at: new Date().toISOString(),
        synced: false,
      },
    ]);

    if (error) throw error;
  }

  async markSyncRecordComplete(syncId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SYNC_STATUS)
      .update({ synced: true })
      .eq("id", syncId);

    if (error) throw error;
  }

  async markSyncRecordError(
    syncId: string,
    errorMessage: string,
  ): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SYNC_STATUS)
      .update({
        synced: false,
        error: errorMessage,
      })
      .eq("id", syncId);

    if (error) throw error;
  }

  async getPendingSyncRecords(): Promise<SyncRecord[]> {
    const { data, error } = await supabase
      .from(TABLES.SYNC_STATUS)
      .select("*")
      .eq("synced", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

// Database schema setup
export async function setupSupabaseSchema(): Promise<void> {
  try {
    console.log("🔧 Setting up Supabase schema...");

    // Check if tables exist by trying to query them
    const tablesToCheck = [
      { name: TABLES.MEMBERS, description: "Members table" },
      { name: TABLES.COURSES, description: "Courses table" },
      { name: TABLES.DIET_PLANS, description: "Diet plans table" },
      { name: TABLES.PRODUCTS, description: "Products table" },
      { name: TABLES.SALES, description: "Sales table" },
    ];

    for (const table of tablesToCheck) {
      try {
        await supabase.from(table.name).select("count").limit(1);
        console.log(`✅ ${table.description} exists`);
      } catch (error) {
        console.log(
          `⚠️ ${table.description} not accessible - may need to be created in Supabase dashboard`,
        );
      }
    }

    console.log(
      "🎯 Schema check completed. If tables don't exist, please create them in your Supabase dashboard.",
    );
  } catch (error) {
    console.warn("Schema setup check failed:", error);
  }
}

export const supabaseManager = new SupabaseManager();
