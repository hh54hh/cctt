import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import console filter to suppress third-party library warnings
import "./utils/consoleFilter";

// Import Vite error handler
import "./utils/viteErrorHandler";

// Register service worker for PWA
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user to refresh the page
    if (confirm("New content available, reload?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // App is ready to work offline
    console.log("App ready to work offline");
  },
  onRegisterError(error) {
    // Service worker registration failed, continue without it
    console.warn("SW registration failed:", error);
  },
});

// Prevent service worker issues in development
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    console.log("About to update");
  });
}

createRoot(document.getElementById("root")!).render(<App />);
