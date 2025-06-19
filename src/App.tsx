import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/database";
import { quickSupabaseCheck } from "@/lib/supabase-validator";
import SyncNotifications from "@/components/SyncNotifications";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddMember from "./pages/AddMember";
import Members from "./pages/Members";
import Courses from "./pages/Courses";
import Diet from "./pages/Diet";
import Products from "./pages/Products";
import Print from "./pages/Print";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    // Initialize database and validate Supabase
    const initializeApp = async () => {
      try {
        // Check Supabase connection first
        console.log("🚀 تهيئة نظام حسام جم...");
        await quickSupabaseCheck();

        // Initialize database with sample data
        await db.initializeSampleData();
        console.log("✅ تم تهيئة النظام بنجاح");
      } catch (error) {
        console.error("❌ خطأ في تهيئة النظام:", error);
      }
    };

    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SyncNotifications />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-member"
              element={
                <ProtectedRoute>
                  <AddMember />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/diet"
              element={
                <ProtectedRoute>
                  <Diet />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/print/:memberId"
              element={
                <ProtectedRoute>
                  <Print />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
