// أدوات النسخ الاحتياطي والاستعادة لنظام حسام جم
// Backup and Restore Utilities for Hussam Gym System

class GymBackupManager {
  constructor() {
    this.dbPrefix = "gym_db_";
    this.backupVersion = "1.0";
  }

  // إنشاء نسخة احتياطية كاملة
  createFullBackup() {
    const backup = {
      version: this.backupVersion,
      timestamp: new Date().toISOString(),
      data: {},
    };

    // قائمة الجداول المطلوب نسخها
    const tables = [
      "subscribers",
      "course_points",
      "diet_items",
      "groups",
      "group_items",
      "products",
      "sales",
      "sale_items",
      "access_keys",
    ];

    // نسخ البيانات من localStorage
    tables.forEach((table) => {
      const key = this.dbPrefix + table;
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backup.data[table] = JSON.parse(data);
        } catch (error) {
          console.error(`خطأ في نسخ جدول ${table}:`, error);
          backup.data[table] = [];
        }
      } else {
        backup.data[table] = [];
      }
    });

    return backup;
  }

  // تصدير النسخة الاحتياطية كملف JSON
  exportBackup() {
    const backup = this.createFullBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const fileName = `hussam-gym-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;

    // إنشاء رابط تحميل
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return backup;
  }

  // استيراد نسخة احتياطية من ملف
  async importBackup(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("لم يتم اختيار ملف"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          this.restoreFromBackup(backup);
          resolve(backup);
        } catch (error) {
          reject(new Error("ملف النسخة الاحتياطية غير صحيح"));
        }
      };
      reader.onerror = () => reject(new Error("خطأ في قراءة الملف"));
      reader.readAsText(file);
    });
  }

  // استعادة البيانات من النسخة الاحتياطية
  restoreFromBackup(backup) {
    if (!backup.data) {
      throw new Error("بيانات النسخة الاحتياطية غير صحيحة");
    }

    // نسخ احتياطية قبل الاستعادة
    const currentBackup = this.createFullBackup();
    const backupKey = `backup_before_restore_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(currentBackup));

    // استعادة البيانات
    Object.entries(backup.data).forEach(([table, data]) => {
      const key = this.dbPrefix + table;
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`تم استعادة جدول ${table} بنجاح`);
      } catch (error) {
        console.error(`خطأ في استعادة جدول ${table}:`, error);
      }
    });

    // إعادة تحميل الصفحة لتحديث البيانات
    window.location.reload();
  }

  // مزامنة البيانات مع Supabase
  async syncWithSupabase(supabaseClient) {
    if (!supabaseClient) {
      throw new Error("عميل Supabase غير متوفر");
    }

    const backup = this.createFullBackup();
    const results = {};

    // رفع البيانات إلى Supabase
    for (const [table, data] of Object.entries(backup.data)) {
      try {
        // حذف البيانات الموجودة
        const { error: deleteError } = await supabaseClient
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError && !deleteError.message.includes("No rows")) {
          console.warn(`تحذير عند حذف ${table}:`, deleteError);
        }

        // إدراج البيانات الجديدة
        if (data.length > 0) {
          const { data: insertedData, error: insertError } =
            await supabaseClient.from(table).insert(data);

          if (insertError) {
            throw insertError;
          }

          results[table] = {
            success: true,
            count: data.length,
            data: insertedData,
          };
        } else {
          results[table] = { success: true, count: 0 };
        }

        console.log(`تم رفع ${data.length} سجل من ج��ول ${table}`);
      } catch (error) {
        console.error(`خطأ في رفع جدول ${table}:`, error);
        results[table] = { success: false, error: error.message };
      }
    }

    return results;
  }

  // تحميل البيانات من Supabase
  async downloadFromSupabase(supabaseClient) {
    if (!supabaseClient) {
      throw new Error("عميل Supabase غير متوفر");
    }

    const tables = [
      "subscribers",
      "course_points",
      "diet_items",
      "groups",
      "group_items",
      "products",
      "sales",
      "sale_items",
      "access_keys",
    ];

    const downloadedData = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabaseClient.from(table).select("*");

        if (error) {
          throw error;
        }

        downloadedData[table] = data || [];
        console.log(`تم تحميل ${data?.length || 0} سجل من جدول ${table}`);
      } catch (error) {
        console.error(`خطأ في تحميل جدول ${table}:`, error);
        downloadedData[table] = [];
      }
    }

    // حفظ البيانات محلياً
    Object.entries(downloadedData).forEach(([table, data]) => {
      const key = this.dbPrefix + table;
      localStorage.setItem(key, JSON.stringify(data));
    });

    return downloadedData;
  }

  // إنشاء نسخة احتياطية تلقائية يومية
  setupAutoBackup() {
    const lastBackup = localStorage.getItem("last_auto_backup");
    const today = new Date().toDateString();

    if (lastBackup !== today) {
      const backup = this.createFullBackup();
      const backupKey = `auto_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      localStorage.setItem("last_auto_backup", today);

      // الاحتفاظ بآخر 7 نسخ احتياطية فقط
      this.cleanupAutoBackups();

      console.log("تم إنشاء نسخة احتياطية تلقائية");
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  cleanupAutoBackups() {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("auto_backup_"),
    );

    if (keys.length > 7) {
      // ترتيب حسب التاريخ
      keys.sort((a, b) => {
        const timeA = parseInt(a.split("_")[2]);
        const timeB = parseInt(b.split("_")[2]);
        return timeA - timeB;
      });

      // حذف النسخ القديمة
      const toDelete = keys.slice(0, keys.length - 7);
      toDelete.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`تم حذف ${toDelete.length} نسخة احتياطية قديمة`);
    }
  }

  // الحصول على قائمة النسخ الاحتياطية المحفوظة
  getAvailableBackups() {
    const keys = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith("auto_backup_") || key.startsWith("backup_before_"),
    );

    return keys.map((key) => {
      try {
        const backup = JSON.parse(localStorage.getItem(key));
        return {
          key,
          timestamp: backup.timestamp,
          version: backup.version,
          size: JSON.stringify(backup).length,
        };
      } catch (error) {
        return {
          key,
          timestamp: "غير معروف",
          version: "غير معروف",
          size: 0,
          error: true,
        };
      }
    });
  }

  // استعادة من نسخة احتياطية محفوظة محلياً
  restoreFromLocalBackup(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error("النسخة الاحتياطية غير موجودة");
    }

    try {
      const backup = JSON.parse(backupData);
      this.restoreFromBackup(backup);
    } catch (error) {
      throw new Error("خطأ في قراءة النسخة الاحتياطية");
    }
  }

  // إحصائيات النظام
  getSystemStats() {
    const backup = this.createFullBackup();
    const stats = {
      totalRecords: 0,
      tableStats: {},
      lastBackup: localStorage.getItem("last_auto_backup"),
      availableBackups: this.getAvailableBackups().length,
    };

    Object.entries(backup.data).forEach(([table, data]) => {
      const count = data.length;
      stats.tableStats[table] = count;
      stats.totalRecords += count;
    });

    return stats;
  }
}

// دالة لتصدير البيانات بصيغة CSV
function exportToCSV(tableName, data) {
  if (!data || data.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // إنشاء CSV headers
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(",") + "\n";

  // إضافة البيانات
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value || "";
    });
    csvContent += values.join(",") + "\n";
  });

  // تحميل الملف
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const fileName = `${tableName}-${new Date().toISOString().split("T")[0]}.csv`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// استخدام النظام
const backupManager = new GymBackupManager();

// إعداد النسخ الاحتياطية التلقائية
document.addEventListener("DOMContentLoaded", () => {
  backupManager.setupAutoBackup();
});

// تصدير الكلاس للاستخدام العالمي
window.GymBackupManager = GymBackupManager;
window.gymBackupManager = backupManager;
window.exportToCSV = exportToCSV;

console.log("نظام النسخ الاحتياطي جاهز - Backup System Ready");
