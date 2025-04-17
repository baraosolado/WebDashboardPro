# FinTrack - Sistema de Gestão Financeira

FinTrack é um aplicativo de gestão financeira para salões de beleza e outros negócios que permite o controle de transações, orçamentos, categorias e relatórios financeiros.

## Funcionalidades

- Controle de transações (receitas e despesas)
- Gestão de categorias financeiras
- Orçamentos personalizados
- Dashboard com resumo financeiro
- Interface adaptada para o formato brasileiro (R$, datas no formato dd/mm/yyyy)
- Integração com Supabase para armazenamento persistente

## Tecnologias utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **Backend**: Node.js, Express
- **Banco de dados**: PostgreSQL via Supabase
- **Implantação**: Docker, EasyPanel

## Requisitos

- Node.js 18 ou superior
- Conta no Supabase para persistência dos dados
- Docker e Docker Compose (para implantação em produção)

## Passos para Implantação

### 1. Preparar Variáveis de Ambiente

Crie um arquivo `.env` baseado no modelo `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` para configurar:
- Credenciais do PostgreSQL
- Chave secreta para sessões

### 2. Método de Implantação no EasyPanel

#### Opção 1: Usando o Dockerfile (Recomendado)

1. No painel do EasyPanel, crie um novo projeto.
2. Selecione "Custom" como tipo de projeto.
3. Forneça o URL do repositório Git do FinTrack.
4. Configure as variáveis de ambiente do arquivo `.env`.
5. O EasyPanel usará automaticamente o Dockerfile na raiz do projeto.

#### Opção 2: Usando o Docker Compose

1. No seu servidor que executa o EasyPanel, clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd fintrack
   ```

2. Crie o arquivo `.env` a partir do modelo.

3. Execute o docker-compose:
   ```bash
   docker-compose up -d
   ```

4. Adicione como projeto no EasyPanel usando a opção "Custom".

### 3. Configuração de Proxy Reverso

No EasyPanel, configure o proxy reverso para direcionar o tráfego para a porta 5000 do contêiner.

### 4. Inicialização do Banco de Dados

Na primeira execução, o esquema do banco de dados será automaticamente criado. Se preferir, você pode executar manualmente:

```bash
docker-compose exec app npm run db:push
```

## Desenvolvimento com GitHub

### Configuração inicial

1. Clone o repositório do GitHub:
   ```bash
   git clone https://github.com/seu-usuario/fintrack.git
   cd fintrack
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais do Supabase
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Fluxo de trabalho com Git

1. Crie uma nova branch para sua feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. Faça suas alterações e commit:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   ```

3. Envie para o GitHub:
   ```bash
   git push origin feature/nome-da-feature
   ```

4. Crie um Pull Request no GitHub para mesclar suas alterações.

## Manutenção

### Atualizações

Para atualizar a aplicação:

1. Pull do repositório mais recente
   ```bash
   git pull origin main
   ```

2. Se estiver usando Docker, reconstrua a imagem:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Backup do Banco de Dados

Para fazer backup do PostgreSQL:

```bash
docker-compose exec postgres pg_dump -U fintrack fintrack_db > backup.sql
```

## Configuração do Supabase

Este projeto utiliza o Supabase como banco de dados e serviço de backend. Siga as instruções abaixo para configurar o projeto com Supabase:

1. Crie uma conta gratuita em [Supabase](https://supabase.io)
2. Crie um novo projeto
3. Vá para Settings > Database e obtenha a URL e a chave anon/public
4. Preencha o arquivo `.env` com essas credenciais:

```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
```

### Estrutura do Banco de Dados

O projeto requer as seguintes tabelas no Supabase:

1. **users** - Usuários do sistema
   - id (int, PK, auto-incremento)
   - username (texto, único)
   - password (texto, encriptado)
   - email (texto, opcional)
   - created_at (timestamp com fuso horário, padrão now())

2. **categories** - Categorias de transações
   - id (int, PK, auto-incremento)
   - name (texto)
   - type (enum: 'income' | 'expense')
   - color (texto)
   - user_id (int, FK para users.id, opcional)
   - created_at (timestamp com fuso horário, padrão now())

3. **transactions** - Transações financeiras
   - id (int, PK, auto-incremento)
   - description (texto)
   - amount (decimal)
   - date (data)
   - type (enum: 'income' | 'expense')
   - category_id (int, FK para categories.id, opcional)
   - user_id (int, FK para users.id, opcional)
   - created_at (timestamp com fuso horário, padrão now())
   - is_deleted (boolean, padrão false)

4. **budgets** - Orçamentos
   - id (int, PK, auto-incremento)
   - category_id (int, FK para categories.id, opcional)
   - amount (decimal)
   - period (texto: 'mensal', 'semanal', etc.)
   - user_id (int, FK para users.id, opcional)
   - created_at (timestamp com fuso horário, padrão now())
   - is_deleted (boolean, padrão false)

## Solução de Problemas

- **Erro de Conexão com o Banco**: Verifique as variáveis de ambiente e se o Supabase está acessível.
- **Erro 500**: Verifique os logs do contêiner com `docker-compose logs app`.
- **Transações ou Orçamentos Não Aparecem**: Verifique se os filtros de exclusão lógica (is_deleted = false) estão aplicados corretamente.
- **Problemas de Permissão**: Certifique-se que os volumes Docker têm as permissões corretas.
- **Categoria Não Encontrada**: Se aparecer "Sem categoria", verifique se o category_id está corretamente vinculado.

## Suporte

Para suporte adicional, entre em contato conosco ou abra uma issue no GitHub.