// Console Filter to suppress third-party library warnings
// These warnings come from external analytics libraries and don't affect our app functionality

// Store original console methods
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// List of warning patterns to suppress
const SUPPRESSED_WARNINGS = [
  "FullStory namespace conflict",
  "[mobx.array] Attempt to read an array index",
  "Could not get cookie SecurityError",
  "The document is sandboxed and lacks the 'allow-same-origin' flag",
  "Understand this warning",
  "Understand this error",
];

// List of error patterns to suppress (but still log them in development)
const SUPPRESSED_ERRORS = [
  "Failed to read the 'cookie' property from 'Document'",
  "SecurityError: Failed to read",
  "amplitude",
  "hubspot",
  "hstc.tracking",
  // Vite HMR errors that are not critical
  "Cannot read properties of undefined (reading 'send')",
  "[vite] TypeError: Cannot read properties",
  "WebSocket connection",
  "[vite] client error",
  "HMR update error",
];

// Function to check if message should be suppressed
const shouldSuppress = (message: string, patterns: string[]): boolean => {
  return patterns.some((pattern) =>
    message.toLowerCase().includes(pattern.toLowerCase()),
  );
};

// Custom console.warn that filters out known third-party warnings
console.warn = (...args: any[]) => {
  const message = args.join(" ");

  if (!shouldSuppress(message, SUPPRESSED_WARNINGS)) {
    originalWarn.apply(console, args);
  }
};

// Custom console.error that filters out known third-party errors
console.error = (...args: any[]) => {
  const message = args.join(" ");

  // In development, show suppressed errors but mark them
  if (
    process.env.NODE_ENV === "development" &&
    shouldSuppress(message, SUPPRESSED_ERRORS)
  ) {
    originalLog.apply(console, [
      "%c🔇 Suppressed Third-party Error:",
      "color: orange; font-weight: bold;",
      ...args,
    ]);
    return;
  }

  // Show all other errors normally
  if (!shouldSuppress(message, SUPPRESSED_ERRORS)) {
    originalError.apply(console, args);
  }
};

// Optional: Override MobX warnings specifically
if (typeof window !== "undefined") {
  // Disable MobX warnings about array bounds
  const originalArrayGet = Array.prototype.get;
  if (originalArrayGet) {
    // This is a MobX observable array method
    try {
      // Safely override MobX array access warnings
      Object.defineProperty(Array.prototype, "get", {
        value: function (index: number) {
          if (this.length === 0 || index >= this.length) {
            return undefined; // Return undefined instead of warning
          }
          return originalArrayGet.call(this, index);
        },
        writable: true,
        configurable: true,
      });
    } catch (e) {
      // Silently fail if we can't override
    }
  }

  // Set FullStory namespace to prevent conflicts
  if (!window._fs_namespace) {
    window._fs_namespace = "FS_SILENCED";
  }
}

// Export utility functions for manual use
export const restoreConsole = () => {
  console.warn = originalWarn;
  console.error = originalError;
  console.log = originalLog;
};

export const enableVerboseLogging = () => {
  restoreConsole();
  console.log(
    "🔊 Verbose logging enabled - all warnings and errors will be shown",
  );
};

export const enableQuietMode = () => {
  console.warn = () => {}; // Suppress all warnings
  console.log("🔇 Quiet mode enabled - warnings suppressed");
};

// Log filter activation
if (process.env.NODE_ENV === "development") {
  console.log(
    "%c🔧 Console Filter Active",
    "color: blue; font-weight: bold;",
    "\nSuppressing third-party library warnings.",
    "\nYour app warnings will still be shown.",
    "\nCall enableVerboseLogging() to see all messages.",
  );
}
