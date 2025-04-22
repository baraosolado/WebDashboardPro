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
          entityId: data.email || data.username,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para webhook:", error);
    }
  };

  // Função para solicitar token de verificação
  const requestToken = async (email: string, userName: string = "") => {
    try {
      await fetch("https://webhook.dev.solandox.com/webhook/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          userName
        }),
      });
    } catch (error) {
      console.error("Erro ao solicitar token:", error);
    }
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    
    try {
      // Enviar dados para o webhook de login
      await sendToWebhook({...data, action: 'login'}, "login");
      await requestToken(data.email);
      
      // Mostrar tela de verificação
      setShowLogin(false);
      setShowVerification(true);
      
      // Continue o fluxo normal de login após a verificação (implementado em handleVerification)
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
      });
    }
    
    setLoading(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    
    try {
      // Enviar dados para o webhook de cadastro
      await sendToWebhook({...data, action: 'cadastro'}, "signup");
      await requestToken(data.email, data.fullName);
      
      // Mostrar tela de verificação
      setShowLogin(false);
      setShowVerification(true);
      
      // Continue o fluxo normal de cadastro após a verificação (implementado em handleVerification)
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
      // Simulação de verificação bem-sucedida
      // Na implementação real, você enviaria o código para a API
      
      // Atualizar estado de autenticação e redirecionar
      const formData = showLogin ? loginForm.getValues() : registerForm.getValues();
      const username = (formData as RegisterFormValues).fullName || formData.email;
      
      // Se estiver no fluxo de login
      if (showLogin) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.email,
            password: formData.password,
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
            title: "Erro no login",
            description: result.message || "Credenciais inválidas. Tente novamente.",
          });
          setShowVerification(false);
          setShowLogin(true);
        }
      } 
      // Se estiver no fluxo de cadastro
      else {
        const registerData = registerForm.getValues();
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: registerData.fullName,
            email: registerData.email,
            phone: registerData.phone,
            password: registerData.password,
          }),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          login(result.user.username);
          toast({
            title: "Conta criada com sucesso!",
            description: "Bem-vindo(a) ao SolandoX!",
          });
          navigate("/");
        } else {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: result.message || "Não foi possível criar sua conta. Tente novamente.",
          });
          setShowVerification(false);
          setShowLogin(false);
        }
      }
    } catch (error) {
      console.error("Erro na verificação:", error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o código. Tente novamente.",
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
    const formData = showLogin ? loginForm.getValues() : registerForm.getValues();
    await requestToken(formData.email, (formData as RegisterFormValues).fullName || '');
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