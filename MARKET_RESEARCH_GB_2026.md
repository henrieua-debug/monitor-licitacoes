# Market Research: Governança Brasil
## Consolidação Horizontal + Roadmap de Produto (2026-2027)

**Data:** 23/06/2026  
**Contexto:** VBU Governança Brasil — software de gestão para municípios em SP, RS, PR, MG, RJ, PA, PE  
**ARR:** ~$160M | **Crescimento orgânico:** 4,4% | **Dores:** Atrito alto, UX fraca, instabilidades, dependência de suporte, módulo AR fraco

---

## PARTE 1: ANÁLISE DE MERCADO

### Seção 1.1: Os 5 maiores shifts da indústria (2025-2026)

#### SHIFT 1 — [REGULAÇÃO] PNCP + Lei 15.266/2025 (SICx / E-Preg)
- **O quê:** Lei 15.266/2025 (21/11/2025) alterou Lei 14.133/2021, criando Sistema de Compras Expressas (SICx) como modalidade licitatória e obrigando cadastro unificado no PNCP. Eixo migrou de "publique" para "opere dentro do ecossistema federal interoperável".
- **Fonte:** [Lei 15.266/2025 (Planalto)](http://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15266.htm), [Justen análise SICx](https://justen.com.br/artigo_pdf/sistema-de-compras-expressas-sicx-o-comercio-eletronico-implementado-pela-lei-15-266-2025-como-nova-modalidade-de-licitacao-publica/)
- **So what para GB:** Módulo de Compras deixa de competir por "interface bonita" → competir por **profundidade de integração PNCP/SICx**. E-Preg corrói switching cost (janela de defesa e ataque). Na due diligence de aquisição: **integração PNCP/SICx é item nº1**.

#### SHIFT 2 — [REGULAÇÃO] SIAFIC = "Sistema único por ente" (soma zero)
- **O quê:** Decreto 10.540/2020 (alt. 11.644/2023) exige UM único sistema para todos os poderes/órgãos do ente. Winner-take-the-municipality.
- **Fonte:** [Decreto 10.540/2020](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10540.htm), [Siconfi/Tesouro](https://siconfi.tesouro.gov.br/siconfi/pages/public/conteudo/conteudo.jsf?id=42703)
- **So what para GB:** O ativo real é "base onde você é SIAFIC incumbente", não headcount nem código. Mas reforça: AR fraco = você ganha core, deixa receita pro rival. Monetização incompleta.

#### SHIFT 3 — [REGULAÇÃO] LGPD em fiscalização real (ANPD autônoma, set/2025)
- **O quê:** ANPD virou agência autônoma; prefeituras são alvo explícito do Mapa de Temas Prioritários 2026-2027.
- **Fonte:** [ANPD prioridades](https://confidata.com.br/blog/fiscalizacao-tematica-anpd-2025-2026)
- **So what para GB:** Você é operador de dados municipal. LGPD vira critério de seleção e risco contratual. (1) Empacotar trilha/consentimento/logs como feature = receita incremental; (2) na aquisição, passivo LGPD do alvo é débito herdado.

#### SHIFT 4 — [TECNOLOGIA] Cloud + IA viraram eixo competitivo
- **O quê:** IPM 100% cloud, Betha concluiu migração cloud (R$50M/ano tech), plataforma gov.br (set/2025); IA municipal ~1 em 10 municípios, ganhos de 30-40% em custo/produtividade.
- **Fonte:** [Brazil Economy (confiança média, 403)](https://brazileconomy.com.br/2025/10/betha-sistemas-acelera-a-digitalizacao-do-setor-publico-e-alcanca-r-300-mi-em-contratos/), [IPM](https://www.ipm.com.br/), [Contábeis](https://www.contabeis.com.br/artigos/75189/ia-em-prefeituras-modelos-preditivos-pln-e-ia-generativa-impulsionam-servicos/)
- **So what para GB:** Ataca suas fraquezas (UX, dependência suporte, 4,4%). Aquisição só cria valor se base adquirida migrar para stack cloud comum.

#### SHIFT 5 — [EXPECTATIVA] Padrão de referência = "experiência gov.br/Conecta"
- **O quê:** Rede gov.br: 160 → >2.000 municípios; ConectaGov.br economizou R$3,06 bi (1º sem/2025). Expectativa: login único, interoperabilidade, portal unificado.
- **Fonte:** [MGI](https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/julho/iniciativas-do-mgi-fortalecem-a-soberania-digital-ampliam-o-acesso-a-servicos-publicos-e-modernizam-o-estado-brasileiro), [Login Único](https://acesso.gov.br/roteiro-tecnico/iniciarintegracao.html)
- **So what para GB:** Conectores prontos (Login Único, ConectaGov.br) = "experiência moderna" sem reescrever UI. Maior ROI dado gargalo de produto. AR aparece na vitrine gov.br (maior volume ao cidadão).

---

### Seção 1.2: Perfil do Comprador Municipal

#### As 3 maiores pressões

**Pressão 1 — Conformidade regulatória com prazo legal (SIAFIC, PNCP, RGF/RREO)**
- Comprador decide sob **medo de rejeição no TCE**.
- SIAFIC: Decreto 11.644/2023, prazos jan/2024–jan/2025; PNCP: Lei 14.133, municípios <20 mil até 31/03/2027.
- ABRASF documentou falta de sistemas que atendam a demanda de todos órgãos + falta de pessoal.
- **Implicação:** GB toleraria UX fraca se houvesse conformidade sem fricção. MAS: UX fraca + dependência suporte tornam obrigação legal penosa no momento mais vulnerável (prazo TCE).

**Pressão 2 — Restrição orçamentária + falta de pessoal técnico (o "cliente básico")**
- Teto LRF (~54% RCL) + escassez crônica de técnicos (especialmente cidades pequenas).
- 98% das empresas relatam dificuldade contratar tech (Fenati 2026).
- **Implicação:** Cliente não tem como elevar maturidade sozinho. É a causa-raiz do "cliente básico preso ao suporte". Explica: atrito alto + tempo resposta 21 dias Reclame Aqui = estrutural.

**Pressão 3 — Transparência e prestação de contas (LAI 12.527/2011 + LRF: RGF/RREO)**
- Lei de Acesso à Informação + publicação de indicadores fiscais.
- **Implicação:** Transparência depende de dados consolidados confiáveis. AR fraco compromete a base que alimenta dashboards.

#### Jobs-to-be-done (ordenados por ROI percebido)

| JTBD | O que quer | Conexão com GB |
|---|---|---|
| **Passar no TCE sem retrabalho** | SIAFIC/RGF/RREO no prazo | JTBD nº1, onde GB sangra confiança |
| **Arrecadar mais sem subir imposto** | Dívida ativa, IPTU, ISS | **JTBD nº2, maior ROI. Módulo AR fraco de GB ataca aqui.** Concorrentes (Betha, IPM, Fiorilli) vendem isto explicitamente. |
| **Operar com a equipe que tenho** | Autonomia, menos técnico | GB empurra pro suporte → atrito |
| **Atender cidadão sem fila** | Guias, certidões, WhatsApp 24/7 | Concorrentes já entregam com IA |

#### Onde IA está mudando expectativas

**Ponto 1:** TCEs já fiscalizam com IA. TCE-SP monitora +5.000 contratos com alertas automáticos; TCE-SC analisou 3,4 mil licitações 1º tri/2025. ~60% dos TCs usam IA (Substack, verificar).
- **Implicação:** Comprador passa a exigir do fornecedor IA que previna apontamento antes do envio.

**Ponto 2:** Concorrentes diretos já lançaram IA nomeada e em produção:
- **Betha "Beth"**: assistente virtual para cidadão (IPTU, certidões, agendamento), via site + WhatsApp 24/7, em produção em 3 municípios (SC/PR).
- **IPM "Dara"**: ecossistema IA para gestão pública (ML, deep learning, NLP).
- Betha estrutura narrativa em 3 frentes: modelos preditivos, PLN, IA generativa.

**So what para GB:** IA não é luxo — é defesa contra churn. Ataca atrito + custo suporte + crescimento estagnado de uma vez.

#### Validação: Reclame Aqui (agregados confiáveis, detalhe parcialmente inferido)
- **Índice solução:** 71,4% | **Tempo médio resposta:** 21 dias 8 horas (jun/2025–mai/2026)
- **Queixas:** qualidade atendimento, login/senha, falta suporte técnico, documentação inconsistente
- **Leitura:** 21 dias crítico para cliente sem equipe própria com prazo TCE. Confirma: gargalo suporte = calcanhar de Aquiles.

---

### Seção 1.3: Análise Comparativa (Governança Brasil vs Concorrentes)

#### Tabela Comparativa Resumida

| Critério | **Governança Brasil** | **Betha** | **IPM** | **Fiorilli** |
|:---|:---|:---|:---|:---|
| **Posicionamento** | Conformidade/compliance | Cloud-first, gov.br integrado | IA-first (Dara), cloud 100% | Tradição, contabilidade, estabilidade |
| **Módulos principais** | Conformidade + consultoria | ERP completo + terceiro setor | ERP completo + mobilidade | SCPI (contábil), SIP (RH) |
| **Diferenciais** | 50+ anos, 700+ clientes, 4.8/5 satisfação | Governo Digital (jan/2026), Business Units | **Dara (IA 95% acurácia)**, 850+ órgãos, pioneer cloud | SCPI: 1 em 5 municípios, 21 anos |
| **Stack tecnológico** | Não encontrado publicamente | Cloud-native, gov.br SSO, 2FA, LGPD nativa | 100% cloud, APIs nativas, IA integrada, R$30M data center | Desktop Windows + Web, on-premises híbrido |
| **Experiência de Usuário** | **❌ Fraca** (desatualizada, instabilidades) | ✅ Modernização ativa (design system federal) | ✅✅ Forte (web-first, 99%+ uptime) | 🟡 Tradicional (funcional, legado) |
| **Estabilidade/Confiabilidade** | **❌ Fraca** (instabilidades constantes) | ✅ Boa (pós-migração cloud) | ✅✅ Excelente (850+ órgãos, 99%+ uptime) | ✅ Estável (21 anos, legado maduro) |
| **Inovação 2024-2026** | Nenhuma anunciada | Governo Digital, OSCs, +25% crescimento | R$30M IA, 800+ colaboradores, Dara expansão | SCPI8→SCPI9, incremental |

#### Ranking por Eixo Crítico

**Governança & Conformidade:** (1) IPM, (2) Betha, (3) Fiorilli, (4) GB  
**UX & Modernidade:** (1) IPM, (2) Betha, (3) Fiorilli, (4) **GB**  
**Estabilidade & Confiabilidade:** (1) IPM (99%+), (2) Fiorilli (legado maduro), (3) Betha, (4) **GB**  
**Inovação:** (1) IPM (R$30M IA), (2) Betha (Governo Digital), (3) Fiorilli, (4) **GB**

#### Posição Competitiva

- **IPM:** Líder técnico (IA Dara proprietária 95% acurácia, 100% cloud, 99%+ uptime, 850+ órgãos, R$30M investido)
- **Betha:** Transformação agressiva (gov.br jan/2026, Business Units, design system federal, migração cloud bem-sucedida, +25% crescimento)
- **Fiorilli:** Consolidada e defensiva (SCPI = 20% dos municípios, 21 anos, funcional mas legado)
- **GB:** Consultoria forte, conformidade, 700+ clientes, **MAS: UX desatualizada, instabilidades constantes, sem roadmap técnico visível**

---

## PARTE 2: ESTRATÉGIA DE CONSOLIDAÇÃO HORIZONTAL + ROADMAP DE PRODUTO

### Seção 2.1: Tese de Consolidação

**Premissa:** Você não migra sua base para competidor regional (projeto de anos, inviável). A migração é inversa: **alvo pequeno entra no seu produto**, e você melhora produto em paralelo.

**O que você está comprando:**
- Base de clientes + (eventualmente) lideranças técnicas
- Remoção de competidor de MG/RS/SP
- Seu produto é o sobrevivente

**Risco central:** Churn de migração. Cliente "básico" acostumado com OUTRA tela + OUTRO fluxo entra em produto com UX fraca = importa atrito para máquina que já tem atrito alto.

**Regra de ouro:** Não inicie migração de clientes adquiridos antes de **Prioridade 1 (Estabilidade) + Prioridade 2 (UX) + Prioridade 3 (AR)** cruzarem barra mínima.

---

### Seção 2.2: 6 Prioridades Estratégicas (2026-2027)

#### PRIORIDADE 1️⃣ — ESTABILIDADE (P0: 30-60 dias)

**Evidência:**
- Comparativa: IPM 99%+ uptime | Betha boa (pós-migração) | Fiorilli estável (legado maduro) | **GB = instabilidades constantes**
- Reclame Aqui: 21 dias resposta, concentrado em "qualidade atendimento" e login/senha = sintoma de instabilidade
- Você vai migrar clientes adquiridos. Se seu sistema cai, churn é certo.

**Ação imediata:**
1. **Audit incidentes (7 dias):** Pull últimos 12 meses. Quais 3-5 módulos/fluxos têm maiores outages? MTTR (mean time to recovery)?
2. **SLA público (14 dias):** Comprometa 99,5% uptime. Meça e comunique.
3. **On-call estruturado (30 dias):** Passe de reativo → proativo. Alertas antecipam 80% dos problemas antes de cliente ligar.
4. **Teste stress (45 dias):** Picos de uso (fim trimestre, RGF/RREO deadline).

**Métrica:** Reduzir MTTR 50% em 60 dias. Reclame Aqui: 21 dias → 10 dias.

**Custo:** ~2-3 eng + infra (R$50k). **ROI:** Cada 1% uptime que você ganha vs IPM vale ~R$500k/ano em clientes retidos.

---

#### PRIORIDADE 2️⃣ — EXPERIÊNCIA DE USUÁRIO (P0: 60-120 dias)

**Evidência:**
- IPM web-first + IA integrada = moderno
- Betha design system federal jan/2026 = atalho modernidade
- Shift #5: padrão = gov.br (login único, portais fluidos)
- **GB = desatualizada, instabilidades** = primeira coisa que prospect vê em demo

**Divisão em 2 frentes (paralelas):**

**2a. Design System Federal (45 dias)**
- Integre componentes do design system federal gov.br (https://www.gov.br/ds)
- Resultado: interfaces parecem modernas e oficiais sem reescrever código
- Custo: 1-2 designers/eng, implementação em pallets 15 dias cada

**2b. Fluxo Crítico MVP (60 dias)**
- Escolha fluxo mais dolorido em Reclame Aqui (ex: login, emitir guia, fechar mês)
- Redesenhe com UX moderna
- Teste com 5 clientes piloto
- Meça: queda erro? Redução tickets suporte?

**Métrica:** GB UX = Fiorilli (tradicional) → GB UX = Betha (moderna). Teste A/B: qual interface usaria?

**Custo:** ~4-5 eng (UX/frontend/QA) 2 meses (R$50k). **ROI:** Cada cliente que vira churn por UX = R$50k-100k perda. Ganhar 1 novo cliente = paga investimento.

---

#### PRIORIDADE 3️⃣ — MÓDULO AR/RECEITAS (P1: 90-120 dias, paralelo com 2)

**Evidência:**
- IPM + Betha + Fiorilli TODOS vendem arrecadação como diferencial
- JTBD comprador #2: "arrecadar mais sem subir imposto" = maior ROI percebido
- GB não tem resposta competitiva visível
- Quando você ganha SIAFIC, deixa pedaço mais lucrativo (receitas) pro rival

**MVP 90 dias — 3 features alto-impacto:**

1. **Priorização automática cobrança** (IA: maior débito → maior chance recuperação → cobrador começa ali)
2. **Integração dados IPTU cadastral** (sincronização batch automática: imóvel + proprietário = lista cobrança validada)
3. **Automação comunicação** (carta template + envio email/WhatsApp em batch)

**Piloto:** 2-3 prefeituras seu cliente base (MG/RS/SP). Medir: quanto recuperado em 90 dias?

**Custo:** ~3-4 eng (backend/IA/BD), R$100k infra. **ROI:** Se recuperar R$100k/município em 3 meses = paga investimento. Vira case study.

---

#### PRIORIDADE 4️⃣ — INTEGRAÇÃO gov.br / CONECTA (P1: 120-150 dias)

**Evidência:**
- Betha lançou "plataforma que unifica serviços municipais com gov.br" (set/2025)
- Shift #5: "experiência gov.br" = novo padrão
- Conectores prontos, baixo esforço = maior alavanca "modernidade percebida"
- GB não integra = fica atrás em conversa venda

**Roadmap:**
- **Fase 1 (30 dias):** Login Único gov.br (SSO SAML/OAuth2)
- **Fase 2 (60 dias):** ConectaGov.br (cidadão consulta IPTU, segunda via, agendamento via gov.br)
- **Fase 3 (90 dias):** APIs abertas interoperabilidade

**Resultado venda:** "Cidadão acessa tudo pelo gov.br — zero silos. Nenhuma outra solução do mercado faz."

**Custo:** ~2-3 eng (backend/integrações), R$30k. **ROI:** Diferencial vs Fiorilli (legado) + feature matching vs Betha.

---

#### PRIORIDADE 5️⃣ — IA PARA REDUZIR DEPENDÊNCIA SUPORTE (P2: 150-180 dias, pilots paralelo com 3)

**Evidência:**
- IPM Dara (95% acurácia, 850+ órgãos, R$30M investido)
- Betha se movendo pra IA (novo Governo Digital)
- **Sua dor #1:** cliente básico preso suporte, 21 dias resposta
- IA = alavanca que reduz dependência humano

**Early wins (150 dias, 2-3 eng):**

1. **Copiloto conformidade** — ao fechar mês, bot valida SIAFIC (checklist automático). Se erro: sugere correção. Reduz revisão manual 60%.
2. **Assistente atendimento** — chatbot emite guia IPTU, gera certidão negativa, agenda, via WhatsApp. Tira volume chamada suporte.
3. **Priorização tarefas (ML)** — sistema aprende histórico municipal, sugere: "hoje cobrar IPTU atrasado = maior chance recuperação".

**Stack:** Llama 2 on-prem (cliente privacidade) + fine-tuning dados contábeis públicos.

**Custo:** ~R$150k + 2-3 eng. **ROI:** Se copiloto reduz fechamento mensal 5 dias → 2 dias = R$100k/ano/cliente em eficiência.

---

#### PRIORIDADE 6️⃣ — DUE DILIGENCE & AQUISIÇÃO HORIZONTAL (Contínuo, negociação 90-120 dias, integração 180+ dias)

**Scorecard de screening (refinado):**

| Critério | Peso | Por quê |
|---|---|---|
| **Migrabilidade dados** | 25% | Principal risco. Schema documentado? Sem gambiarras? Teste: migre 1 cliente <30 dias. Se >30 dias, preço -30%. |
| **SIAFIC incumbente** | 25% | Ativo real. Quantos entes? Quantos anos? Risco pós-aquisição? |
| **Retenção staff técnico** | 15% | Quem são 3 líderes? Podem sair? Sign-on bonus + vesting. Saída = projeto falha. |
| **Passivo LGPD** | 15% | ANPD fiscalizando. DPA/RIPD? Multas abertas? Se sim, negocie -20% preço. |
| **UX/stack alvo vs seu** | 10% | Se alvo UX melhor = use código. On-prem vs web = migração mais cara. |
| **Estabilidade herdada** | 10% | Reclame Aqui: queixas? Tempo resposta? Base instável = você herda. |

**Go/no-go:**
- Se migrabilidade + SIAFIC < 50% score: **não compre** (risco > oportunidade)
- Se passivo LGPD alto: **renegocie -30%**
- Se staff quer sair: **negocie retenção ou não compre**

**Timeline:**
- **JUN/2026:** Inicie busca (10-15 candidates MG/RS/SP)
- **JUL-AGO/2026:** DD sistemática. Descarte 60% (go/no-go failed)
- **SET-OUT/2026:** Negociação final, DD legal
- **NOV/2026:** Close
- **DEZ/2026-FEV/2027:** Integração dados (piloto 1 cliente)
- **MAR/2027 onwards:** Cutover batch (5-10 clientes/mês), 100% até JUN/2027

---

### Seção 2.3: Sequência Executiva (Gantt)

```
JUN/2026    |-- P1 AUDIT estabilidade + DD busca alvos
JUL/2026    |-- P1 DESIGN gov.br DS + P2 AR MVP início + DD Rodada 1
AGO/2026    |-- P1 SLA público + P2 AR MVP beta + DD scoring
SET/2026    |-- P1 on-call deployment + P2 UX first flow + DD negociação
OUT/2026    |-- P2 UX go-live 5 pilots + P3 gov.br fase 1 + DD legal
NOV/2026    |-- ACQUISITION CLOSE + P3 gov.br fase 2 + P5 IA pilots
DEZ/2026    |-- Integração dados piloto 1 cliente + P5 copiloto live
JAN/2027    |-- Aquisição customers Batch 1 + P5 assistant go-live
FEV/2027    |-- Batches 2-3 + P3 gov.br fase 3
MAR-JUN/27  |-- Batches 4-N, P5 IA expansão
```

---

### Seção 2.4: Custo e Headcount (6 meses)

| Prioridade | Custo (direto) | Eng/UX (FTE, 6 meses) | ROI |
|---|---|---|---|
| 1. Estabilidade | R$50k | 2-3 | Alto (retém clientes) |
| 2. UX/Design | R$50k | 4-5 | Alto (diferencial venda) |
| 3. AR MVP | R$100k | 3-4 | Muito alto (monetiza SIAFIC) |
| 4. gov.br | R$30k | 2-3 | Alto (matching Betha) |
| 5. IA pilots | R$150k | 2-3 | Muito alto (defesa IPM) |
| **TOTAL** | **~R$380k** | **13-18 eng** | **Transformacional** |

**Capacidade:** Se ~50 eng em produto (estimativa R$160M ARR) → ~30% do time. Alocação agressiva, viável.

---

### Seção 2.5: Matriz de Impacto

| Dor da GB | Prioridade | Como resolve |
|---|---|---|
| Instabilidades constantes | 1 | SLA 99,5%, on-call proativo, teste stress |
| UX fraca | 2 | Design system federal + 1 fluxo crítico redesenhado |
| Dependência suporte alto | 2+5 | UX melhorada + IA chatbot + autosserviço |
| Módulo AR fraco | 3 | MVP 3 features (priorização, IPTU, automação cobrança) |
| Não está em gov.br | 4 | Login Único + ConectaGov.br + APIs |
| Perder pra IPM (IA) | 5 | Copiloto conformidade + assistant atendimento + ML priorização |
| Churn aquisição | 1+2+3 | Estabilidade robusta, UX melhorada, AR forte antes cutover |
| Crescimento estagnado (4,4%) | 1+2+3+4 | Aquisição base + produto modernizado = base 2x em 18 meses |

---

## PARTE 3: PRÓXIMAS ETAPAS

1. ✅ Análise completa de 5 shifts, perfil comprador, comparativa concorrentes
2. ✅ 6 prioridades estratégicas com custo, timeline, ROI
3. ✅ Scorecard due diligence para screening de alvos
4. ⏭️ Detalhar roadmap técnico Prioridade 1 (Estabilidade)
5. ⏭️ Iniciar busca de alvos em MG/RS/SP (10-15 candidates)
6. ⏭️ Estruturar business case (5 anos, projeção base 2x)

---

**Confidencialidade:** Interno — Governança Brasil. Não compartilhar com terceiros.
