import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Form schemas for validation
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone deve ter no máximo 15 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [codeInputs, setCodeInputs] = useState<string[]>(['', '', '', '', '', '']);
  
  // Verificação de autenticação
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  
  // Setup login form with validation
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Setup register form with validation
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Removida a função sendToWebhook, pois o webhook será chamado
  // apenas durante a verificação do token

  // Função para solicitar token de verificação para login
  const requestToken = async (email: string) => {
    try {
      await fetch("https://webhook.dev.solandox.com/webhook/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          action: "login"
        }),
      });
    } catch (error) {
      console.error("Erro ao solicitar token:", error);
    }
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    
    try {
      // Enviar dados para o webhook de login - primeiro envio
      try {
        await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "login_request",
            entityType: "user",
            entityId: data.email,
            data: { 
              email: data.email, 
              password: data.password,
              timestamp: new Date().toISOString() 
            },
          }),
        });
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError);
        throw new Error("Erro ao processar login. Por favor, tente novamente.");
      }
      
      // Solicitar o token para verificação
      await requestToken(data.email);
      
      // Mostrar tela de verificação
      setShowLogin(false);
      setShowVerification(true);
    } catch (error) {
      console.error("Erro ao solicitar código:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar login",
        description: error instanceof Error ? error.message : "Não foi possível processar o login. Tente novamente.",
      });
    }
    
    setLoading(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    
    try {
      // Fazer o cadastro diretamente, sem verificação de token
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Agora você pode fazer login com suas credenciais.",
        });
        // Mostrar a tela de login após o cadastro bem-sucedido
        setShowLogin(true);
      } else {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: result.message || "Não foi possível criar sua conta. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao tentar criar sua conta. Tente novamente.",
      });
    }
    
    setLoading(false);
  };

  const handleVerification = async () => {
    setLoading(true);
    const code = codeInputs.join('');
    
    try {
      // Pegando os dados do formulário de login
      const formData = loginForm.getValues();
      
      // Enviar apenas o token para o webhook para verificação
      // Este é o segundo envio para o webhook no fluxo de login
      try {
        await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verify_token",
            entityType: "user",
            entityId: formData.email,
            data: { 
              email: formData.email, 
              token: code,
              timestamp: new Date().toISOString() 
            },
          }),
        });
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError);
        throw new Error("Erro ao processar a verificação. Por favor, tente novamente.");
      }
      
      // Após enviar ao webhook, chamar o endpoint de login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
          token: code // Enviando o código de verificação
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        login(result.user.username);
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a) de volta!`,
        });
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "Erro na verificação",
          description: result.message || "O código inserido é inválido ou expirou. Tente novamente.",
        });
        // Não voltar para tela de login, permitir nova tentativa
      }
    } catch (error) {
      console.error("Erro na verificação:", error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao verificar o código. Tente novamente.",
      });
    }
    
    setLoading(false);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length <= 1) {
      const newInputs = [...codeInputs];
      newInputs[index] = value;
      setCodeInputs(newInputs);
      
      // Move to next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const resendCode = async () => {
    // Agora apenas para o login
    const formData = loginForm.getValues();
    await requestToken(formData.email);
    toast({
      title: "Código reenviado",
      description: "Um novo código foi enviado para seu email.",
    });
  };

  // Verificação se todos os campos estão preenchidos para habilitar o botão de verificação
  const isCodeComplete = codeInputs.every((input) => input.length === 1);

  // Componentes que representam cada página
  const LoginContainer = () => (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo"></div>
        <div className="auth-brand">SOLANDOX</div>
      </div>
      <h2 className="auth-title">Login</h2>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
        <div className="auth-form-group">
          <input 
            type="email" 
            className="auth-form-control" 
            placeholder="Email" 
            {...loginForm.register("email")}
            required 
          />
          {loginForm.formState.errors.email && (
            <div className="auth-error-message">{loginForm.formState.errors.email.message}</div>
          )}
        </div>
        <div className="auth-form-group">
          <input 
            type="password" 
            className="auth-form-control" 
            placeholder="Senha" 
            {...loginForm.register("password")}
            required 
          />
          {loginForm.formState.errors.password && (
            <div className="auth-error-message">{loginForm.formState.errors.password.message}</div>
          )}
        </div>
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Aguarde..." : "Login"}
        </button>
      </form>
      <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setShowLogin(false); }}>
        Ainda não tem conta? Cadastre-se
      </a>
    </div>
  );

  const RegisterContainer = () => (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo"></div>
        <div className="auth-brand">SOLANDOX</div>
      </div>
      <h2 className="auth-title">Criar Conta</h2>
      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
        <div className="auth-form-group">
          <input 
            type="text" 
            className="auth-form-control" 
            placeholder="Nome Completo" 
            {...registerForm.register("fullName")}
            required 
          />
          {registerForm.formState.errors.fullName && (
            <div className="auth-error-message">{registerForm.formState.errors.fullName.message}</div>
          )}
        </div>
        <div className="auth-form-group">
          <input 
            type="email" 
            className="auth-form-control" 
            placeholder="Email" 
            {...registerForm.register("email")}
            required 
          />
          {registerForm.formState.errors.email && (
            <div className="auth-error-message">{registerForm.formState.errors.email.message}</div>
          )}
        </div>
        <div className="auth-form-group">
          <input 
            type="tel" 
            className="auth-form-control" 
            placeholder="Telefone (com DDD)" 
            {...registerForm.register("phone")}
            required 
          />
          {registerForm.formState.errors.phone && (
            <div className="auth-error-message">{registerForm.formState.errors.phone.message}</div>
          )}
        </div>
        <div className="auth-form-group">
          <input 
            type="password" 
            className="auth-form-control" 
            placeholder="Senha" 
            {...registerForm.register("password")}
            required 
          />
          {registerForm.formState.errors.password && (
            <div className="auth-error-message">{registerForm.formState.errors.password.message}</div>
          )}
        </div>
        <div className="auth-form-group">
          <input 
            type="password" 
            className="auth-form-control" 
            placeholder="Confirmar Senha" 
            {...registerForm.register("confirmPassword")}
            required 
          />
          {registerForm.formState.errors.confirmPassword && (
            <div className="auth-error-message">{registerForm.formState.errors.confirmPassword.message}</div>
          )}
        </div>
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Aguarde..." : "Cadastrar"}
        </button>
      </form>
      <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setShowLogin(true); }}>
        Já tem uma conta? Faça login
      </a>
    </div>
  );

  const VerificationContainer = () => (
    <div className="auth-container">
      <div className="green-line"></div>
      <div className="auth-header">
        <div className="auth-logo"></div>
        <div className="auth-brand">SOLANDOX</div>
      </div>
      <h2 className="auth-title">Verificação de Código</h2>
      <p className="auth-message">
        Enviamos um código de 6 dígitos para seu email. Digite o código abaixo para completar a verificação.
      </p>
      
      <div className="code-inputs">
        {codeInputs.map((value, index) => (
          <input
            key={index}
            id={`code-${index}`}
            type="text"
            className="code-input"
            maxLength={1}
            value={value}
            onChange={(e) => handleCodeInput(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          />
        ))}
      </div>
      
      <button 
        type="button" 
        className="auth-btn" 
        onClick={handleVerification} 
        disabled={!isCodeComplete || loading}
      >
        {loading ? "Verificando..." : "Verificar"}
      </button>
      <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); resendCode(); }}>
        Não recebeu o código? Reenviar
      </a>
    </div>
  );

  return (
    <div className="auth-page">      
      {showVerification ? (
        <VerificationContainer />
      ) : (
        showLogin ? <LoginContainer /> : <RegisterContainer />
      )}
    </div>
  );
}