const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // Platform info
  platform: process.platform,

  // App info
  isElectron: true,

  // Print functionality
  print: () => {
    window.print();
  },

  // Show message
  showMessage: (message) => {
    console.log("Electron Message:", message);
  },
});

// Add custom CSS for Electron
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    /* Electron-specific styles */
    body {
      -webkit-app-region: no-drag;
      user-select: text;
    }
    
    /* Custom scrollbar for better desktop experience */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
    
    /* Better focus styles for desktop */
    button:focus,
    input:focus,
    textarea:focus,
    select:focus {
      outline: 2px solid #f97316;
      outline-offset: 2px;
    }
    
    /* Disable text selection on UI elements */
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Desktop-optimized buttons */
    button {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    button:hover {
      transform: translateY(-1px);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    /* Better print styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    /* Electron app indicator */
    .app-indicator {
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      z-index: 9999;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Add Electron indicator
  const indicator = document.createElement("div");
  indicator.className = "app-indicator";
  indicator.textContent = "تطبيق سطح المكتب";
  document.body.appendChild(indicator);

  // Hide indicator after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = "0";
    indicator.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      indicator.remove();
    }, 500);
  }, 3000);
});

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + R: Refresh
  if ((e.ctrlKey || e.metaKey) && e.key === "r") {
    e.preventDefault();
    window.location.reload();
  }

  // F5: Refresh
  if (e.key === "F5") {
    e.preventDefault();
    window.location.reload();
  }

  // Ctrl/Cmd + P: Print
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault();
    window.print();
  }

  // Escape: Close modals
  if (e.key === "Escape") {
    // Close any open dialogs/modals
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach((dialog) => {
      const closeButton =
        dialog.querySelector('[aria-label="Close"]') ||
        dialog.querySelector("button[data-dismiss]");
      if (closeButton) {
        closeButton.click();
      }
    });
  }
});

// Performance optimizations for Electron
window.addEventListener("load", () => {
  // Optimize images loading
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.setAttribute("loading", "lazy");
  });

  // Add navigation helpers
  window.electronNavigation = {
    goToMembers: () => (window.location.hash = "/dashboard/members"),
    goToAddMember: () => (window.location.hash = "/dashboard/add-member"),
    goToCourses: () => (window.location.hash = "/dashboard/courses"),
    goToDietPlans: () => (window.location.hash = "/dashboard/diet-plans"),
    goToInventory: () => (window.location.hash = "/dashboard/inventory"),
  };
});

console.log("Preload script loaded successfully");
