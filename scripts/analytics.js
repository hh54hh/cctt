// نظام المراقبة والتحليلات لحسام جم
// Analytics and Performance Monitoring for Hussam Gym

class GymAnalytics {
  constructor() {
    this.sessionStart = Date.now();
    this.events = [];
    this.performanceMetrics = {};
    this.userBehavior = {
      pageViews: {},
      clicks: {},
      formSubmissions: {},
      errors: [],
    };
    this.init();
  }

  init() {
    this.trackPageLoad();
    this.setupEventListeners();
    this.trackUserBehavior();
    this.monitorPerformance();
  }

  // تتبع تحميل الصفحة
  trackPageLoad() {
    const loadTime = Date.now() - this.sessionStart;
    this.logEvent("page_load", {
      path: window.location.pathname,
      loadTime,
      timestamp: new Date().toISOString(),
    });

    // تتبع معلومات الجهاز والمتصفح
    this.logEvent("session_start", {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // إعداد مستمعي الأحداث
  setupEventListeners() {
    // تتبع النقرات
    document.addEventListener("click", (event) => {
      const target = event.target;
      const buttonText = target.textContent?.trim() || "";
      const className = target.className || "";

      this.logEvent("click", {
        element: target.tagName,
        text: buttonText.substring(0, 50),
        className: className.substring(0, 100),
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    });

    // تتبع إرسال النماذج
    document.addEventListener("submit", (event) => {
      const form = event.target;
      const formData = new FormData(form);
      const fields = {};

      for (let [key, value] of formData.entries()) {
        // تسجيل اسماء الحقول فقط (بدون القيم للحفاظ على الخصوصية)
        fields[key] = typeof value;
      }

      this.logEvent("form_submit", {
        form: form.id || form.className,
        fields: Object.keys(fields),
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    });

    // تتبع الأخطاء
    window.addEventListener("error", (event) => {
      this.logError("javascript_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      });
    });

    // تتبع تغيير الصفحات (لـ SPA)
    window.addEventListener("popstate", () => {
      this.trackPageChange();
    });
  }

  // تتبع سلوك المستخدم
  trackUserBehavior() {
    // تتبع الوقت المقضي في الصفحة
    this.pageStartTime = Date.now();

    // تتبع التمرير
    let scrollDepth = 0;
    window.addEventListener("scroll", () => {
      const currentScroll =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (currentScroll > scrollDepth) {
        scrollDepth = currentScroll;
      }
    });

    // حفظ الوقت المقضي عند مغادرة الصفحة
    window.addEventListener("beforeunload", () => {
      const timeSpent = Date.now() - this.pageStartTime;
      this.logEvent("page_exit", {
        path: window.location.pathname,
        timeSpent,
        scrollDepth: Math.round(scrollDepth * 100),
        timestamp: new Date().toISOString(),
      });
      this.saveAnalytics();
    });
  }

  // مراقبة الأداء
  monitorPerformance() {
    // معلومات الأداء من Performance API
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType("navigation")[0];
          if (perfData) {
            this.performanceMetrics = {
              dns: perfData.domainLookupEnd - perfData.domainLookupStart,
              connection: perfData.connectEnd - perfData.connectStart,
              ttfb: perfData.responseStart - perfData.requestStart,
              domLoad:
                perfData.domContentLoadedEventEnd - perfData.navigationStart,
              fullLoad: perfData.loadEventEnd - perfData.navigationStart,
              timestamp: new Date().toISOString(),
            };

            this.logEvent("performance", this.performanceMetrics);
          }
        }, 1000);
      });
    }

    // مراقبة استخدام الذاكرة (إذا كان متوفراً)
    if ("memory" in performance) {
      setInterval(() => {
        this.logEvent("memory_usage", {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: new Date().toISOString(),
        });
      }, 30000); // كل 30 ثانية
    }
  }

  // تسجيل حدث
  logEvent(eventName, data) {
    const event = {
      name: eventName,
      data,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    console.log(`[Analytics] ${eventName}`, data);

    // حفظ دوري للأحداث
    if (this.events.length % 10 === 0) {
      this.saveAnalytics();
    }
  }

  // تسجيل خطأ
  logError(errorType, data) {
    const error = {
      type: errorType,
      data,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
    };

    this.userBehavior.errors.push(error);
    console.error(`[Analytics Error] ${errorType}`, data);
  }

  // تتبع تغيير الصفحة
  trackPageChange() {
    const timeSpent = Date.now() - this.pageStartTime;
    this.logEvent("page_change", {
      from: this.currentPath || "/",
      to: window.location.pathname,
      timeSpent,
      timestamp: new Date().toISOString(),
    });

    this.currentPath = window.location.pathname;
    this.pageStartTime = Date.now();
  }

  // الحصول على معرف الجلسة
  getSessionId() {
    let sessionId = sessionStorage.getItem("gym_session_id");
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36);
      sessionStorage.setItem("gym_session_id", sessionId);
    }
    return sessionId;
  }

  // حفظ التحليلات
  saveAnalytics() {
    const analyticsData = {
      events: this.events,
      userBehavior: this.userBehavior,
      performanceMetrics: this.performanceMetrics,
      sessionId: this.getSessionId(),
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem("gym_analytics", JSON.stringify(analyticsData));
  }

  // تحميل التحليلات المحفوظة
  loadAnalytics() {
    const saved = localStorage.getItem("gym_analytics");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("خطأ في تحميل بيانات التحليلات:", error);
      }
    }
    return null;
  }

  // إنشاء تقرير التحليلات
  generateReport() {
    const data = this.loadAnalytics() || {
      events: this.events,
      userBehavior: this.userBehavior,
      performanceMetrics: this.performanceMetrics,
    };

    const report = {
      overview: {
        totalEvents: data.events?.length || 0,
        totalErrors: data.userBehavior?.errors?.length || 0,
        sessionDuration: Date.now() - this.sessionStart,
        generatedAt: new Date().toISOString(),
      },
      pageViews: this.analyzePageViews(data.events || []),
      topActions: this.analyzeTopActions(data.events || []),
      errors: data.userBehavior?.errors || [],
      performance: data.performanceMetrics || {},
    };

    return report;
  }

  // تحليل زيارات الصفحات
  analyzePageViews(events) {
    const pageViews = {};
    events
      .filter(
        (event) => event.name === "page_load" || event.name === "page_change",
      )
      .forEach((event) => {
        const path = event.data.path || event.data.to;
        pageViews[path] = (pageViews[path] || 0) + 1;
      });

    return Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  // تحليل الإجراءات الأكثر شيوعاً
  analyzeTopActions(events) {
    const actions = {};
    events
      .filter((event) => event.name === "click")
      .forEach((event) => {
        const action = event.data.text || event.data.element;
        if (action) {
          actions[action] = (actions[action] || 0) + 1;
        }
      });

    return Object.entries(actions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  // تصدير التقرير
  exportReport() {
    const report = this.generateReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const fileName = `gym-analytics-${new Date().toISOString().split("T")[0]}.json`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return report;
  }

  // مسح بيانات التحليلات
  clearAnalytics() {
    localStorage.removeItem("gym_analytics");
    this.events = [];
    this.userBehavior = {
      pageViews: {},
      clicks: {},
      formSubmissions: {},
      errors: [],
    };
    console.log("تم مسح بيانات التحليلات");
  }

  // إرسال التحليلات لخادم خارجي (اختياري)
  async sendAnalytics(endpoint) {
    const data = this.generateReport();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("تم إرسال بيانات التحليلات بنجاح");
        // مسح البيانات المحلية بعد الإرسال الناجح
        this.clearAnalytics();
      } else {
        console.error("فشل في إرسال التحليلات:", response.status);
      }
    } catch (error) {
      console.error("خطأ في إرسال التحليلات:", error);
    }
  }
}

// مراقب الاستخدام المتقدم للنظام
class GymUsageMonitor {
  constructor() {
    this.features = {
      addMember: 0,
      viewMembers: 0,
      editMember: 0,
      deleteMember: 0,
      printMember: 0,
      addProduct: 0,
      editProduct: 0,
      deleteProduct: 0,
      createSale: 0,
      addCourse: 0,
      addDiet: 0,
      login: 0,
    };
    this.setupFeatureTracking();
  }

  setupFeatureTracking() {
    // تتبع استخدام المميزات
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button) {
        const text = button.textContent?.trim().toLowerCase();

        // تحديد نوع الميزة من النص
        if (text.includes("إضافة مشترك") || text.includes("إضافة عضو")) {
          this.trackFeature("addMember");
        } else if (text.includes("عرض") && text.includes("مشترك")) {
          this.trackFeature("viewMembers");
        } else if (text.includes("طباعة")) {
          this.trackFeature("printMember");
        } else if (text.includes("إضافة منتج")) {
          this.trackFeature("addProduct");
        } else if (text.includes("إضافة عملية بيع")) {
          this.trackFeature("createSale");
        } else if (text.includes("دخول النظام")) {
          this.trackFeature("login");
        }
      }
    });
  }

  trackFeature(featureName) {
    if (this.features.hasOwnProperty(featureName)) {
      this.features[featureName]++;
      console.log(`[Usage] ${featureName}: ${this.features[featureName]}`);
      this.saveUsageData();
    }
  }

  saveUsageData() {
    const usageData = {
      features: this.features,
      lastUpdated: new Date().toISOString(),
      sessionStart: Date.now(),
    };
    localStorage.setItem("gym_usage", JSON.stringify(usageData));
  }

  getUsageReport() {
    const total = Object.values(this.features).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      totalActions: total,
      features: this.features,
      mostUsed: Object.entries(this.features)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      generatedAt: new Date().toISOString(),
    };
  }
}

// تشغيل النظام
const gymAnalytics = new GymAnalytics();
const usageMonitor = new GymUsageMonitor();

// تصدير للاستخدام العالمي
window.gymAnalytics = gymAnalytics;
window.usageMonitor = usageMonitor;

console.log("نظام التحليلات والمراقبة جاهز - Analytics System Ready");
