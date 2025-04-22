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
# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci
# Copiar código fonte
COPY . .
# Certificar-se de que as dependências do cliente sejam instaladas
RUN cd client && npm ci
# Construir o projeto (servidor e cliente)
RUN npm run build
# Certificar-se de que o build do cliente seja executado explicitamente
RUN cd client && npm run build

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
# Garantir que o diretório client/dist seja copiado corretamente
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

# Expor porta do servidor
EXPOSE 5000
# Definir comando de inicialização
CMD ["/app/docker-entrypoint.sh"]
