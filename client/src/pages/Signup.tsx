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
const signupSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  // Setup form with validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
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
  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    
    try {
      // Enviar dados para o backend
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Erro ao criar conta");
        }
        
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Faça login para continuar.",
          variant: "default",
        });
        
        // Redirecionar para a página de login
        navigate("/login");
      } catch (error: any) {
        console.error("Erro ao fazer cadastro:", error);
        throw new Error(error.message || "Erro ao fazer cadastro");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer cadastro",
        description: error.message || "Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup-page" className="flex flex-col justify-center items-center min-h-screen bg-[#e9e9e9]">
      <div id="signup-box" className="bg-white p-8 md:p-12 rounded-lg shadow-lg text-center w-11/12 max-w-md">
        <h1 className="text-3xl font-bold text-[#4CAF50] mb-1">FinTrack</h1>
        <p className="text-[#607D8B] mb-8">Crie sua conta para começar</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="font-bold text-[#607D8B]">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Seu endereço de email" 
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
              name="username"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="font-bold text-[#607D8B]">Nome de usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Escolha um nome de usuário" 
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
                      placeholder="Crie uma senha" 
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="text-left">
                  <FormLabel className="font-bold text-[#607D8B]">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirme sua senha" 
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
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-[#607D8B] text-sm">
          <p>Já tem uma conta? <a href="/login" className="text-[#2196F3]">Fazer login</a></p>
        </div>
      </div>
    </div>
  );
}