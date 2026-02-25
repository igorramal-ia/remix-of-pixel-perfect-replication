import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Campaigns from "./pages/Campaigns";
import MapPage from "./pages/MapPage";
import Login from "./pages/Login";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import { PlaceholderPage } from "./components/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route 
                path="/" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/inventario" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes']}>
                    <Inventory />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/campanhas" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes', 'coordenador']}>
                    <Campaigns />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/mapa" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes', 'coordenador']}>
                    <MapPage />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/relatorios" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes']}>
                    <PlaceholderPage page="reports" />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/ia" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador', 'operacoes']}>
                    <PlaceholderPage page="ai" />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/usuarios" 
                element={
                  <RoleProtectedRoute allowedRoles={['administrador']}>
                    <Users />
                  </RoleProtectedRoute>
                } 
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
