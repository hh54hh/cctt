import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Members from "./pages/Members";
import AddMember from "./pages/AddMember";
import AddMemberEnhanced from "./pages/AddMemberEnhanced";
import Courses from "./pages/Courses";
import CoursesEnhanced from "./pages/CoursesEnhanced";
import DietPlans from "./pages/DietPlans";
import DietPlansEnhanced from "./pages/DietPlansEnhanced";
import Inventory from "./pages/Inventory";
import InventoryEnhanced from "./pages/InventoryEnhanced";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { initOfflineSupport } from "./lib/offline-manager";
import "./App.css";

function App() {
  useEffect(() => {
    // Initialize offline support
    initOfflineSupport().catch(console.error);

    // Add meta tags for mobile app
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      );
    }

    // Add theme color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#f97316";
      document.head.appendChild(meta);
    }

    // Add apple mobile web app capable
    const appleMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]',
    );
    if (!appleMeta) {
      const meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-capable";
      meta.content = "yes";
      document.head.appendChild(meta);
    }

    // Add apple status bar style
    const appleStatus = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );
    if (!appleStatus) {
      const meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-status-bar-style";
      meta.content = "default";
      document.head.appendChild(meta);
    }

    // Add app title for Apple
    const appleTitle = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]',
    );
    if (!appleTitle) {
      const meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-title";
      meta.content = "صالة حسام";
      document.head.appendChild(meta);
    }

    // Install prompt for PWA
    let deferredPrompt: any;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install prompt after a delay
      setTimeout(() => {
        if (deferredPrompt && !localStorage.getItem("pwa-install-dismissed")) {
          const shouldInstall = confirm(
            "هل تريد تثبيت تطبيق صالة حسام على جهازك؟",
          );
          if (shouldInstall) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === "accepted") {
                console.log("User accepted the install prompt");
              } else {
                console.log("User dismissed the install prompt");
                localStorage.setItem("pwa-install-dismissed", "true");
              }
              deferredPrompt = null;
            });
          } else {
            localStorage.setItem("pwa-install-dismissed", "true");
          }
        }
      }, 5000); // Show after 5 seconds
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      localStorage.removeItem("pwa-install-dismissed");
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/dashboard"
                    element={<Navigate to="/dashboard/members" replace />}
                  />

                  {/* Enhanced Pages (Primary) */}
                  <Route path="/dashboard/members" element={<Members />} />
                  <Route
                    path="/dashboard/add-member"
                    element={<AddMemberEnhanced />}
                  />
                  <Route
                    path="/dashboard/courses"
                    element={<CoursesEnhanced />}
                  />
                  <Route
                    path="/dashboard/diet-plans"
                    element={<DietPlansEnhanced />}
                  />
                  <Route
                    path="/dashboard/inventory"
                    element={<InventoryEnhanced />}
                  />

                  {/* Legacy Routes (Fallback) */}
                  <Route
                    path="/dashboard/add-member-basic"
                    element={<AddMember />}
                  />
                  <Route
                    path="/dashboard/courses-basic"
                    element={<Courses />}
                  />
                  <Route
                    path="/dashboard/diet-plans-basic"
                    element={<DietPlans />}
                  />
                  <Route
                    path="/dashboard/inventory-basic"
                    element={<Inventory />}
                  />

                  {/* Redirect old routes */}
                  <Route
                    path="/members"
                    element={<Navigate to="/dashboard/members" replace />}
                  />
                  <Route
                    path="/add-member"
                    element={<Navigate to="/dashboard/add-member" replace />}
                  />
                  <Route
                    path="/courses"
                    element={<Navigate to="/dashboard/courses" replace />}
                  />
                  <Route
                    path="/diet-plans"
                    element={<Navigate to="/dashboard/diet-plans" replace />}
                  />
                  <Route
                    path="/inventory"
                    element={<Navigate to="/dashboard/inventory" replace />}
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
