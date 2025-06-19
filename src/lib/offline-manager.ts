import { useState, useEffect } from "react";

// Types for sync operations
export interface SyncOperation {
  id: string;
  table: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  data: any;
  timestamp: number;
  synced: boolean;
  attempts?: number;
  lastError?: string;
}

// Online status management
class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();
  private syncQueue: SyncOperation[] = [];
  private syncInProgress: boolean = false;

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processSyncQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  public addOnlineStatusListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Sync queue management
  private loadSyncQueue() {
    try {
      const stored = localStorage.getItem("gym-sync-queue");
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading sync queue:", error?.message || error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem("gym-sync-queue", JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("Error saving sync queue:", error?.message || error);
    }
  }

  public addToSyncQueue(
    operation: Omit<SyncOperation, "id" | "timestamp" | "synced">,
  ) {
    // Check for duplicate operations (same table, operation, and data ID)
    const dataId = operation.data?.id;
    if (dataId) {
      const existingOp = this.syncQueue.find(
        (op) =>
          !op.synced &&
          op.table === operation.table &&
          op.operation === operation.operation &&
          op.data?.id === dataId,
      );

      if (existingOp) {
        // Update existing operation with new data instead of creating duplicate
        existingOp.data = operation.data;
        existingOp.timestamp = Date.now();
        existingOp.attempts = 0; // Reset attempts
        existingOp.lastError = undefined;
        this.saveSyncQueue();
        return;
      }
    }

    const syncOperation: SyncOperation = {
      ...operation,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };

    this.syncQueue.push(syncOperation);
    this.saveSyncQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  public async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    // Add small delay to prevent immediate retries
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.syncInProgress = true;

    try {
      // Process operations in chronological order
      const unsynced = this.syncQueue
        .filter((op) => !op.synced)
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const operation of unsynced) {
        // Skip invalid operations
        if (!operation.table || !operation.operation || !operation.data) {
          operation.synced = true; // Remove invalid operation
          console.warn(
            `❌ Removing invalid sync operation: ${JSON.stringify(operation)}`,
          );
          continue;
        }

        try {
          await this.syncOperation(operation);
          operation.synced = true;
          operation.lastError = undefined;
          // Only log sync success in development or debug mode
          if (process.env.NODE_ENV === "development") {
            console.log(
              `✅ Synced ${operation.operation} on ${operation.table} (${operation.data?.id || operation.id})`,
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Track attempts and errors
          if (!operation.attempts) operation.attempts = 0;
          operation.attempts++;
          operation.lastError = errorMessage;

          // Only show detailed errors in development
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `⚠️ Sync attempt ${operation.attempts}/3 failed for ${operation.operation} on ${operation.table} (${operation.data?.id || "unknown"}): ${errorMessage}`,
            );
          }

          // Mark as synced (remove from queue) after 3 failed attempts
          if (operation.attempts >= 3) {
            operation.synced = true;
            console.warn(
              `❌ Removing failed operation: ${operation.operation} on ${operation.table} (ID: ${operation.data?.id || "unknown"}) - Final error: ${errorMessage}`,
            );
          }
        }
      }

      // Remove synced operations older than 1 hour and failed operations older than 6 hours
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

      const beforeCount = this.syncQueue.length;
      this.syncQueue = this.syncQueue.filter((op) => {
        // Keep unsynced operations that are not too old
        if (!op.synced && op.timestamp > sixHoursAgo) return true;

        // Keep recent synced operations for a short time
        if (op.synced && op.timestamp > oneHourAgo) return true;

        return false;
      });

      if (
        beforeCount !== this.syncQueue.length &&
        process.env.NODE_ENV === "development"
      ) {
        console.log(
          `🧹 Cleaned ${beforeCount - this.syncQueue.length} old sync operations`,
        );
      }

      this.saveSyncQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    try {
      // Import Supabase manager dynamically to avoid circular dependencies
      const { supabaseManager } = await import("./supabase");

      switch (operation.operation) {
        case "CREATE":
          await supabaseManager.insert(operation.table, operation.data);
          break;
        case "UPDATE":
          if (!operation.data.id) {
            throw new Error(
              `Missing ID for UPDATE operation on ${operation.table}`,
            );
          }
          await supabaseManager.update(
            operation.table,
            operation.data.id,
            operation.data,
          );
          break;
        case "DELETE":
          if (!operation.data.id) {
            throw new Error(
              `Missing ID for DELETE operation on ${operation.table}`,
            );
          }
          await supabaseManager.delete(operation.table, operation.data.id);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.operation}`);
      }
    } catch (error) {
      // Re-throw with more context
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const dataId = operation.data?.id || "unknown";

      const contextError = new Error(
        `${operation.operation} failed on ${operation.table} (ID: ${dataId}): ${errorMessage}`,
      );
      throw contextError;
    }
  }

  public getSyncQueueStatus() {
    const unsynced = this.syncQueue.filter((op) => !op.synced);
    const failed = unsynced.filter((op) => (op.attempts || 0) > 0);
    const withErrors = unsynced.filter((op) => op.lastError);

    return {
      total: this.syncQueue.length,
      unsynced: unsynced.length,
      synced: this.syncQueue.length - unsynced.length,
      inProgress: this.syncInProgress,
      failed: failed.length,
      withErrors: withErrors.length,
      errors: withErrors.map((op) => ({
        operation: op.operation,
        table: op.table,
        attempts: op.attempts || 0,
        error: op.lastError,
      })),
    };
  }

  public clearSyncQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// React hook for online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineManager.getOnlineStatus());

  useEffect(() => {
    const unsubscribe = offlineManager.addOnlineStatusListener(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

// React hook for sync status
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(
    offlineManager.getSyncQueueStatus(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(offlineManager.getSyncQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return syncStatus;
}
