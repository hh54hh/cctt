// Enhanced Vite HMR Error Handler
// Handles WebSocket connection issues and HMR errors gracefully

let reconnectAttempts = 0;
const maxReconnectAttempts = 3;
const reconnectDelay = 1000; // 1 second

// Handle Vite WebSocket and HMR errors
const handleViteError = (error: any) => {
  const errorMessage = error?.message || error?.toString() || "";

  // Check if it's a Vite-related error
  const isViteError =
    errorMessage.includes("WebSocket") ||
    errorMessage.includes("[vite]") ||
    errorMessage.includes("HMR") ||
    errorMessage.includes(
      "Cannot read properties of undefined (reading 'send')",
    ) ||
    errorMessage.includes("Connection lost") ||
    errorMessage.includes("closed without opened");

  if (isViteError) {
    console.log("🔄 Vite connection issue handled gracefully");

    // Try to reconnect if needed
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;

      setTimeout(() => {
        // The browser will handle reconnection automatically
        console.log(
          `🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`,
        );
      }, reconnectDelay * reconnectAttempts);
    }

    return true; // Indicate that we handled this error
  }

  return false; // Not a Vite error
};

// Setup global error handlers for Vite issues
const setupViteErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    if (handleViteError(event.reason)) {
      event.preventDefault(); // Suppress the error in console
    }
  });

  // Handle regular errors
  window.addEventListener("error", (event) => {
    if (handleViteError(event.error)) {
      event.preventDefault(); // Suppress the error in console
    }
  });

  // HMR connection handlers
  if (import.meta.hot) {
    import.meta.hot.on("vite:ws:connect", () => {
      reconnectAttempts = 0;
      console.log("✅ Vite HMR connected");
    });

    import.meta.hot.on("vite:ws:disconnect", () => {
      console.log("⚠️ Vite HMR disconnected");
    });

    import.meta.hot.on("vite:error", (payload) => {
      console.log("🔄 Vite error handled:", payload?.type || "unknown");
    });
  }
};

// Auto-setup in development mode
if (import.meta.env.DEV) {
  setupViteErrorHandlers();
}

export { handleViteError, setupViteErrorHandlers };
