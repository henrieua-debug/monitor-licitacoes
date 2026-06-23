# MICRO-FEATURE 01: PAINEL DE CONFORMIDADE TCE

## Visão Geral

Um **dashboard one-page visual** que mostra ao Prefeito e Secretário de Fazenda o status de conformidade regulatória em tempo real. Não é análise — é **situação atual** (sim/não, prazo ou atraso).

**Duração esperada:** 2-3 semanas  
**Complexidade:** Baixa-média  
**Linguagem:** Python/Django backend + React frontend simples  
**Prioridade:** ALTA (agrada Prefeito, ROI imediato)

---

## O Problema Que Resolve

### Dor do Prefeito
- "Estou em dia com o TC ou vou levar rejeição de contas?"
- Não quer surpresa em auditoria
- Quer prova de que "administração está organizada"

### Dor do Sec Fazenda
- "Qual é meu próximo deadline regulatório?"
- "Onde estou em cada obrigação legal?"
- Precisa de dashboard pra reunir dados, não Excel manual

### Solução
**Dashboard que responde em 30 segundos:**
- ✅ Estou em dia com SIAFIC?
- ✅ Estou em dia com PNCP?
- ✅ Próximo prazo RGF/RREO é quando?
- ✅ Estou respeitando LRF?

---

## Escopo Detalhado

### ✅ INCLUI

#### 1. Cards de Status (5 cards principais)

**Card 1 — SIAFIC**
```
┌─────────────────────────┐
│ ✅ SIAFIC - EM DIA      │
├─────────────────────────┤
│ Status: Conformidade ok │
│ Última atualização:     │
│ 22/06/2026 às 14:30     │
│                         │
│ Próximo prazo: N/A      │
│ (SIAFIC é contínuo)     │
│                         │
│ [Ver detalhes →]        │
└─────────────────────────┘
```

**Card 2 — PNCP (Publicações)**
```
┌─────────────────────────┐
│ ✅ PNCP - EM DIA        │
├─────────────────────────┤
│ Licitações publicadas:  │
│ 47 contratos em 2026    │
│                         │
│ Última publicação:      │
│ 21/06/2026              │
│                         │
│ [Ver últimas 10 →]      │
└─────────────────────────┘
```

**Card 3 — RGF/RREO**
```
┌─────────────────────────┐
│ ⚠️ RGF - ATENÇÃO        │
├─────────────────────────┤
│ Próximo prazo:          │
│ 31/07/2026 (38 dias)    │
│                         │
│ Status: Não começado    │
│ Completude: 0%          │
│                         │
│ [Iniciar →]             │
└─────────────────────────┘
```

**Card 4 — LRF**
```
┌─────────────────────────┐
│ ✅ LRF - OK             │
├─────────────────────────┤
│ Limite de pessoal:      │
│ 52% (limite: 54%)       │
│                         │
│ Arrecadação própria:    │
│ 85% da meta             │
│                         │
│ [Detalhes →]            │
└─────────────────────────┘
```

**Card 5 — Resumo Geral**
```
┌─────────────────────────┐
│ 📊 SCORE DE             │
│ CONFORMIDADE            │
├─────────────────────────┤
│ 95% conformidade geral  │
│                         │
│ ✅ 4 itens em dia       │
│ ⚠️ 1 item com atenção   │
│ ❌ 0 itens atrasados    │
│                         │
│ Última verificação:     │
│ Hoje às 09:15           │
└─────────────────────────┘
```

---

#### 2. Seção de Prazos (Próximos 90 dias)

Timeline visual:
```
JUN/2026          JUL/2026          AGO/2026
   |                 |                 |
   ●━━━━━━━━━━━●━━━━━━━━━━━●━━━━━━━━━━━●
                     
                RGF: 31/jul (38d)
                RREO: 30/set (100d)
```

Tabela (ordenada por urgência):
| Obrigação | Prazo | Dias restantes | Status | Ação |
|---|---|---|---|---|
| RGF trimestral | 31/jul/2026 | 38 | ⚠️ Não começado | [Iniciar] |
| RREO | 30/set/2026 | 100 | ✅ Ok | - |
| PNCP (atualização) | Contínuo | - | ✅ Em dia | - |
| SIAFIC | Contínuo | - | ✅ Em dia | - |

---

#### 3. Seção de Histórico (opcional no MVP, mas planejado)

Gráfico de trend últimos 6 meses:
- Conformidade geral (%)
- Evolução de cada obrigação

---

#### 4. Botões de Ação

- **[Gerar RGF agora]** — leva pra tela de RGF
- **[Verificar SIAFIC]** — abre modal com checklist SIAFIC
- **[Publicar no PNCP]** — leva pra tela de publicação
- **[Baixar relatório PDF]** — gera report imprimível

---

### ❌ NÃO INCLUI (escopo futuro)

- ❌ Automação de geração de relatórios (RGF/RREO ainda manual)
- ❌ Integração com TC (apenas mostra dados internos)
- ❌ Alertas via email/SMS (somente dashboard visual)
- ❌ Previsão de "quando vai falhar" (IA preditiva)
- ❌ Customização de métricas por município (padrão fixo)

---

## Arquitetura Técnica

### Backend (Python/Django)

#### Endpoints necessários:

```python
GET /api/compliance/dashboard/
# Retorna: status SIAFIC, PNCP, RGF/RREO, LRF

GET /api/compliance/siafic/
# Retorna: última data atualização, validação

GET /api/compliance/pncp/
# Retorna: últimas 10 licitações publicadas

GET /api/compliance/rgf-rreo/
# Retorna: próximos prazos, % completude

GET /api/compliance/lrf/
# Retorna: limites (pessoal, arrecadação), % usado

GET /api/compliance/timeline/
# Retorna: prazos próximos 90 dias
```

#### Lógica de validação:

```python
def check_siafic_compliance():
    """Verifica se últimas transações estão no SIAFIC"""
    last_update = SIAFIC.objects.latest('data_atualizacao')
    days_since = (today() - last_update.date).days
    
    if days_since <= 1:
        return {"status": "ok", "message": "Em dia"}
    elif days_since <= 7:
        return {"status": "warning", "message": f"Atualizado há {days_since} dias"}
    else:
        return {"status": "error", "message": f"Atraso de {days_since} dias"}

def check_rgf_deadline():
    """Verifica prazo de RGF trimestral"""
    # Lógica: próximo RGF = próximo fim de trimestre
    # RGF Q2: 30/jun, RGF Q3: 30/set, etc
    next_deadline = calculate_next_rgf_deadline()
    days_left = (next_deadline - today()).days
    
    if days_left > 30:
        return {"status": "ok", "days": days_left}
    elif days_left > 10:
        return {"status": "warning", "days": days_left}
    else:
        return {"status": "error", "days": days_left}
```

### Frontend (React)

#### Componentes:

- **Dashboard Container** — layout principal (grid 2x3 cards)
- **StatusCard** — componente reutilizável pra cada card
- **TimelineChart** — timeline visual prazos
- **ActionButton** — botões que levam a fluxos específicos

#### Estado (Redux ou Context):

```javascript
{
  compliance: {
    siafic: { status: "ok", lastUpdate: "2026-06-22T14:30:00" },
    pncp: { status: "ok", lastPublish: "2026-06-21", count: 47 },
    rgf: { status: "warning", daysLeft: 38, completude: 0 },
    lrf: { status: "ok", pessoal: 52, limite: 54 },
    score: 95,
    loading: false,
    error: null
  }
}
```

---

## Dados Necessários

### Onde vêm os dados?

| Métrica | Origem | Atualização |
|---|---|---|
| SIAFIC | Banco de dados SIAFIC (Tesouro) | Daily job (01:00 AM) |
| PNCP | API PNCP (Portal Nacional) | Daily job (02:00 AM) |
| RGF/RREO | Base local (preenchimento manual ou integração TCE) | Manual ou scheduled |
| LRF | Base local (execução orçamentária) | Real-time (a cada transação) |

### Processamento:

```python
# Scheduled task (Celery/APScheduler)
@periodic_task(run_every=crontab(hour=1, minute=0))
def refresh_compliance_dashboard():
    """Atualiza dashboard a cada madrugada"""
    refresh_siafic_status()
    refresh_pncp_publications()
    refresh_rgf_deadline()
    refresh_lrf_metrics()
    cache.set('compliance_dashboard', data, timeout=86400)
```

---

## Prototipagem (MVP - 2-3 semanas)

### Fase 1: Backend (1 semana)

```
[x] Criar endpoints /api/compliance/*
[x] Implementar lógica de validação
[x] Popular com dados de teste
[x] Testar via Postman
```

### Fase 2: Frontend (1 semana)

```
[x] Layout dashboard (5 cards + timeline)
[x] Integrar com backend
[x] Responsividade mobile
[x] Cores/visual (✅ verde, ⚠️ amarelo, ❌ vermelho)
```

### Fase 3: QA + Deploy (3-4 dias)

```
[x] Testar com dados reais de 2-3 prefeituras
[x] Validar prazos (RGF/RREO corretos?)
[x] Deploy em staging
[x] Feedback de usuário
```

### Beta Testing:

- 2-3 Prefeitos/Sec Fazenda testam
- Coletam feedback: "O que não está claro?"
- Ajustes rápidos
- Go-live

---

## Métricas de Sucesso

### Curto prazo (2-4 semanas pós-launch)

- [ ] Dashboard acessado por 80% dos Prefeitos/Sec Fazenda
- [ ] Tempo médio no dashboard > 2 minutos (significa que estão lendo)
- [ ] 0 bugs críticos reportados
- [ ] Feedback: "Agora sei se estou em dia com TC"

### Médio prazo (1-3 meses)

- [ ] Redução em tickets de suporte "estou em dia com TC?" (baseline: X, target: -30%)
- [ ] Aumento em renovações (Prefeito diz: "Vi dashboard, achei bom, renova")
- [ ] NPS do painel > 7/10

### Longo prazo (6+ meses)

- [ ] Retenção de clientes: antes do painel: churn X%, depois: churn -15%
- [ ] Expansão: clientes pedem "similar pra saúde", "pra educação", etc

---

## ROI Esperado

### Custos
- Desenvolvimento: ~160 horas eng = R$80k (estimado)
- Infra/hosting: ~R$500/mês

### Benefícios
- **Retenção:** Se reduz 1 churn por ano (vale R$2M em ARR), ROI = 25x
- **Venda:** Se Prefeito usa painel e renova contrato, impacto = +R$100k-200k por renovação

### Timeline de ROI
- Custo: R$80k one-time
- Benefício: R$200k (1 cliente que renova por causa do painel)
- Break-even: 3-4 meses

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Dados desatualizados (dashboard mostra "ok" mas TC rejeita) | Validação de dados real-time, sync com Tesouro/PNCP |
| Prefeito não acessa (prefere Sec Fazenda ver sozinho) | Acesso dual (Prefeito + Sec Fazenda), notificação para Prefeito |
| Conformidade é complexa demais pra 5 cards | MVP com 5 items, depois expandir pra 10+ |
| Integração com PNCP/Tesouro é lenta | Começar com dados locais, depois integração |

---

## Próximos Passos

1. **Aprovação:** Você valida escopo + timeline
2. **Design:** UX designer faz mockups (2-3 dias)
3. **Implementação:** Backend + frontend paralelo (1 semana)
4. **Beta:** 2-3 prefeituras testam (3-4 dias)
5. **Ajustes:** Feedback → deploy (1 semana)
6. **Go-live:** Comunicado para base inteira

---

## Conexão com Legacy Exit

Este painel é **prototipo do que será em SaaS:**
- No futuro (2027): dashboard será real-time + IA
- Hoje: prova que "dashboards funcionam" com prefeitura
- Comprável: tempo enquanto Legacy Exit acontece
- Diferencial: Betha/IPM não têm nada tão visual/específico

---

**Owner recomendado:** Product Manager + 1 Senior Eng (backend) + 1 Eng (frontend)  
**Próxima reunião:** Alinhamento de mockups (segunda-feira)
