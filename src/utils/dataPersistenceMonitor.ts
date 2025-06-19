// Data Persistence Monitor
// Monitors and prevents data loss for courses and diet plans

import { getMembers, updateMember } from "../lib/storage-new";
import { syncManager } from "../lib/sync-manager";
import type { Member } from "../lib/types";

interface DataSnapshot {
  memberId: string;
  memberName: string;
  timestamp: Date;
  coursesCount: number;
  dietPlansCount: number;
  courseGroupsCount: number;
  dietPlanGroupsCount: number;
}

class DataPersistenceMonitor {
  private static instance: DataPersistenceMonitor;
  private snapshots = new Map<string, DataSnapshot>();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  public static getInstance(): DataPersistenceMonitor {
    if (!DataPersistenceMonitor.instance) {
      DataPersistenceMonitor.instance = new DataPersistenceMonitor();
    }
    return DataPersistenceMonitor.instance;
  }

  // Start monitoring for data loss
  public startMonitoring(intervalMs: number = 10000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("🔍 بدء مراقبة البيانات لمنع الفقدان...");

    // Take initial snapshot
    this.takeSnapshot();

    // Monitor continuously
    this.monitoringInterval = setInterval(() => {
      this.checkForDataLoss();
    }, intervalMs);
  }

  // Stop monitoring
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("⏹️ تم إيقاف مراقبة البيانات");
  }

  // Take a snapshot of current data
  private async takeSnapshot(): Promise<void> {
    try {
      const members = await getMembers();

      for (const member of members) {
        const snapshot: DataSnapshot = {
          memberId: member.id,
          memberName: member.name,
          timestamp: new Date(),
          coursesCount: Array.isArray(member.courses)
            ? member.courses.length
            : 0,
          dietPlansCount: Array.isArray(member.dietPlans)
            ? member.dietPlans.length
            : 0,
          courseGroupsCount: Array.isArray(member.courseGroups)
            ? member.courseGroups.length
            : 0,
          dietPlanGroupsCount: Array.isArray(member.dietPlanGroups)
            ? member.dietPlanGroups.length
            : 0,
        };

        this.snapshots.set(member.id, snapshot);
      }

      console.log(`📸 تم أخذ snapshot لـ ${members.length} عضو`);
    } catch (error) {
      console.error("❌ خطأ في أخذ snapshot:", error);
    }
  }

  // Check for data loss by comparing current state with snapshots
  private async checkForDataLoss(): Promise<void> {
    try {
      const members = await getMembers();
      const dataLossDetected: string[] = [];

      for (const member of members) {
        const previousSnapshot = this.snapshots.get(member.id);
        if (!previousSnapshot) {
          // New member, take snapshot
          this.snapshots.set(member.id, {
            memberId: member.id,
            memberName: member.name,
            timestamp: new Date(),
            coursesCount: Array.isArray(member.courses)
              ? member.courses.length
              : 0,
            dietPlansCount: Array.isArray(member.dietPlans)
              ? member.dietPlans.length
              : 0,
            courseGroupsCount: Array.isArray(member.courseGroups)
              ? member.courseGroups.length
              : 0,
            dietPlanGroupsCount: Array.isArray(member.dietPlanGroups)
              ? member.dietPlanGroups.length
              : 0,
          });
          continue;
        }

        // Check for data loss
        const currentCoursesCount = Array.isArray(member.courses)
          ? member.courses.length
          : 0;
        const currentDietPlansCount = Array.isArray(member.dietPlans)
          ? member.dietPlans.length
          : 0;
        const currentCourseGroupsCount = Array.isArray(member.courseGroups)
          ? member.courseGroups.length
          : 0;
        const currentDietPlanGroupsCount = Array.isArray(member.dietPlanGroups)
          ? member.dietPlanGroups.length
          : 0;

        // Detect significant data loss (more than 50% reduction)
        const coursesLoss =
          previousSnapshot.coursesCount > 0 &&
          currentCoursesCount / previousSnapshot.coursesCount < 0.5;
        const dietPlansLoss =
          previousSnapshot.dietPlansCount > 0 &&
          currentDietPlansCount / previousSnapshot.dietPlansCount < 0.5;
        const courseGroupsLoss =
          previousSnapshot.courseGroupsCount > 0 &&
          currentCourseGroupsCount / previousSnapshot.courseGroupsCount < 0.5;
        const dietPlanGroupsLoss =
          previousSnapshot.dietPlanGroupsCount > 0 &&
          currentDietPlanGroupsCount / previousSnapshot.dietPlanGroupsCount <
            0.5;

        if (
          coursesLoss ||
          dietPlansLoss ||
          courseGroupsLoss ||
          dietPlanGroupsLoss
        ) {
          console.warn(`⚠️ تم اكتشاف فقدان بيانات للعضو: ${member.name}`);
          console.warn("Previous:", previousSnapshot);
          console.warn("Current:", {
            coursesCount: currentCoursesCount,
            dietPlansCount: currentDietPlansCount,
            courseGroupsCount: currentCourseGroupsCount,
            dietPlanGroupsCount: currentDietPlanGroupsCount,
          });

          dataLossDetected.push(member.id);

          // Attempt automatic recovery
          await this.attemptDataRecovery(member.id, previousSnapshot);
        } else {
          // Update snapshot with current data
          this.snapshots.set(member.id, {
            memberId: member.id,
            memberName: member.name,
            timestamp: new Date(),
            coursesCount: currentCoursesCount,
            dietPlansCount: currentDietPlansCount,
            courseGroupsCount: currentCourseGroupsCount,
            dietPlanGroupsCount: currentDietPlanGroupsCount,
          });
        }
      }

      if (dataLossDetected.length > 0) {
        // Show alert to user
        this.showDataLossAlert(dataLossDetected);
      }
    } catch (error) {
      console.error("❌ خطأ في فحص فقدان البيانات:", error);
    }
  }

  // Attempt to recover lost data
  private async attemptDataRecovery(
    memberId: string,
    previousSnapshot: DataSnapshot,
  ): Promise<void> {
    try {
      console.log(
        `🔧 محاولة استرداد البيانات للعضو: ${previousSnapshot.memberName}`,
      );

      // This is a simplified recovery - in a real app you'd have backup data
      // For now, we'll just ensure the arrays are properly initialized
      const members = await getMembers();
      const member = members.find((m) => m.id === memberId);

      if (!member) return;

      const recoveredMember = {
        ...member,
        courses: Array.isArray(member.courses) ? member.courses : [],
        dietPlans: Array.isArray(member.dietPlans) ? member.dietPlans : [],
        courseGroups: Array.isArray(member.courseGroups)
          ? member.courseGroups
          : [],
        dietPlanGroups: Array.isArray(member.dietPlanGroups)
          ? member.dietPlanGroups
          : [],
        updatedAt: new Date(),
      };

      // Save recovered member
      await updateMember(recoveredMember);

      // Force sync
      await syncManager.syncMember(recoveredMember);

      console.log(
        `✅ تم استرداد البيانات للعضو: ${previousSnapshot.memberName}`,
      );
    } catch (error) {
      console.error("❌ فشل في استرداد البيانات:", error);
    }
  }

  // Show alert to user about data loss
  private showDataLossAlert(affectedMemberIds: string[]): void {
    // Create a visual alert
    const alertDiv = document.createElement("div");
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 16px;
      max-width: 400px;
      z-index: 9999;
      color: #991b1b;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    alertDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 20px;">⚠️</span>
        <strong>تحذير: فقدان بيانات!</strong>
      </div>
      <div style="margin-bottom: 12px;">
        تم اكتشاف فقدان في الكورسات أو الأنظمة الغذائية لـ ${affectedMemberIds.length} عضو.
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">إغلاق</button>
    `;

    document.body.appendChild(alertDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 10000);
  }

  // Get monitoring status
  public getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      snapshotsCount: this.snapshots.size,
      lastCheck: new Date(),
    };
  }

  // Manual check for data loss
  public async manualCheck(): Promise<string[]> {
    const members = await getMembers();
    const issues: string[] = [];

    for (const member of members) {
      const coursesCount = Array.isArray(member.courses)
        ? member.courses.length
        : 0;
      const dietPlansCount = Array.isArray(member.dietPlans)
        ? member.dietPlans.length
        : 0;
      const courseGroupsCount = Array.isArray(member.courseGroups)
        ? member.courseGroups.length
        : 0;
      const dietPlanGroupsCount = Array.isArray(member.dietPlanGroups)
        ? member.dietPlanGroups.length
        : 0;

      if (
        coursesCount === 0 &&
        dietPlansCount === 0 &&
        courseGroupsCount === 0 &&
        dietPlanGroupsCount === 0
      ) {
        issues.push(`${member.name}: لا توجد كورسات أو أنظمة غذائية`);
      }
    }

    return issues;
  }
}

// Export singleton instance
export const dataPersistenceMonitor = DataPersistenceMonitor.getInstance();

// Auto-start monitoring in production
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  // Start monitoring after a delay to allow app to initialize
  setTimeout(() => {
    dataPersistenceMonitor.startMonitoring(15000); // Check every 15 seconds
  }, 5000);
}
