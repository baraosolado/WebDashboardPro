/**
 * Mock do webhook para testes sem dependência do n8n
 * 
 * Este módulo simula as respostas do n8n para permitir testar a integração
 * sem precisar de um serviço n8n rodando
 */
import { Request, Response } from 'express';
import crypto from 'crypto';

// Função para gerar token aleatório de 6 dígitos
const generateToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Armazenamento em memória para tokens gerados
const tokenStore: Record<string, {
  token: string;
  email: string;
  created: Date;
  expires: Date;
  used: boolean;
}> = {};

// Armazenamento em memória para usuários mockados
const userStore: Record<string, {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
}> = {
  'admin@solandox.com': {
    id: crypto.randomUUID(),
    username: 'admin',
    email: 'admin@solandox.com',
    password: 'hashedpassword.salt',
    created_at: new Date().toISOString()
  }
};

/**
 * Handler principal do mock do webhook
 */
export const webhookMockHandler = (req: Request, res: Response) => {
  const { action, entityType, data } = req.body;
  
  console.log('[MOCK WEBHOOK] Recebida requisição:', { action, entityType, data });
  
  switch (action) {
    case 'login_request':
      return handleLoginRequest(data, res);
    case 'verify_token':
      return handleVerifyToken(data, res);
    case 'signup':
      return handleSignup(data, res);
    case 'transaction_create':
    case 'category_create':
    case 'budget_create':
    case 'goal_create':
      return handleEntityCreate(action, data, res);
    default:
      return res.status(400).json({
        success: false,
        message: 'Ação desconhecida ou não suportada'
      });
  }
};

/**
 * Handler para requisição de login - gera token
 */
function handleLoginRequest(data: any, res: Response) {
  const { email } = data;
  
  // Verificar se o usuário existe
  if (!userStore[email]) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  // Gerar token
  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);
  
  // Armazenar token
  tokenStore[email] = {
    token,
    email,
    created: now,
    expires,
    used: false
  };
  
  console.log('[MOCK WEBHOOK] Token gerado:', { email, token });
  
  // Retornar sucesso
  return res.json({
    success: true,
    message: 'Código de verificação enviado com sucesso',
    requiresToken: true
  });
}

/**
 * Handler para verificação de token
 */
function handleVerifyToken(data: any, res: Response) {
  const { email, token } = data;
  
  console.log('[MOCK WEBHOOK] Verificando token:', { email, token, tokenStore });
  
  // Verificar se existe token para este email
  if (!tokenStore[email]) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
  
  const storedToken = tokenStore[email];
  
  // Verificar token
  if (storedToken.token !== token) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
  
  // Verificar expiração
  if (storedToken.expires < new Date() || storedToken.used) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
  
  // Marcar token como usado
  storedToken.used = true;
  
  // Retornar dados do usuário
  return res.json({
    success: true,
    message: 'Token verificado com sucesso',
    user: {
      id: userStore[email].id,
      username: userStore[email].username,
      email: userStore[email].email
    }
  });
}

/**
 * Handler para cadastro de usuário
 */
function handleSignup(data: any, res: Response) {
  const { email, username, password, phone } = data;
  
  // Verificar se o usuário já existe
  if (userStore[email]) {
    return res.status(400).json({
      success: false,
      message: 'Usuário ou email já cadastrado'
    });
  }
  
  // Criar novo usuário
  const userId = crypto.randomUUID();
  userStore[email] = {
    id: userId,
    username,
    email,
    password: `${password}.salt`,
    created_at: new Date().toISOString()
  };
  
  console.log('[MOCK WEBHOOK] Usuário criado:', { email, username, userId });
  
  // Retornar sucesso
  return res.status(201).json({
    success: true,
    message: 'Cadastro realizado com sucesso',
    user: {
      id: userId,
      username,
      email
    }
  });
}

/**
 * Handler genérico para criação de entidades (transações, categorias, etc.)
 */
function handleEntityCreate(action: string, data: any, res: Response) {
  const entityType = action.split('_')[0];
  
  // Simular ID da entidade criada
  const entityId = Math.floor(Math.random() * 1000);
  
  console.log(`[MOCK WEBHOOK] ${entityType} criado:`, { entityId, data });
  
  // Resposta genérica de sucesso
  return res.status(201).json({
    success: true,
    message: `${entityType} criado com sucesso`,
    [entityType]: {
      id: entityId,
      ...data
    }
  });
}