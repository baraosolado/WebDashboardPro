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
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const verificationSchema = z.object({
  code: z.string().length(6, "O código deve ter 6 dígitos"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type VerificationFormValues = z.infer<typeof verificationSchema>;

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
    <div className="container">
      <div className="header">
        <div className="logo"></div>
        <div className="brand">SOLANDOX</div>
      </div>
      <h2>Login</h2>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
        <div className="form-group">
          <input 
            type="email" 
            className="form-control" 
            placeholder="Email" 
            {...loginForm.register("email")}
            required 
          />
          {loginForm.formState.errors.email && (
            <div className="error-message">{loginForm.formState.errors.email.message}</div>
          )}
        </div>
        <div className="form-group">
          <input 
            type="password" 
            className="form-control" 
            placeholder="Senha" 
            {...loginForm.register("password")}
            required 
          />
          {loginForm.formState.errors.password && (
            <div className="error-message">{loginForm.formState.errors.password.message}</div>
          )}
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Aguarde..." : "Login"}
        </button>
      </form>
      <a href="#" className="link" onClick={(e) => { e.preventDefault(); setShowLogin(false); }}>
        Ainda não tem conta? Cadastre-se
      </a>
    </div>
  );

  const RegisterContainer = () => (
    <div className="container">
      <div className="header">
        <div className="logo"></div>
        <div className="brand">SOLANDOX</div>
      </div>
      <h2>Criar Conta</h2>
      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
        <div className="form-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nome Completo" 
            {...registerForm.register("fullName")}
            required 
          />
          {registerForm.formState.errors.fullName && (
            <div className="error-message">{registerForm.formState.errors.fullName.message}</div>
          )}
        </div>
        <div className="form-group">
          <input 
            type="email" 
            className="form-control" 
            placeholder="Email" 
            {...registerForm.register("email")}
            required 
          />
          {registerForm.formState.errors.email && (
            <div className="error-message">{registerForm.formState.errors.email.message}</div>
          )}
        </div>
        <div className="form-group">
          <input 
            type="password" 
            className="form-control" 
            placeholder="Senha" 
            {...registerForm.register("password")}
            required 
          />
          {registerForm.formState.errors.password && (
            <div className="error-message">{registerForm.formState.errors.password.message}</div>
          )}
        </div>
        <div className="form-group">
          <input 
            type="password" 
            className="form-control" 
            placeholder="Confirmar Senha" 
            {...registerForm.register("confirmPassword")}
            required 
          />
          {registerForm.formState.errors.confirmPassword && (
            <div className="error-message">{registerForm.formState.errors.confirmPassword.message}</div>
          )}
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Aguarde..." : "Cadastrar"}
        </button>
      </form>
      <a href="#" className="link" onClick={(e) => { e.preventDefault(); setShowLogin(true); }}>
        Já tem uma conta? Faça login
      </a>
    </div>
  );

  const VerificationContainer = () => (
    <div className="container">
      <div className="green-line"></div>
      <div className="header">
        <div className="logo"></div>
        <div className="brand">SOLANDOX</div>
      </div>
      <h2>Verificação de Código</h2>
      <p className="message">
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
        className="btn" 
        onClick={handleVerification} 
        disabled={!isCodeComplete || loading}
      >
        {loading ? "Verificando..." : "Verificar"}
      </button>
      <a href="#" className="link" onClick={(e) => { e.preventDefault(); resendCode(); }}>
        Não recebeu o código? Reenviar
      </a>
    </div>
  );

  return (
    <div className="auth-page">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #006450, #009570);
          overflow: hidden;
          position: relative;
        }
        
        .auth-page::before,
        .auth-page::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          animation: moveLines 30s linear infinite;
        }
        
        .auth-page::after {
          transform: rotate(45deg);
          background-size: 70px 70px;
        }
        
        @keyframes moveLines {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 50px 50px;
          }
        }
        
        .container {
          position: relative;
          z-index: 1;
          width: 380px;
          padding: 30px;
          border-radius: 15px;
          background: rgba(30, 30, 30, 0.6);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          max-width: 90%;
        }
        
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .logo {
          width: 40px;
          height: 40px;
          background-color: #00c78e;
          border-radius: 8px;
          margin-right: 15px;
        }
        
        .brand {
          color: #00c78e;
          font-size: 24px;
          font-weight: bold;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 25px;
          font-weight: 500;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-control {
          width: 100%;
          padding: 12px 15px;
          border-radius: 8px;
          border: none;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 16px;
          outline: none;
          transition: all 0.3s;
        }
        
        .form-control:focus {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .form-control::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background-color: #00c78e;
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn:hover {
          background-color: #00b280;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .btn:disabled {
          background-color: #3a3a3a;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .link {
          display: block;
          text-align: center;
          margin-top: 20px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
        }
        
        .link:hover {
          color: #00c78e;
        }
        
        .code-inputs {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .code-input {
          width: 40px;
          height: 50px;
          font-size: 24px;
          text-align: center;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .message {
          text-align: center;
          margin-bottom: 15px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .green-line {
          height: 5px;
          background-color: #00c78e;
          width: 100%;
          border-radius: 3px 3px 0 0;
          margin-bottom: 25px;
        }
        
        .error-message {
          color: #ff5252;
          font-size: 13px;
          margin-top: 5px;
        }
      `}</style>
      
      {showVerification ? (
        <VerificationContainer />
      ) : (
        showLogin ? <LoginContainer /> : <RegisterContainer />
      )}
    </div>
  );
}