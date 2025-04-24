/**
 * Proxy para o webhook do n8n
 * 
 * Este componente permite que a aplicação proxeie solicitações para o n8n
 * quando o n8n não estiver diretamente acessível pela URL webhook.dev.solandox.com
 */

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

// Criar router para o proxy
const proxyRouter = express.Router();

// Configuração do middleware para analisar JSON
proxyRouter.use(bodyParser.json());

// URL do webhook n8n real (deve ser configurada na variável de ambiente)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/fintrack';

// Rota para o webhook
proxyRouter.post('/webhook/fintrack', async (req, res) => {
  try {
    console.log('Recebida solicitação para o webhook do n8n:', {
      path: req.path,
      method: req.method,
      body: req.body
    });

    // Encaminhar solicitação para o n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    // Obter resposta como JSON (se possível)
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Encaminhar status e resposta de volta para o cliente
    res.status(response.status);
    
    // Definir cabeçalhos da resposta
    const headers = response.headers.raw();
    Object.keys(headers).forEach(key => {
      // Não copiar cabeçalhos problemáticos como 'content-length' que podem causar problemas
      if (!['content-length', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        res.setHeader(key, headers[key]);
      }
    });
    
    // Enviar resposta
    if (typeof responseData === 'object') {
      res.json(responseData);
    } else {
      res.send(responseData);
    }

    console.log('Resposta do webhook encaminhada com sucesso:', {
      status: response.status,
      contentType
    });
  } catch (error) {
    console.error('Erro ao encaminhar solicitação para o webhook do n8n:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação do webhook',
      error: error.message
    });
  }
});

// Exportar o router do proxy
module.exports = proxyRouter;