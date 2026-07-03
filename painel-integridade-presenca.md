# Painel de Integridade de Presença — Guia para o Líder de TI

> **O que é isto:** um pacote pronto para construir um agente que cruza, de forma
> **agregada e transparente**, os relatórios oficiais de atividade do Microsoft
> Teams contra sinais de trabalho real, sinalizando apenas **exceções** para
> revisão humana. Não é vigilância de tela, não captura conteúdo, não instala
> nada no computador do colaborador. Usa somente os relatórios administrativos
> que a Microsoft já disponibiliza.
>
> **Objetivo real:** detectar padrões de "presença sempre verde" que não batem
> com produção — o sintoma clássico de *mouse jigglers* e scripts de status —
> sem transformar a operação em monitoramento invasivo.

---

## 1. Por que "presença verde" não prova nada

O status verde do Teams é um sinal fraco: ele reflete atividade recente de
teclado/mouse **ou** app em foco, não trabalho. Ferramentas de fraude (jigglers
físicos USB, AutoHotkey, apps tipo Caffeine/PowerToys Awake, VM secundária)
seguram o verde sem ninguém na frente.

A defesa correta **não é caçar o jiggler máquina por máquina** — é comparar, no
agregado, **presença declarada × produção real**. Se o status diz "online 8h/dia"
mas mensagens, reuniões, chamadas e entregáveis não existem, o padrão aparece
sozinho. Isso mata o incentivo à fraude e não exige espionar tela.

---

## 2. O que a TI precisa conectar (as "conexões" do agente)

O agente lê **apenas relatórios administrativos**. Tudo passa pelo Microsoft
Graph com permissões de aplicativo, aprovadas pelo administrador do tenant.

### 2.1. Registro do aplicativo (App Registration no Microsoft Entra ID)

1. **Entra ID → App registrations → New registration.** Nome sugerido:
   `Painel-Integridade-Presenca`. Tipo: single tenant.
2. Gerar um **client secret** (Certificates & secrets) — guardar em cofre
   (Key Vault / gerenciador de segredos), **nunca** em arquivo do projeto.
3. Anotar: **Tenant ID**, **Client ID**, **Client Secret**.

### 2.2. Permissões do Microsoft Graph (Application permissions, com admin consent)

Peça **o mínimo necessário** — princípio da proporcionalidade da LGPD:

| Permissão | Para quê |
|---|---|
| `Reports.Read.All` | Relatórios de uso do Teams (mensagens, reuniões, chamadas, atividade por usuário) |
| `AuditLog.Read.All` | Sinais de login e dispositivo (Entra sign-in logs) — detecta sessão contínua anômala / dispositivo estranho |
| `User.Read.All` | Nome/departamento para agrupar (somente diretório, não conteúdo) |
| `CallRecords.Read.All` *(opcional)* | Duração real de chamadas/reuniões, se quiser granularidade |

> **NÃO peça** `Chat.Read.All`, `Mail.Read`, `Files.Read.All` nem nada que leia
> **conteúdo**. O painel não precisa e pedir isso vira passivo de LGPD.

> **Dica de privacidade:** o Graph tem a opção
> *"Show concealed user, group, and site names in all reports"*. Deixar os
> relatórios **pseudonimizados** por padrão e só revelar identidade na etapa de
> exceção (com log de quem consultou) reduz muito o risco.

### 2.3. Fontes de "produção real" para o outro lado da balança

O poder do painel está em cruzar presença com **sinais de entrega**. Conecte o
que fizer sentido para cada time (todos opcionais, escolha 1–2):

- **Git / GitHub** — commits, PRs, reviews (para times de engenharia).
- **Jira / Azure Boards / Trello** — tickets movidos, tarefas concluídas.
- **CRM (HubSpot, Salesforce, Pipedrive)** — atividades de vendas registradas.
- **Relatórios do próprio Teams** — mensagens enviadas e reuniões participadas
  já vêm no `Reports.Read.All`, então servem como linha de base sem conexão extra.

### 2.4. Onde o agente roda

- Máquina/servidor **da empresa** (ou função serverless), com o segredo em cofre.
- Agenda: 1×/dia é suficiente para tendência (evita a leitura de "tempo real",
  que é justamente a que se aproxima de vigilância).

---

## 3. Salvaguardas jurídicas — LGPD + CLT (ler antes de ligar)

Monitorar ferramenta corporativa é lícito no Brasil, **desde que**:

1. **Finalidade legítima e declarada** — "integridade de presença/aderência a
   jornada", não "vigilância". Documente.
2. **Transparência** — política escrita, **comunicada e assinada** pelos
   colaboradores. Monitoramento oculto gera nulidade de prova e dano moral.
3. **Proporcionalidade / minimização** — só dados agregados de atividade, nunca
   conteúdo; pseudonimização por padrão; identidade só na exceção.
4. **Acesso restrito e auditado** — quem vê a exceção fica registrado (trilha de
   auditoria, no espírito do "humano no loop").
5. **Base legal** — normalmente legítimo interesse do empregador; valide com
   **RH e Jurídico/DPO** antes de operar.

> Regra prática: se o painel só mostra *"colaborador X: status verde 92% do
> horário, 0 mensagens, 0 reuniões, 0 tarefas — revisar"* e nada do conteúdo do
> trabalho, você está do lado seguro. No momento em que ele lê e-mail, chat ou
> tela, saiu da zona defensável.

---

## 4. PROMPT PRONTO — colar em Plan Mode (Claude Code)

> Instruções para o time de TI: abrir o Claude Code numa pasta vazia, colar o
> texto abaixo, apertar **Shift+Tab** para entrar em **Plan Mode**, e revisar a
> arquitetura proposta **antes** de aprovar qualquer código. Ter em mãos Tenant
> ID, Client ID e o secret já no cofre.

```
Quero construir um "Painel de Integridade de Presença" — um agente defensivo,
transparente e em conformidade com LGPD/CLT. Objetivo final:

O agente deve, 1x por dia, ler APENAS relatórios administrativos do Microsoft
365 via Microsoft Graph (permissões de aplicativo, com admin consent) e cruzar
"presença declarada no Teams" contra "sinais de trabalho real", destacando
somente EXCEÇÕES para revisão humana. Nunca lê conteúdo (e-mail, chat, arquivos,
tela). Nunca instala nada no computador do colaborador.

FONTES (somente leitura, agregado):
1. Relatórios de atividade do Teams (getTeamsUserActivityUserDetail): mensagens
   enviadas, reuniões participadas, chamadas, dias ativos por usuário.
2. Entra ID sign-in logs (AuditLog.Read.All): padrões de sessão/dispositivo —
   sinalizar sessão contínua anômala ou dispositivo/IP fora do padrão do usuário.
3. UMA fonte de produção à escolha para calibrar o outro lado da balança
   (ex.: commits do GitHub, tickets do Jira, atividades de CRM). Deixe plugável.

LÓGICA:
- Para cada colaborador, calcule um "índice de aderência": presença declarada
  versus atividade real (Teams + fonte de produção).
- Marque como EXCEÇÃO apenas quem tem presença alta e atividade real baixa de
  forma sustentada (ex.: verde >85% do horário com ~0 sinais de trabalho por N
  dias). Não classifique quem tem um dia ruim isolado.
- Nenhuma ação automática, nenhuma punição, nenhum alerta ao colaborador. O
  agente só produz uma FILA DE EXCEÇÕES para o gestor decidir — humano no loop.

PRIVACIDADE E CONFORMIDADE (requisitos, não opcionais):
- Relatórios pseudonimizados por padrão; identidade só é revelada quando o
  gestor abre uma exceção, e essa revelação é registrada em trilha de auditoria.
- Peça o MÍNIMO de permissões Graph: Reports.Read.All, AuditLog.Read.All,
  User.Read.All (e CallRecords.Read.All só se necessário). Não peça nenhuma
  permissão que leia conteúdo.
- Client secret vem de variável de ambiente / cofre, nunca hardcoded.
- Retenção curta dos dados agregados; documente o período.

DASHBOARD (navegador, localhost):
- Visão geral: nº de colaboradores, % em conformidade, nº de exceções na fila.
- Fila de exceções com o "porquê" de cada uma (quais sinais dispararam) e a
  trilha de auditoria de quem consultou.
- Tom do produto: "o agente trabalhou; isto é só o que ele não teve confiança
  para decidir sozinho — você decide".

Stack: Python + Microsoft Graph SDK + um dashboard simples (Flask ou FastAPI).
Sou responsável de TI e vou fornecer Tenant ID, Client ID e o secret (do cofre).
Me guie em cada passo, incluindo como conceder admin consent no Entra ID.

Use Plan Mode. Mostre a arquitetura, as permissões exatas e o fluxo de dados
ANTES de escrever qualquer código. Faça perguntas de esclarecimento primeiro.
```

---

## 5. Checklist de decisão antes de aprovar o plano

- [ ] Política de monitoramento escrita, comunicada e assinada existe? (RH/DPO)
- [ ] As permissões pedidas são só as quatro de leitura de relatório? (nada de conteúdo)
- [ ] Pseudonimização ligada por padrão nos relatórios do Graph?
- [ ] Segredo no cofre, não no código?
- [ ] Fila de exceções tem trilha de auditoria de acesso?
- [ ] Combinado de que o painel mede **tendência**, não vigilância em tempo real?

---

*Documento de apoio — dados e permissões reais devem ser validados pelo
administrador do tenant e pelo Jurídico/DPO antes da operação.*
