import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initializeGymData } from "@/lib/initializeData";
import { toast } from "sonner";

// Layout
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Subscribers from "./pages/Subscribers";
import AddSubscriber from "./pages/AddSubscriber";
import Courses from "./pages/Courses";
import Diet from "./pages/Diet";
import Store from "./pages/Store";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeGymData();

    // Service Worker message listener
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        const { type, message } = event.data;

        switch (type) {
          case "SYNC_START":
            toast.info(message, {
              description: "جاري مزامنة البيانات مع الخادم...",
              duration: 2000,
            });
            break;
          case "SYNC_COMPLETE":
            toast.success(message, {
              description: "تم تحديث جميع البيانات بنجاح",
              duration: 3000,
            });
            break;
          case "SYNC_ERROR":
            toast.error(message, {
              description: "سيتم المحاولة مرة أخرى تلقائياً",
              duration: 4000,
            });
            break;
          default:
            break;
        }
      });

      // Request background sync when app loads
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "REQUEST_SYNC",
          });
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Login route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/subscribers" replace />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="add-subscriber" element={<AddSubscriber />} />
              <Route path="courses" element={<Courses />} />
              <Route path="diet" element={<Diet />} />
              <Route path="store" element={<Store />} />
              <Route path="sales" element={<Sales />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
