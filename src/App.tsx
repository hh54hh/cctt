import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "./styles/print.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Import offline support
import { initializeOfflineSupport } from "@/lib/offline-storage";

// Pages
import Login from "./pages/Login";
import Subscribers from "./pages/Subscribers";
import AddSubscriber from "./pages/AddSubscriber";
import Courses from "./pages/Courses";
import DietPlans from "./pages/DietPlans";
import Inventory from "./pages/Inventory";
import SystemDiagnostics from "./pages/SystemDiagnostics";
import PrintSubscriber from "./pages/PrintSubscriber";
import PrintInvoice from "./pages/PrintInvoice";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ErrorBoundary from "./components/ErrorBoundary";

// Utils
import { getAuthState } from "@/lib/auth-new";
import {
  checkDatabaseInitialization,
  initializeDatabaseWithSampleData,
} from "@/lib/database-init";

// Loading component
const AppLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
      <h2 className="text-xl font-semibold text-gray-900">
        جاري تحميل النظام...
      </h2>
      <p className="text-gray-600">يرجى الانتظار قليلاً</p>
    </div>
  </div>
);

// Database error component
const DatabaseError = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
    <div className="text-center space-y-6 max-w-2xl">
      <div className="text-red-500 text-6xl">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900">
        خطأ في إعداد قاعدة البيانات
      </h2>
      <div className="bg-white p-6 rounded-lg border border-red-200 text-right">
        <p className="text-red-700 mb-4">{error}</p>
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
          <h3 className="font-semibold mb-2">خطوات الحل:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>انتقل إلى لوحة تحكم Supabase</li>
            <li>اذهب إلى قسم SQL Editor</li>
            <li>انسخ والصق محتوى ملف gym-management-new-schema.sql</li>
            <li>اضغط Run لتنفيذ الاستعلام</li>
            <li>أعد تحميل الصفحة</li>
          </ol>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        إعادة تحميل الصفحة
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
  } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const initializeApp = async () => {
    try {
      // Initialize offline support first
      initializeOfflineSupport();

      // Get auth state immediately and continue
      const auth = getAuthState();
      setAuthState(auth);
      setIsInitialized(true);
      setDbError(null);

      // Do database initialization in background without blocking
      setTimeout(async () => {
        try {
          const dbStatus = await checkDatabaseInitialization();
          if (navigator.onLine && dbStatus.isInitialized) {
            await initializeDatabaseWithSampleData();
          }
        } catch (error) {
          console.warn("Background initialization failed:", error);
        }
      }, 100);
    } catch (error) {
      console.error("App initialization failed:", error);

      // Always continue - don't block the app
      const auth = getAuthState();
      setAuthState(auth || { isAuthenticated: false });
      setIsInitialized(true);
      setDbError(null);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  // Show loading while initializing
  if (!isInitialized) {
    return <AppLoading />;
  }

  // If authState is null, set a default one
  if (!authState) {
    const auth = getAuthState();
    setAuthState(auth || { isAuthenticated: false });
    return <AppLoading />;
  }

  // Show database error if database is not properly set up
  if (dbError) {
    return <DatabaseError error={dbError} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to appropriate page based on auth */}
              <Route
                path="/"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard/subscribers" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* Login page */}
              <Route path="/login" element={<Login />} />

              {/* Print page (no authentication required) */}
              <Route path="/print/:id" element={<PrintSubscriber />} />

              {/* Protected dashboard routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Default dashboard route goes to subscribers */}
                <Route index element={<Navigate to="subscribers" replace />} />
                <Route path="subscribers" element={<Subscribers />} />
                <Route path="add-subscriber" element={<AddSubscriber />} />
                <Route
                  path="/dashboard/print-subscriber/:id"
                  element={<PrintSubscriber />}
                />
                <Route
                  path="/dashboard/print-invoice/:id"
                  element={<PrintInvoice />}
                />
                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="courses" element={<Courses />} />
                <Route path="diet-plans" element={<DietPlans />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="diagnostics" element={<SystemDiagnostics />} />
              </Route>

              {/* Catch all for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
