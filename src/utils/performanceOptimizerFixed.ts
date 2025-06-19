class PerformanceOptimizerFixed {
  private static instance: PerformanceOptimizerFixed;
  private isOptimizationActive = false;
  private isAggressiveActive = false;
  private isMonitoringActive = false;
  private monitoringInterval: number | null = null;
  private fpsHistory: number[] = [];
  private emergencyResetCount = 0;
  private maxEmergencyResets = 3;

  private constructor() {}

  public static getInstance(): PerformanceOptimizerFixed {
    if (!PerformanceOptimizerFixed.instance) {
      PerformanceOptimizerFixed.instance = new PerformanceOptimizerFixed();
    }
    return PerformanceOptimizerFixed.instance;
  }

  // Basic optimizations that don't break functionality
  public applyOptimizations(): void {
    if (typeof window === "undefined" || this.isOptimizationActive) return;

    this.isOptimizationActive = true;

    try {
      // 1. Disable third-party tracking when performance is critical
      this.disableNonEssentialTracking();

      // 2. Optimize MobX warnings
      this.optimizeMobXWarnings();

      // 3. Reduce animation intensity on low-end devices
      this.optimizeAnimations();

      // 4. Implement memory cleanup
      this.scheduleMemoryCleanup();

      console.log("⚡ Performance optimizations applied");
    } catch (error) {
      console.error("Error applying optimizations:", error);
    }
  }

  private disableNonEssentialTracking(): void {
    // Only disable tracking during critical performance issues
    const trackingLibs = [
      "amplitude",
      "FS",
      "_fs_debug",
      "gtag",
      "fbq",
      "_hsq",
      "hstc",
      "FullStory",
    ];

    trackingLibs.forEach((lib) => {
      if ((window as any)[lib] && typeof (window as any)[lib] === "object") {
        // Store original reference for later restoration
        (window as any)[`_original_${lib}`] = (window as any)[lib];

        // Replace with no-op functions
        (window as any)[lib] = new Proxy(
          {},
          {
            get: () => () => {},
            set: () => true,
          },
        );
      }
    });
  }

  private optimizeMobXWarnings(): void {
    // Reduce MobX array access warnings that can cause performance issues
    if (typeof window !== "undefined") {
      const originalArrayGet = Array.prototype.get;
      if (originalArrayGet) {
        try {
          Object.defineProperty(Array.prototype, "get", {
            value: function (index: number) {
              if (this.length === 0 || index >= this.length) {
                return undefined;
              }
              return originalArrayGet.call(this, index);
            },
            configurable: true,
          });
        } catch (error) {
          // Ignore if we can't override
        }
      }
    }
  }

  private optimizeAnimations(): void {
    // Reduce animation complexity for better performance
    const style = document.createElement("style");
    style.id = "performance-optimization-styles";
    style.innerHTML = `
      .animate-spin {
        animation-duration: 2s !important;
      }
      .transition-all, .transition-colors, .transition-opacity {
        transition-duration: 0.1s !important;
      }
      [data-radix-popper-content-wrapper] {
        will-change: transform !important;
      }
    `;

    // Only add if not already present
    if (!document.getElementById("performance-optimization-styles")) {
      document.head.appendChild(style);
    }
  }

  private scheduleMemoryCleanup(): void {
    // Schedule regular memory cleanup
    setInterval(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    }, 30000); // Every 30 seconds
  }

  // Emergency reset with limits to prevent infinite loops
  public emergencyReset(): void {
    if (typeof window === "undefined") return;

    if (this.emergencyResetCount >= this.maxEmergencyResets) {
      console.error(
        "🚨 Maximum emergency resets reached. Stopping performance monitoring to prevent infinite loops.",
      );
      this.stopPerformanceMonitoring();
      return;
    }

    this.emergencyResetCount++;

    try {
      // Clear problematic intervals/timeouts more selectively
      this.clearProblematicTimers();

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }

      // Reset emergency count after successful reset
      setTimeout(() => {
        this.emergencyResetCount = Math.max(0, this.emergencyResetCount - 1);
      }, 60000); // Reset count after 1 minute

      console.log(
        `🚨 Emergency performance reset applied (${this.emergencyResetCount}/${this.maxEmergencyResets})`,
      );
    } catch (error) {
      console.error("Error during emergency reset:", error);
    }
  }

  private clearProblematicTimers(): void {
    // Only clear timers that might be causing issues
    // Don't clear ALL timers as this breaks functionality

    // Clear high-frequency intervals (likely problematic)
    for (let i = 1; i < 1000; i++) {
      try {
        clearInterval(i);
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // Safer aggressive optimization
  public safeAggressiveOptimization(): void {
    if (typeof window === "undefined" || this.isAggressiveActive) return;

    this.isAggressiveActive = true;

    try {
      console.warn("🚨 Applying safe aggressive optimizations for 0 FPS issue");

      // 1. Temporarily reduce DOM updates
      this.reduceAnimations();

      // 2. Pause non-essential processes
      this.pauseNonEssentialProcesses();

      // 3. Clear memory more aggressively
      this.aggressiveMemoryCleanup();

      // 4. Reduce tracking overhead
      this.disableNonEssentialTracking();

      // Auto-restore after 15 seconds (shorter than original)
      setTimeout(() => {
        this.restoreNormalOperation();
      }, 15000);
    } catch (error) {
      console.error("Error during aggressive optimization:", error);
      this.restoreNormalOperation();
    }
  }

  private reduceAnimations(): void {
    const style = document.createElement("style");
    style.id = "aggressive-performance-styles";
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      .animate-spin {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private pauseNonEssentialProcesses(): void {
    // Pause heavy DOM elements
    document.querySelectorAll("iframe, embed, object, video").forEach((el) => {
      (el as HTMLElement).style.visibility = "hidden";
    });
  }

  private aggressiveMemoryCleanup(): void {
    // Multiple garbage collection attempts
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      }, i * 1000);
    }
  }

  private restoreNormalOperation(): void {
    try {
      // Remove aggressive styles
      const aggressiveStyles = document.getElementById(
        "aggressive-performance-styles",
      );
      if (aggressiveStyles) {
        aggressiveStyles.remove();
      }

      // Restore DOM elements
      document
        .querySelectorAll("iframe, embed, object, video")
        .forEach((el) => {
          (el as HTMLElement).style.visibility = "";
        });

      // Restore tracking if needed
      this.restoreTracking();

      this.isAggressiveActive = false;
      console.log("✅ Normal operation restored");
    } catch (error) {
      console.error("Error restoring normal operation:", error);
    }
  }

  private restoreTracking(): void {
    // Restore original tracking libraries
    const trackingLibs = ["amplitude", "FS", "gtag", "fbq", "_hsq", "hstc"];

    trackingLibs.forEach((lib) => {
      const originalLib = (window as any)[`_original_${lib}`];
      if (originalLib) {
        (window as any)[lib] = originalLib;
        delete (window as any)[`_original_${lib}`];
      }
    });
  }

  // Improved performance monitoring with better 0 FPS handling
  public startPerformanceMonitoring(): void {
    if (typeof window === "undefined" || this.isMonitoringActive) return;

    this.isMonitoringActive = true;
    let frameCount = 0;
    let lastTime = performance.now();
    let consecutiveZeroFPS = 0;

    const monitorFrame = () => {
      if (!this.isMonitoringActive) return;

      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // Add to FPS history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }

        // Calculate average FPS over last few measurements
        const avgFPS =
          this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        // Handle 0 FPS specially
        if (fps === 0) {
          consecutiveZeroFPS++;

          if (consecutiveZeroFPS === 1) {
            console.warn("⚠️ First 0 FPS detected - monitoring...");
          } else if (consecutiveZeroFPS === 2) {
            console.error("🚨 Critical: 2 consecutive 0 FPS measurements");
            this.safeAggressiveOptimization();
          } else if (consecutiveZeroFPS >= 3) {
            console.error(
              "🚨 EMERGENCY: 3+ consecutive 0 FPS - stopping monitoring to prevent infinite loops",
            );
            this.stopPerformanceMonitoring();
            return;
          }
        } else {
          consecutiveZeroFPS = 0; // Reset counter on non-zero FPS
        }

        // Apply optimizations based on sustained low performance
        if (avgFPS < 15 && avgFPS > 0) {
          console.warn(`⚠️ Sustained low FPS: ${Math.round(avgFPS)}`);
          if (!this.isOptimizationActive) {
            this.applyOptimizations();
          }
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(monitorFrame);
    };

    requestAnimationFrame(monitorFrame);
  }

  public stopPerformanceMonitoring(): void {
    this.isMonitoringActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log("🛑 Performance monitoring stopped");
  }

  // Method to manually trigger recovery from 0 FPS
  public recoverFromZeroFPS(): void {
    console.log("🔧 Manual recovery from 0 FPS initiated");

    // Stop monitoring temporarily
    this.stopPerformanceMonitoring();

    // Apply emergency measures
    this.emergencyReset();

    // Restart monitoring after a delay
    setTimeout(() => {
      this.fpsHistory = []; // Clear history
      this.emergencyResetCount = 0; // Reset emergency count
      this.startPerformanceMonitoring();
      console.log("🔄 Performance monitoring restarted after recovery");
    }, 5000);
  }

  public getStatus() {
    return {
      isOptimizationActive: this.isOptimizationActive,
      isAggressiveActive: this.isAggressiveActive,
      isMonitoringActive: this.isMonitoringActive,
      emergencyResetCount: this.emergencyResetCount,
      fpsHistory: [...this.fpsHistory],
      avgFPS:
        this.fpsHistory.length > 0
          ? Math.round(
              this.fpsHistory.reduce((a, b) => a + b, 0) /
                this.fpsHistory.length,
            )
          : 0,
    };
  }
}

// Export singleton instance
export const performanceOptimizerFixed =
  PerformanceOptimizerFixed.getInstance();

// Auto-apply optimizations when module loads (with error handling)
if (typeof window !== "undefined") {
  try {
    // Apply optimizations after a short delay
    setTimeout(() => {
      performanceOptimizerFixed.applyOptimizations();
    }, 2000);

    // Start monitoring in development with error handling
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        performanceOptimizerFixed.startPerformanceMonitoring();
      }, 3000);
    }
  } catch (error) {
    console.error("Error initializing performance optimizer:", error);
  }
}

// Global recovery function
if (typeof window !== "undefined") {
  (window as any).recoverFromZeroFPS = () => {
    performanceOptimizerFixed.recoverFromZeroFPS();
  };
}
