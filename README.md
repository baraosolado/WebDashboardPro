# FinTrack - Implantação no EasyPanel

Este documento fornece instruções para implantar o FinTrack em um ambiente EasyPanel.

## Requisitos

- EasyPanel instalado em seu servidor
- Docker e Docker Compose
- Acesso a uma instância PostgreSQL (ou use o contêiner incluído no docker-compose)

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

## Manutenção

### Atualizações

Para atualizar a aplicação:

1. Pull do repositório mais recente
2. Reconstrua a imagem Docker:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Backup do Banco de Dados

Para fazer backup do PostgreSQL:

```bash
docker-compose exec postgres pg_dump -U fintrack fintrack_db > backup.sql
```

## Solução de Problemas

- **Erro de Conexão com o Banco**: Verifique as variáveis de ambiente e se o PostgreSQL está acessível.
- **Erro 500**: Verifique os logs do contêiner com `docker-compose logs app`.
- **Problemas de Permissão**: Certifique-se que os volumes Docker têm as permissões corretas.

## Suporte

Para suporte adicional, entre em contato conosco em [seu-email@exemplo.com].