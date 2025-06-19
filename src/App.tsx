import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Pages
import Login from "./pages/Login";
import Members from "./pages/Members";
import AddMember from "./pages/AddMember";
import AddMemberEnhanced from "./pages/AddMemberEnhanced";
import Courses from "./pages/Courses";
import DietPlans from "./pages/DietPlans";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Utils
import { initializeDatabase } from "./lib/database";
import { getAuthState } from "./lib/storage-new";

// Loading component
const DatabaseLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
      <h2 className="text-xl font-semibold text-gray-900">
        جاري تهيئة قاعدة البيانات...
      </h2>
      <p className="text-gray-600">يرجى الانتظار قليلاً</p>
    </div>
  </div>
);

const DatabaseError = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-red-500 text-6xl">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900">
        خطأ في قاعدة البيانات
      </h2>
      <p className="text-gray-600">{error}</p>
      <button
        onClick={onRetry}
        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  const [isDBInitialized, setIsDBInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
  } | null>(null);

  const initializeApp = async () => {
    try {
      setDbError(null);
      // Initialize database
      await initializeDatabase();
      setIsDBInitialized(true);

      // Get auth state
      const auth = await getAuthState();
      setAuthState(auth);
    } catch (error) {
      console.error("Database initialization failed:", error);
      setDbError(
        error instanceof Error ? error.message : "فشل في تهيئة قاعدة البيانات",
      );
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  // Show loading while initializing database
  if (!isDBInitialized && !dbError) {
    return <DatabaseLoading />;
  }

  // Show error if database failed to initialize
  if (dbError) {
    return <DatabaseError error={dbError} onRetry={initializeApp} />;
  }

  // Show loading if auth state is not loaded yet
  if (!authState) {
    return <DatabaseLoading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to appropriate page based on auth */}
            <Route
              path="/"
              element={
                authState.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Login page */}
            <Route path="/login" element={<Login />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default dashboard route goes to members */}
              <Route index element={<Members />} />
              <Route path="members" element={<Members />} />
              <Route path="add-member" element={<AddMemberEnhanced />} />
              <Route
                path="add-member-enhanced"
                element={<AddMemberEnhanced />}
              />
              <Route path="courses" element={<Courses />} />
              <Route path="diet-plans" element={<DietPlans />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>

            {/* Catch all for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
