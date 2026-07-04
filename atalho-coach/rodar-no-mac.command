#!/bin/bash
# Atalho Coach — lançador para Mac. Dois cliques e pronto:
# instala as dependências, liga o servidor de assinatura (shortcuts sign)
# e abre o app no navegador. Deixe a janela do Terminal aberta enquanto usa.
set -e
cd "$(dirname "$0")"

echo "════════════════════════════════════════════"
echo "  🚀 Atalho Coach — iniciando no seu Mac"
echo "════════════════════════════════════════════"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ O Node.js não está instalado."
  echo "   Vou abrir nodejs.org — instale a versão LTS e dê dois cliques neste arquivo de novo."
  open "https://nodejs.org"
  exit 1
fi

if ! command -v shortcuts >/dev/null 2>&1; then
  echo "⚠️  O comando 'shortcuts' não existe neste Mac (precisa de macOS 12+)."
  echo "   O app vai funcionar, mas os atalhos sairão SEM assinatura."
fi

if [ ! -d node_modules ]; then
  echo "📦 Instalando dependências (só na primeira vez, ~1 minuto)…"
  npm install --no-audit --no-fund
fi

if [ ! -f .env.local ]; then
  TOKEN=$(openssl rand -hex 16)
  {
    echo "SIGNER_URL=http://localhost:8787"
    echo "SIGNER_TOKEN=$TOKEN"
    echo "# Para ligar o construtor com IA, remova o # da linha abaixo e cole sua chave da Anthropic:"
    echo "# ANTHROPIC_API_KEY=sk-ant-..."
  } > .env.local
  echo "🔑 Configuração criada (.env.local)."
fi

SIGNER_TOKEN=$(grep '^SIGNER_TOKEN=' .env.local | cut -d= -f2-)

echo "🖊️  Ligando o servidor de assinatura (comando oficial 'shortcuts sign')…"
SIGNER_TOKEN="$SIGNER_TOKEN" node signer/server.mjs &
SIGNER_PID=$!
trap 'kill $SIGNER_PID 2>/dev/null' EXIT

echo "🌐 Abrindo o app em http://localhost:3000 — deixe esta janela aberta."
echo "   (Para encerrar: feche esta janela ou aperte Ctrl+C.)"
( sleep 7 && open "http://localhost:3000" ) &
npm run dev
