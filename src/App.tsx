import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/shared";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Challenges from "./pages/Challenges";
import ChallengeWorkspace from "./pages/ChallengeWorkspace";
import Progress from "./pages/Progress";
import SOCDashboard from "./pages/SOCDashboard";
import AuditMode from "./pages/AuditMode";
import SystemHealth from "./pages/SystemHealth";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/challenges" 
            element={
              <ProtectedRoute>
                <Challenges />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/challenges/:id" 
            element={
              <ProtectedRoute>
                <ChallengeWorkspace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/soc" 
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <SOCDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <AuditMode />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit/:sessionId" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <AuditMode />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemHealth />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to dashboard or login */}
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
