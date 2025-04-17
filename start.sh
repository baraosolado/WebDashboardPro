#!/bin/bash
set -e

# Verificar variáveis de ambiente do Supabase
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "AVISO: Variáveis de ambiente do Supabase não estão configuradas"
  echo "Por favor, defina SUPABASE_URL e SUPABASE_KEY"
  echo "A aplicação poderá não funcionar corretamente sem essas variáveis"
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "AVISO: SESSION_SECRET não definido, gerando um valor aleatório"
  export SESSION_SECRET=$(openssl rand -hex 32)
fi

# Iniciar o servidor
echo "Iniciando FinTrack..."
exec node server/index.js