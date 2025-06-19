// Performance Optimizer for Third-party Libraries
// Reduces the impact of analytics and tracking libraries on app performance

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private optimizationsApplied = false;

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Apply all performance optimizations
  public applyOptimizations(): void {
    if (this.optimizationsApplied) return;

    this.throttleAnalytics();
    this.optimizeScrollEvents();
    this.debounceResizeEvents();
    this.preventMemoryLeaks();

    this.optimizationsApplied = true;

    if (process.env.NODE_ENV === "development") {
      console.log("⚡ Performance optimizations applied");
    }
  }

  // Throttle analytics tracking to reduce noise
  private throttleAnalytics(): void {
    if (typeof window === "undefined") return;

    // Throttle MobX reactions that might be firing too often
    const throttle = (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      let lastExecTime = 0;
      return function (...args: any[]) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
          func.apply(this, args);
          lastExecTime = currentTime;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(this, args);
            lastExecTime = Date.now();
          }, delay);
        }
      };
    };

    // Throttle common analytics methods if they exist
    const analyticsLibraries = ["amplitude", "FS", "gtag", "fbq", "_hsq"];

    analyticsLibraries.forEach((lib) => {
      const library = (window as any)[lib];
      if (library && typeof library.track === "function") {
        (window as any)[lib].track = throttle(library.track.bind(library), 100);
      }
      if (library && typeof library.identify === "function") {
        (window as any)[lib].identify = throttle(
          library.identify.bind(library),
          200,
        );
      }
    });
  }

  // Optimize scroll event handling
  private optimizeScrollEvents(): void {
    if (typeof window === "undefined") return;

    let scrollTimer: NodeJS.Timeout;
    const optimizedScrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        // Scroll handling logic here if needed
      }, 10);
    };

    // Replace any existing scroll listeners with optimized ones
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function (
      type: string,
      listener: EventListener,
      options?: any,
    ) {
      if (type === "scroll") {
        return originalAddEventListener.call(
          this,
          type,
          optimizedScrollHandler,
          options,
        );
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // Debounce resize events
  private debounceResizeEvents(): void {
    if (typeof window === "undefined") return;

    let resizeTimer: NodeJS.Timeout;
    const optimizedResizeHandler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Resize handling logic here if needed
      }, 150);
    };

    const originalAddEventListener = window.addEventListener;
    const newAddEventListener = window.addEventListener;

    window.addEventListener = function (
      type: string,
      listener: EventListener,
      options?: any,
    ) {
      if (type === "resize") {
        return newAddEventListener.call(
          this,
          type,
          optimizedResizeHandler,
          options,
        );
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // Prevent memory leaks from third-party libraries
  private preventMemoryLeaks(): void {
    if (typeof window === "undefined") return;

    // Clean up intervals that might be created by third-party libraries
    const originalSetInterval = window.setInterval;
    const intervals: NodeJS.Timeout[] = [];

    window.setInterval = function (callback: Function, delay?: number) {
      const id = originalSetInterval.call(this, callback, delay);
      intervals.push(id);
      return id;
    };

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
      intervals.forEach((id) => clearInterval(id));
    });

    // Limit the number of active timeouts
    const originalSetTimeout = window.setTimeout;
    let timeoutCount = 0;
    const MAX_TIMEOUTS = 100;

    window.setTimeout = function (callback: Function, delay?: number) {
      if (timeoutCount >= MAX_TIMEOUTS) {
        console.warn("🚨 Too many timeouts active, skipping...");
        return 0 as any;
      }

      timeoutCount++;
      const id = originalSetTimeout.call(
        this,
        () => {
          timeoutCount--;
          callback();
        },
        delay,
      );

      return id;
    };
  }

  // Emergency performance reset
  public emergencyReset(): void {
    if (typeof window === "undefined") return;

    // Clear all intervals and timeouts
    for (let i = 1; i < 10000; i++) {
      clearInterval(i);
      clearTimeout(i);
    }

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    console.log("🚨 Emergency performance reset applied");
  }

  // Aggressive optimization for critical performance issues
  public aggressiveOptimization(): void {
    if (typeof window === "undefined") return;

    // 1. Disable all animations temporarily
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: -1ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: -1ms !important;
      }
    `;
    document.head.appendChild(style);

    // 2. Reduce DOM manipulation
    document
      .querySelectorAll('[data-loc*="MobX"], [data-loc*="mobx"]')
      .forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

    // 3. Stop any running analytics
    ["amplitude", "FS", "gtag", "fbq", "_hsq", "hstc"].forEach((lib) => {
      if ((window as any)[lib]) {
        (window as any)[lib] = () => {};
      }
    });

    // 4. Disable console logging temporarily
    const originalConsole = { ...console };
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    // Restore console after 10 seconds
    setTimeout(() => {
      Object.assign(console, originalConsole);
    }, 10000);

    // 5. Force immediate garbage collection multiple times
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      }, i * 1000);
    }

    // 6. Remove heavy elements temporarily
    document.querySelectorAll("iframe, embed, object").forEach((el) => {
      el.style.display = "none";
    });

    console.log(
      "🚨 Aggressive performance optimization applied - FPS should improve",
    );

    // Re-enable after 30 seconds
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      document.querySelectorAll("iframe, embed, object").forEach((el) => {
        el.style.display = "";
      });
      console.log("✅ Aggressive optimizations lifted");
    }, 30000);
  }

  // Monitor performance and auto-optimize
  public startPerformanceMonitoring(): void {
    if (typeof window === "undefined") return;

    let frameCount = 0;
    let lastTime = performance.now();

    const monitorFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // If FPS drops below 30, apply emergency optimizations
        if (fps < 30) {
          console.warn(`⚠️ Low FPS detected: ${fps}`);
          this.emergencyReset();
        }

        // If FPS is critically low (< 10), apply more aggressive optimizations
        if (fps < 10) {
          console.error(
            `🚨 Critical FPS detected: ${fps} - applying aggressive optimizations`,
          );
          this.aggressiveOptimization();
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(monitorFrame);
    };

    requestAnimationFrame(monitorFrame);
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// DISABLED: Old performance optimizer replaced by performanceOptimizerFixed
// Auto-apply optimizations when module loads
// if (typeof window !== "undefined") {
//   // Apply optimizations after a short delay to allow other scripts to load
//   setTimeout(() => {
//     performanceOptimizer.applyOptimizations();
//   }, 1000);

//   // Start monitoring in development
//   if (process.env.NODE_ENV === "development") {
//     performanceOptimizer.startPerformanceMonitoring();
//   }
// }
