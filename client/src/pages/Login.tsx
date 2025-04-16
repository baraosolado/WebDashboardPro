import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Form schema for validation
const loginSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  // Setup form with validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Função para enviar dados para o webhook
  const sendToWebhook = async (data: any, action: string) => {
    try {
      await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          entityType: "user",
          entityId: data.username,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  // Form submission handler
  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    
    try {
      // Enviar dados de login para o webhook
      await sendToWebhook(values, "login");
      
      // Verificar credenciais no backend
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Credenciais inválidas");
        }
        
        // Usar a função login do AuthContext
        login(data.user.username);
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao FinTrack.",
        });
        
        // Redirecionar para o dashboard
        navigate("/");
      } catch (error: any) {
        console.error("Erro ao fazer login:", error);
        throw new Error(error.message || "Erro ao fazer login");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="flex flex-col justify-center items-center min-h-screen bg-[#e9e9e9]">
      <div id="login-box" className="bg-white p-8 md:p-12 rounded-lg shadow-lg text-center w-11/12 max-w-md">
        <h1 className="text-3xl font-bold text-[#4CAF50] mb-1">FinTrack</h1>
        <p className="text-[#607D8B] mb-8">Controle suas finanças com facilidade</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="font-bold text-[#607D8B]">Usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Seu nome de usuário" 
                      className="w-full p-3 border rounded-md text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="font-bold text-[#607D8B]">Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Sua senha" 
                      className="w-full p-3 border rounded-md text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full p-3 text-base mt-6 bg-[#4CAF50] hover:bg-[#388E3C]"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-[#607D8B] text-sm">
          <p>Não tem uma conta? <a href="/signup" className="text-[#2196F3]">Criar conta</a></p>
        </div>
      </div>
    </div>
  );
}