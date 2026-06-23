# Mapeamento Completo — Painéis, Repasses e Serviços

**Contexto:** Governança Brasil · Painel de Conformidade TCE-RS · Prefeitura de Viamão/RS
**Objetivo:** mapear todos os painéis de verbas de repasse, os painéis ausentes (com fonte de dados e caminho), e o catálogo de serviços vendáveis pela GB.
**Status:** protótipo de validação — valores ilustrativos; estrutura e fontes reais.

---

## 1. Melhorias implementadas no painel (resposta à crítica)

| Lacuna apontada | O que foi feito |
|---|---|
| Faixa executiva para o Prefeito | Banner no topo com a decisão que exige ação (Saúde < 15%) e status do resto |
| Score "caixa-preta" | Score **clicável** → modal com pesos por dimensão (25/20/20/20/15) + **frescor por fonte** (SIAFIC, PNCP, SIOPS/SIOPE, LRF) |
| Estado vermelho/atraso não existia | Seção de **mínimos constitucionais** com Saúde **abaixo do mínimo** (14,2%) + modal "Como corrigir" |
| Especificidade TCE-RS | Referências a SIAPC/SIOPS/SIOPE e mínimos (LC 141/2012, CF art. 212/212-A) |

---

## 2. Painéis de verbas de repasse (todos os fluxos)

| # | Repasse | Natureza | Base legal / regra | Fonte de dados |
|---|---|---|---|---|
| 1 | **FPM** | Constitucional federal | 22,5% de IR+IPI, por coeficiente populacional | STN / Banco do Brasil · SICONFI |
| 2 | **ICMS cota-parte** | Constitucional estadual | 25% (75% VAF + 25% lei estadual) · IPM-RS | SEFAZ-RS |
| 3 | **IPVA cota-parte** | Constitucional estadual | 50% do IPVA dos veículos do município | SEFAZ-RS |
| 4 | **FUNDEB** | Legal (redistribuição) | 20% de impostos + complementação VAAF/VAAT | FNDE / STN · SIOPE |
| 5 | **SUS (fundo a fundo)** | Legal federal | FNS → Fundo Municipal de Saúde (blocos custeio/investimento) | FNS / SIOPS |
| 6 | **FNDE** | Legal federal | PNAE + PNATE + Salário-Educação + PDDE | FNDE / SIGPC |
| 7 | **SUAS / FNAS** | Legal federal | Assistência social fundo a fundo · IGD-SUAS/PBF | FNAS / SUASweb |
| 8 | **ITR** | Constitucional federal | 50% (ou 100% se convênio de fiscalização) | STN / RFB |
| 9 | **CIDE-Combustíveis** | Legal federal | Vinculada a infraestrutura de transporte | STN |
| 10 | **Royalties / CFURH / CFEM** | Compensação financeira | Hídrica (ANEEL) e mineral (ANM) | ANEEL / ANM / STN |
| 11 | **Lei Kandir / LC 87 (FEX)** | Compensação | Desoneração de exportações | STN / SEFAZ-RS |
| 12 | **Emendas parlamentares** | Voluntária | Especiais ("Pix"), de bancada, individuais | Transfere.gov / Portal Transparência |
| 13 | **Convênios voluntários** | Voluntária | Com objeto e plano de trabalho | Transfere.gov / convenentes |

> **API central:** SICONFI tem **API aberta** (JSON, sem autenticação) — `apidatalake.tesouro.gov.br/docs/siconfi/` — cobrindo MSC, RREO e RGF de ~5.496 municípios.

---

## 3. Painéis que faltam (lacunas) — fonte + como fazer

| Painel | O que mostra | Fonte de dados | Como construir | Serviço GB |
|---|---|---|---|---|
| **Emendas parlamentares** | Cada emenda do empenho à PC, com alertas | Transfere.gov, Portal Transparência, SIOP | Importar carteira, cruzar com empenhos, calcular saldo, alertar 90/30d | Integração Transfere.gov + esteira de execução |
| **Convênios & PC** | Saldo, vigência, pendências de prestação | Transfere.gov, plano de trabalho | Semáforo por convênio + checklist de PC | Monitor de vigências + bloqueio de inadimplência |
| **CAPAG** | Nota A/B/C e limites de endividamento | STN (CAPAG), SICONFI | Calcular 3 indicadores + simular operações | CAPAG automática + simulador |
| **Restos a Pagar & caixa** | RP x disponibilidade por fonte (LRF art. 42) | SIAFIC, SICONFI | Conciliar RP por fonte, alertar cobertura insuficiente | Conciliação RP + alerta art. 42 |
| **Projeção de mínimos** | Saúde/Educação projetadas a dez/2026 | SIOPS, SIOPE | Tendência sobre série mensal + gap em R$ | IA de projeção + alertas escalonados |
| **Dívida ativa** | Estoque + priorização + cobrança | Cadastro IPTU/ISS, dívida ativa, PGM | Scoring por chance de recuperação + cobrança multicanal | Recuperação de receita (success fee) |
| **Transparência & e-SIC** | Cobertura LAI + prazos e-SIC | Portal municipal, e-SIC | Varredura de itens obrigatórios + SLA de respostas | Auditoria contínua da LAI |
| **Obras & contratos** | Cronograma físico-financeiro x PNCP | PNCP, medições locais | Vincular contrato↔execução, sinalizar desvios/aditivos | Painel de obras integrado ao PNCP |
| **FUNDEB 70%** | Aplicação mín. de 70% no magistério (art. 212-A) | SIOPE, folha | Confrontar despesa de magistério x total FUNDEB | Painel FUNDEB com projeção |

---

## 4. Catálogo de serviços vendáveis (GB)

| Serviço | Persona-alvo | Pitch (dor) | Modelo de preço (ref.) | ROI |
|---|---|---|---|---|
| Painel de Conformidade & Repasses | Prefeito / Sec. Fazenda | "Estou em dia com o TCE?" | R$ 4,9k/mês + setup R$ 18k | 1 renovação retida paga o projeto |
| Projeção preditiva de mínimos + alertas | Sec. Fazenda / Contador | Evitar rejeição antes que aconteça | R$ 2,4k/mês | Evita 1 rejeição = mandato salvo |
| Recuperação de receita (dívida ativa) | Sec. Fazenda / PGM | "Arrecadar sem subir imposto" | Setup R$ 30k + 8–12% do recuperado | Maior ROI percebido (JTBD nº2) |
| Captação & gestão de emendas/convênios | Prefeito / Gabinete | Recurso que prescreve | R$ 3,2k/mês | Emenda vira obra entregue |
| Integração gov.br / PNCP / SICx | TI / Atendimento | Experiência gov.br, Lei 15.266/2025 | Projeto a partir de R$ 28k | Feature-matching vs. Betha/IPM |
| IA: copiloto + assistente atendimento | Atendimento / Cidadão | Dependência de suporte (21 dias) | R$ 3,9k/mês | −30% tickets; fechamento 5→2 dias |
| LGPD as a Service | Controle interno / TI | ANPD fiscaliza municípios | R$ 1,8k/mês | Evita multa e risco contratual |
| Estabilidade & SLA Premium | TI / Sec. Fazenda | Sistema cai no pico do RGF | R$ 1,5k/mês | 1% uptime ≈ R$ 500k/ano |
| Prestação de contas TCE-RS gerenciada | Contador / Equipe | "Operar com o time que tenho" | R$ 2,2k/mês | Menos retrabalho e suporte |

**Planos empacotados:** Essencial (R$ 6,9k/mês) · Gestão (R$ 12,9k/mês, mais escolhido) · Estratégico (R$ 22,9k/mês + success fee).

---

## 5. Arquivos entregues

| Arquivo | Conteúdo |
|---|---|
| `painel-conformidade.html` | Dashboard com faixa executiva, score explicável, estado vermelho, verbas de repasse e painéis-lacuna |
| `vendas-servicos.html` | Página de vendas de serviços da GB (hero, catálogo, planos, roadmap, CTA) |
| `MAPEAMENTO_PAINEIS_GB.md` | Este mapeamento |

---

## 6. Fontes públicas de referência

- SICONFI / API de Dados Abertos — Tesouro Nacional (`apidatalake.tesouro.gov.br/docs/siconfi/`)
- Transferências Constitucionais e Legais — Tesouro Nacional
- Transfere.gov (emendas e convênios) · Portal da Transparência do Governo Federal
- SIOPS (saúde) / SIOPE (educação) · FNS / FNDE / FNAS
- TCE-RS — SIAPC / e-Validador / índices constitucionais
- IBGE Cidades — Viamão (Censo 2022: 224.112 hab.) · Portal da Transparência de Viamão
</content>
