import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import { EmployeeProfile } from "@/components/employee/EmployeeProfile";
import Recruitment from "./pages/Recruitment";
import { EditCandidate } from "./pages/EditCandidate";
import SocialMedia from "./pages/SocialMedia";
import Budget from "./pages/Budget";
import Documents from "./pages/Documents";
import LeaveManagement from "./pages/LeaveManagement";
import SalaryManagement from "./pages/SalaryManagement";
import ClientManagement from "./pages/ClientManagement";
import TaskManagement from "./pages/TaskManagement";
import Analytics from "./pages/Analytics";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import ClientFeedbackForm from '@/app/feedback/client/[token]/page';
import { ProductivityDashboard } from "@/components/productivity/ProductivityDashboard";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/employee" element={
                <ProtectedRoute>
                  <EmployeeProvider>
                    <EmployeeDashboard />
                  </EmployeeProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/employee/profile/:id" element={
                <ProtectedRoute>
                  <EmployeeProvider>
                    <EmployeeProfile />
                  </EmployeeProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/recruitment" element={
                <ProtectedRoute>
                  <EmployeeProvider>
                    <Recruitment />
                  </EmployeeProvider>
                </ProtectedRoute>
              } />
              <Route path="/recruitment/candidates/:id/edit" element={
                <ProtectedRoute>
                  <EditCandidate />
                </ProtectedRoute>
              } />
              <Route path="/recruitment/candidates/:id" element={
                <ProtectedRoute>
                  <EditCandidate />
                </ProtectedRoute>
              } />
              <Route path="/social" element={
                <ProtectedRoute>
                  <SocialMedia />
                </ProtectedRoute>
              } />
              <Route path="/budget" element={
                <ProtectedRoute>
                  <Budget />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/leave" element={
                <ProtectedRoute>
                  <LeaveManagement />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <ClientManagement />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <EmployeeProvider>
                    <TaskManagement />
                  </EmployeeProvider>
                </ProtectedRoute>
              } />
              <Route path="/salary" element={
                <ProtectedRoute>
                  <SalaryManagement />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              } />
              <Route path="/feedback/client/:token" element={<ClientFeedbackForm />} />
              <Route path="/productivity" element={<ProductivityDashboard />} />
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
