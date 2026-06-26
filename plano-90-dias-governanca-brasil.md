# 90-Day Business Transformation Plan

**VBU:** Governança Brasil (GOVBR)
**Leader:** Henrique Barreto
**Plan created:** 26/06/2026
**90-day review date:** 26/09/2026
**Portfolio/Group Leader:** ______________________

> Quatro commitments. Blockers nomeados. Resultados mensuráveis. Cada commitment é específica o bastante para que, em 90 dias, alguém possa checar se foi feita.

---

## Hipótese de transformação de 90 dias (North Star)

O "+$1 por cliente/mês" da VBU mora em dois lugares ao mesmo tempo: **(1) reajuste contratual acima do índice inflacionário**, justificado pelo valor de novos satélites entregues à base estrela, e **(2) redução de COGS de cloud** via reescrita do produto legado, que expande a margem por cliente. Capturá-lo até o Dia 90 significa **reestruturar o produto** (reescrita-COGS + satélites, como um só programa) e **descentralizar a capacidade de construção** para fora do gargalo único de R&D — provando, nas 5 prefeituras estrela que renovam em setembro, que satélite adotado vira reajuste acima do IPCA. As quatro commitments abaixo entregam isso.

**Cluster A — 18 clientes estrela (named accounts):** Viamão · Santa Maria · Itabira · São Sebastião/SP · Montes Claros · Uruguaiana · Porto Feliz · São Roque · Ananindeua · Leme · Contagem · Olinda · Boituva · Rolândia · Eldorado do Sul · Saquarema · Pato Branco · Ubá.

---

## Commitment 1 — BUILD (ship + how you ship)

**Grid movement:** Build já é **Verde em capacidade** (Builder 360 forte; 1º agente construído em 2 dias). Movimento de 90 dias: de *"Verde preso a uma pessoa"* → *"Verde em produção, adotado e escalável"*.

**What's changing:** Decidir a arquitetura agêntica (camada única vs. agentes por módulo, sobre **64 módulos / 35M linhas**); mapear a expectativa da base via instrumento de discovery no Cluster A e shipar a 1ª onda de satélites priorizada; iniciar a reescrita pelos módulos de maior custo de cloud — operando o Builder 360 com muito além do líder único de R&D.

**The measurable:**
- Arquitetura agêntica aprovada por escrito — **week 3**
- Discovery do Cluster A priorizando o roadmap de satélites — **week 2–3**
- **≥15 satélites no ar e adotados por 10–20 das 18** prefeituras estrela (uso ativo, não só "no ar") — **week 10**
- **≥5/64 módulos** (os de maior custo de cloud) reescritos com **−30% de cloud medido na fatura** — **week 12**
- **20 pessoas certificadas no Builder 360** (inclui os 10 técnicos de PS da Commitment 3) — **week 6**

**Timeline and owner:** 90 dias → 26/09. **Dono: Ivan Filagrana**, com **Higo Mariano**.

**The first blocker:** Gargalo no líder único de R&D (Ivan, centralizador). **Unlock:** (a) decisão de arquitetura que paraleliza o trabalho; (b) deploy do Builder 360 para 20 pessoas até a week 6.

---

## Commitment 2 — SELL (find, win, keep)

**Grid movement:** Sell hoje é **Vermelho** (linha mais fraca dos briefs). Movimento de 90 dias: Vermelho → Sobrevivendo/Vencendo, provando reajuste acima do índice nas renovações de setembro + retenção das demais.

**What's changing:** Converter a adoção dos satélites em **reajuste acima do IPCA** nas prefeituras estrela que vencem **na janela em que o produto já existe (setembro)**; **defender a IPCA** (retenção, sem upsell) as que vencem antes do produto; usar a pasta de governança/auditoria dos agentes como justificativa formal de preço.

**The measurable:**
- **Upsell (IPCA + 5–10%)** nas ~6 renovações de setembro alcançadas pelo produto: **Viamão (PM), Saquarema (CM), Boituva (PM), Porto Feliz (PM+CM), Rolândia (PM)**
- **Defender a IPCA cheio (retenção)** as renovações jul–ago e vencidas: Olinda, Itabira, Ananindeua (CM), Leme, Eldorado do Sul (PM), Saquarema (PM), São Roque (PM+CM)
- **Responsible AI que destrava preço:** padrão de trilha de auditoria + "ato indelegável sempre humano" publicado como argumento de renovação — **até week 8**

**Timeline and owner:** Casado ao calendário de vencimentos (renovações **não antecipáveis**, só no prazo). **Dono: Miguel Júnior** + diretores regionais: Rodrigo Braga (MG/RJ), Roberlei Fernandes (SP), Rodrigo (RS), João Macedo (PR), Tomás (Norte-Nordeste).

**The first blocker:** Cliente público questiona reajuste acima do índice sem prova de valor. **Unlock:** a **adoção comprovada dos satélites** (métrica do Build) vira a justificativa contratual. *Risco secundário:* poucos vencimentos caem na janela com produto pronto — por isso o foco cirúrgico nas 5 estrelas de setembro.

> **Nota:** Attrition (7,7% → 3,5%, sendo ~3% político/integridade e ~4,7% endereçável) é métrica **anual** e parte já está "assada" — movida para *Beyond 90 days*, não é régua de 90 dias.

---

## Commitment 3 — UPSIDES > BLOCKERS (opportunity > friction)

**Grid movement:** linha que mais oscila nos briefs ("pessoas serão problemas") → **"produto que se ensina sozinho + PS construindo + Ivan incentivado a soltar"**. Fricção convertida em throughput.

**What's changing:** O Builder 360 passa a gerar cada feature **com kit de PS embedado (vídeo/manual) + documentação da Mia** dentro da própria construção, de modo que escalar satélites **não** escale o suporte de forma linear; **10 técnicos de PS** ganham autonomia para construir features no Builder 360, **descentralizando o R&D**; a Mia é treinada nos satélites documentados.

**The measurable:**
- **10 técnicos de PS construindo no Builder 360** (subconjunto dos 20 certificados, não soma) — **week 3**
- **100% dos satélites entregues com kit de PS + documentação da Mia embedados** (self-service nasce com o produto)
- Mia treinada na documentação dos satélites; **deflexão-% de tickets = outcome de 6 meses** (não meta de 90 dias, pois depende do produto existir)

**Timeline and owner:** PS-builders **week 3**. Donos: **Tiago Nogueira** (PS), **Manuela Bolsonaro + Lívia Sá** (Mia/Customer Care), **Higo Mariano** (enablement Builder 360).

**The first blocker / forcing function:** Ivan centralizador precisa *soltar* a construção de features. **Unlock:** amarrar **formação de pessoas e descentralização como meta do LTIP do Ivan** — incentivo de longo prazo, não conversa informal. *Risco a vigiar:* cliente acostumado a atendimento humano/telefônico — não empurrar self-service além da absorção cultural.

---

## Commitment 4 — 2× THE BUSINESS (credible path forward)

**Grid movement:** 2× hoje é **Vermelho**. Movimento de 90 dias: não dobrar, mas **provar que o caminho pro 2× em 3 anos é real**, de-riscando o motor de reestruturação de produto.

**What's changing:** Tratar **reescrita-COGS + criação de satélites como UM programa** de reestruturação de produto. O time de dev investe na melhora do produto (cloud↓ e satélites↑) enquanto o PS supre as demandas emergenciais do cliente. O **Builder 360 vira capacidade compartilhável no grupo** (a Equiplano o utiliza para gerar receita na outra empresa — não é uma venda).

**The measurable (prova de 90 dias da trajetória pro 2×):**
- **5/64 módulos com −30% de cloud medido** → modelo extrapolado mostrando a trajetória pra **−60% de cloud** e a expansão de margem que sustenta o 2×
- **Fidelização provada** = os ~6 reajustes acima do índice de setembro (costura com a Commitment 2)
- **Business case de 3 anos** com os dois pontos de 90 dias validados — apresentado ao portfolio

**Timeline and owner:** 90 dias → 26/09. **Dono: Henrique Barreto** (a narrativa de portfolio é do líder), com **Ivan/Higo** na prova de produto.

**The first blocker:** **Risco de produto** — reescrita/satélites não ficarem prontos a tempo. **Unlock:** decisão de arquitetura na week 3 + atacar os 5 módulos de maior cloud primeiro + escopar o reajuste só às renovações que o produto alcança (setembro).

---

## Três riscos pré-nomeados

| Risco | Sinal antecipado que vou vigiar |
|---|---|
| **PS compression** — receita de serviços em risco / capacidade de campo estourada pelo lançamento de satélites | Pico de demanda de treinamento presencial que o PS não consegue atender; backlog de visitas/tickets subindo após cada satélite |
| **Code audit gap** — dívida técnica nos 35M de linhas trava a reescrita | Velocidade de reescrita dos 5 módulos abaixo do plano; fatura de cloud **não** caindo na proporção modelada |
| **Competitor wedge** — "bala de prata de produto pra todos" (sinal de pares: Kleber/Denardi/useall) | Concorrente anunciando camada agêntica/IA para municípios antes de nós; movimento de cohort formando consenso |

---

## Accountability

- **Portfolio/Group Leader:** ______________________
- **Data revisada com o portfolio:** ______________________
- **Review 30 dias:** 26/07/2026 · **60 dias:** 26/08/2026 · **90 dias:** 26/09/2026
- **Peer da cohort em contato:** ______________________
- **Ritual semanal (sexta, 30 min):** KRs no painel real, exceções da semana, decisões de promoção na escada de confiança, riscos novos. Fonte da verdade = painel de adoção/horas/cloud.

---

## Beyond 90 days

**Em 6 meses (≈ dez/2026):** reescrita avançando pelos módulos de maior cloud rumo a **−60% de custo**; deflexão da Mia medida em produção desonerando o N1 (Customer Care); 2ª onda de satélites; primeira validação da tese "compliance / receita na veia / 10%" como linha nova.

**Em 12 meses:** reescrita do legado madura (baixa disrupção desktop→novo); **attrition endereçável 7,7% → 3,5%**; reajuste acima do índice consolidado como prática na base estrela; Builder 360 operado por dezenas de pessoas, sem gargalo único.

**Trajetória pro 2× em 3 anos:** margem expandida via COGS-cloud + receita recorrente crescente acima do índice + nova linha de satélites/compliance sobre a base + Builder 360 como capacidade compartilhada no grupo.

---

### Resumo de uma linha
**Em 90 dias: decidir a arquitetura agêntica, shipar 15 satélites adotados no Cluster A com o Builder 360 operado por 20 pessoas (não só pelo Ivan), provar −30% de cloud em 5 módulos, e converter isso em reajuste acima do índice nas 5 prefeituras estrela que renovam em setembro — despressurizando o R&D do gargalo de uma pessoa só.**

---

**As três linhas do líder:**
1. **Mais confiante em entregar:** BUILD — Builder 360 pronto, arquitetura + 5 módulos + 20 certificados ao alcance.
2. **Mais provável de subentregar:** SELL (reajuste acima do índice) — refém do timing do produto contra um calendário de vencimentos imóvel.
3. **Parar de fazer:** rotear toda decisão e construção pelo Ivan — o LTIP amarrando formação de pessoas abre espaço pro plano inteiro.
