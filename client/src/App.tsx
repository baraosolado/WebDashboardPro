import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFoundPage from "@/pages/NotFoundPage";
import Header from "@/components/Header";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Componente de rota protegida que verifica autenticação
function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/login" />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/" component={(props: any) => <PrivateRoute component={Dashboard} {...props} />} />
      <Route path="/dashboard" component={(props: any) => <PrivateRoute component={Dashboard} {...props} />} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`bg-[#f5f5f5] min-h-screen font-['Segoe_UI',sans-serif] ${isAuthenticated ? 'logged-in' : ''}`}>
      {isAuthenticated && <Header />}
      <Router />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
