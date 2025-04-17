FROM node:20-slim AS base

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências para o PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql-client \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de configuração de pacotes
COPY package.json package-lock.json ./

# Imagem de build
FROM base AS builder
WORKDIR /app

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Construir o projeto
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Copiar dependências da imagem de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar arquivos de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/dist ./client/dist

# Criar script para inicialização
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
# Verificar se temos as variáveis do Supabase\n\
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then\n\
  echo "AVISO: Variáveis SUPABASE_URL ou SUPABASE_KEY não estão definidas."\n\
  echo "O aplicativo pode não funcionar corretamente sem essas variáveis."\n\
fi\n\
\n\
# Iniciar o servidor\n\
exec node server/index.js\n\
' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Criar script de compilação para EasyPanel (se não existir o build do cliente)
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
# Instalar dependências de desenvolvimento se dist não existir\n\
if [ ! -d "./client/dist" ]; then\n\
  npm install\n\
  npm run build\n\
fi\n\
\n\
# Iniciar o servidor\n\
exec /app/docker-entrypoint.sh\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expor porta do servidor
EXPOSE 5000

# Definir comando de inicialização
CMD ["/app/start.sh"]