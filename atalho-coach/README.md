# Atalho Coach

**Seu consultor proativo de automação para iPhone e Mac.** Web app que entrevista o
usuário num micro-quiz (a Apple não permite escanear apps instalados no iOS — perguntar
é o único caminho), propõe atalhos criativos sob medida a partir de um catálogo vivo de
receitas, e também **constrói atalhos sob demanda com IA**: gera, valida passo a passo
("Craig Loop") e entrega o arquivo `.shortcut` pronto para o app Atalhos.

Multi-idiomas (pt-BR, en, es) — os atalhos gerados saem no idioma do usuário; o arquivo
`.shortcut` guarda ações por identificador, então funciona em aparelhos de qualquer idioma.

## Arquitetura

```
app/                      Next.js (App Router)
  onboarding/             micro-quiz (perfil fica no localStorage — zero dados no servidor)
  propostas/              motor de recomendação × catálogo de receitas
  construtor/             pedido em linguagem natural → IA → atalho validado
  api/generate            Claude (claude-opus-4-8) com structured outputs → IR → Craig Loop
  api/recipe              receitas curadas → IR → plist
lib/shortcuts/
  types.ts                IR plano (if/endif, repeat/endrepeat, menu/case — espelha WFControlFlowMode)
  catalog.ts              catálogo VERIFICADO de ações (exports reais + compilador Cherri)
  genSchema.ts            schema Zod da saída do modelo + conversão para IR
  plist.ts                serializador IR → plist XML (UUIDs, GroupingIdentifiers,
                          attachments UTF-16 com U+FFFC, WFQuantityFieldValue…)
  validator.ts            Craig Loop: wiring de refs/vars, balanceamento de blocos,
                          enums, params obrigatórios, armadilhas (× vs *, RepeatItem…)
lib/proposals/            receitas multi-idioma + motor de pontuação por perfil
signer/                   micro-serviço para um Mac assinar via `shortcuts sign`
```

### Por que um IR e não XML direto?

Desde o iOS 15 o app Atalhos só importa arquivos **assinados**, e o formato plist tem
armadilhas silenciosas (offsets UTF-16 de attachments, wrapper especial do conditional,
`×`/`÷` Unicode no Calculate…). O modelo gera uma representação intermediária simples e
validável; o serializador determinístico cuida das partes que quebram. Cada erro do
validador volta ao modelo com índice e correção sugerida — o mesmo desenho do
[Shortcuts Playground](https://github.com/viticci/shortcuts-playground-plugin) (MIT),
que serviu de referência para as regras de validação.

## Rodando

```sh
npm install
cp .env.example .env   # preencha ANTHROPIC_API_KEY para o construtor com IA
npm run dev
```

Sem `ANTHROPIC_API_KEY`, o quiz e as propostas curadas funcionam normalmente — só o
construtor com IA fica indisponível.

### Entrega assinada (instalar em 1 toque)

A assinatura oficial só existe no macOS (`shortcuts sign`). Rode `signer/server.mjs` num
Mac (local ou de nuvem — EC2 Mac/MacStadium) e configure `SIGNER_URL`/`SIGNER_TOKEN`.
Sem signer, o app entrega o plist não assinado com instruções de importação manual
(via Mac: `shortcuts sign --mode anyone --input Atalho.shortcut --output Atalho.shortcut`).

## Testes

```sh
npm test        # serializador, validador, motor e TODAS as receitas × 3 idiomas
npm run typecheck
```

## Custo/modelo

`ANTHROPIC_MODEL` controla o modelo do construtor (padrão `claude-opus-4-8`). Para
escalar de graça, `claude-haiku-4-5` gera atalhos simples por uma fração do custo — o
Craig Loop segura a qualidade.

## Limitações conhecidas

- Ações fora do catálogo verificado não são geradas; integrações com apps de terceiros
  usam esquemas de URL (whatsapp://, spotify:, comgooglemaps://…), que são estáveis.
- Ações de HealthKit, HomeKit e pickers opacos (playlists, contatos) ficam de fora da v1.
- Automações por gatilho (hora/local) não podem ser distribuídas em arquivo — o usuário
  cria o gatilho no app Atalhos apontando para o atalho instalado.

*Atalho Coach não é afiliado à Apple. "Atalhos"/"Shortcuts" é marca da Apple Inc.*
