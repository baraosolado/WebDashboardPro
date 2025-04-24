# Documentação do SolandoX

Bem-vindo à documentação completa do SolandoX, um sistema de gestão financeira pessoal com interface intuitiva e funcionalidades avançadas.

## 📚 Índice de Documentação

### Autenticação e Segurança

- [**Autenticação em Duas Etapas**](autenticacao-duas-etapas.md) - Implementação do fluxo de autenticação em duas etapas
- [**Integração com Supabase para Autenticação**](autenticacao-supabase.md) - Detalhes da integração com Supabase para autenticação real
- [**Fluxo n8n para Autenticação**](n8n_workflow_autenticacao.md) - Configuração do fluxo n8n para processar a autenticação

### Cadastro e Usuários

- [**Fluxo de Cadastro de Usuários**](n8n_workflow_users.md) - Processo de cadastro de usuários via n8n

### Configuração e Integração

- [**Configuração do Supabase**](configuracao-supabase.md) - Guia para configurar o Supabase para o projeto
- [**Integração Backend**](integracao-backend.md) - Detalhes da integração do backend com Supabase e n8n
- [**Documentação n8n com Supabase**](n8n-supabase-documentacao.md) - Guia de integração e uso do n8n com Supabase

## 🔑 Características Principais do Sistema

1. **Autenticação Segura em Duas Etapas**
   - Verificação de usuários no Supabase
   - Validação de token via email
   - Proteção contra acessos não autorizados

2. **Integração Avançada**
   - Supabase para armazenamento de dados persistente
   - n8n para automação de fluxos de trabalho
   - Webhooks para comunicação entre componentes

3. **Interface Intuitiva**
   - Dashboard responsivo
   - Visualização simplificada de dados financeiros
   - Navegação intuitiva entre funcionalidades

4. **Arquitetura SaaS**
   - Multitenancy com isolamento de dados por usuário
   - Escalabilidade horizontal
   - Manutenção simplificada

## 🖥️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Automação**: n8n
- **Autenticação**: Sistema personalizado em duas etapas
- **Containerização**: Docker

## 🚀 Implantação

O sistema é implantado utilizando Docker com configuração via variáveis de ambiente:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-de-api-supabase
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
SESSION_SECRET=chave-secreta-para-sessoes
```

## 👥 Contribuição

Para contribuir com o projeto, siga as orientações no guia de contribuição e mantenha-se alinhado com os padrões de código estabelecidos.

---

© 2025 SolandoX. Todos os direitos reservados.