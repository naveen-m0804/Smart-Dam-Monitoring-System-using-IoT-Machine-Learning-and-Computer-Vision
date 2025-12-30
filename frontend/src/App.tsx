import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import LoginPage from "@/pages/LoginPage";
import LogsPage from "@/pages/LogsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/logs/water-level" 
              element={
                <ProtectedRoute requireAdmin>
                  <LogsPage type="water-level" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs/env" 
              element={
                <ProtectedRoute requireAdmin>
                  <LogsPage type="env" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs/vibration" 
              element={
                <ProtectedRoute requireAdmin>
                  <LogsPage type="vibration" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs/rainfall" 
              element={
                <ProtectedRoute requireAdmin>
                  <LogsPage type="rainfall" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs/all" 
              element={
                <ProtectedRoute requireAdmin>
                  <LogsPage type="all" />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
