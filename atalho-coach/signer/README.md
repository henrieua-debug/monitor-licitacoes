# Servidor de assinatura

Desde o iOS 15 / macOS 12, o app Atalhos **só importa arquivos `.shortcut` assinados**
pela infraestrutura da Apple. A única forma oficial de assinar é o CLI `shortcuts sign`,
que existe apenas no macOS. Este diretório contém um micro-serviço que roda num Mac e
expõe a assinatura via HTTP para o app web.

> Sem este serviço o app continua funcionando: ele entrega o plist não assinado com
> instruções de importação manual. Com ele, a entrega vira "instalar em 1 toque".

## Requisitos

- macOS 12+ **logado numa Conta Apple** (a assinatura usa a identidade do Apple ID).
  - Aviso: a assinatura local esteve quebrada do macOS 14.4 até o macOS 26 Tahoe
    (erro "Failed to sign Shortcut"). Se o seu Mac estiver nessa faixa, use um Mac
    mais novo/antigo ou um Mac de nuvem (AWS EC2 Mac, MacStadium — o EULA da Apple
    permite, desde que rode em hardware Apple).
- Node.js 18+.

## Rodando

```sh
SIGNER_TOKEN=um-segredo-forte node server.mjs
# opcional: PORT=8787
```

Exponha para a internet (Cloudflare Tunnel, Tailscale Funnel, ngrok…) e configure no
app web:

```
SIGNER_URL=https://seu-tunel.example.com
SIGNER_TOKEN=um-segredo-forte
```

## API

`POST /sign` — corpo: bytes do plist não assinado. Header `Authorization: Bearer <token>`.
Resposta: bytes do `.shortcut` assinado (modo `anyone`).

`GET /health` — checagem simples.

## Teste rápido

```sh
curl -s -X POST -H "Authorization: Bearer $SIGNER_TOKEN" \
  --data-binary @exemplo.shortcut http://localhost:8787/sign -o assinado.shortcut
```
