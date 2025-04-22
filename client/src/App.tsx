import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/auth-page";
import NotFoundPage from "@/pages/NotFoundPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Componente de rota protegida que verifica autenticação
function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/auth" />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/" component={(props: any) => <PrivateRoute component={Dashboard} {...props} />} />
      <Route path="/dashboard" component={(props: any) => <PrivateRoute component={Dashboard} {...props} />} />
      <Route path="/transactions" component={(props: any) => <PrivateRoute component={Transactions} {...props} />} />
      <Route path="/budgets" component={(props: any) => <PrivateRoute component={Budgets} {...props} />} />
      <Route path="/reports" component={(props: any) => <PrivateRoute component={Reports} {...props} />} />
      <Route path="/goals" component={(props: any) => <PrivateRoute component={Goals} {...props} />} />
      <Route path="/settings" component={(props: any) => <PrivateRoute component={Settings} {...props} />} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`bg-[#f5f5f5] min-h-screen font-['Segoe_UI',sans-serif] flex flex-col ${isAuthenticated ? 'logged-in' : ''}`}>
      {isAuthenticated && <Header />}
      <div className="flex-grow">
        <Router />
      </div>
      {isAuthenticated && <Footer />}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
