# Personal Chief of Staff

Um briefing diário automatizado, inspirado no método do Matt Paige
([artigo](https://mattpaige68.substack.com/p/how-i-turned-claude-code-into-my)),
personalizado para a administração do portfólio Volaris (Governança Brasil,
Equiplano, IDS, Useall) e para a missão de **garantir que as respostas que
importam tenham acontecido**.

## Como funciona
1. **Contexto** (`contexto/perfil.md`) — quem você é, empresas, VIPs, prioridades.
2. **Memória** (`memoria.md`) — estado persistente entre os dias (pendências,
   reportes, padrões). O agente lê no início e atualiza no fim de cada execução.
3. **Prompt mestre** (`PROMPT.md`) — o roteiro que o agente segue para gerar o
   briefing.
4. **Briefings** (`briefings/AAAA-MM-DD.md`) — a saída de cada dia, versionada.

## Rodar manualmente (agora, com você presente)
No Claude Code (com os conectores do Microsoft 365 ativos), diga:

> Rode o meu Chief of Staff: siga `chief-of-staff/PROMPT.md` e gere o briefing de hoje.

## Rodar automaticamente (dias úteis de manhã)
O briefing precisa dos conectores do Microsoft 365 autenticados, então ele roda
como uma **Rotina do Claude Code** (não como um GitHub Action anônimo). A Rotina
dispara uma sessão de manhã com o prompt acima, gera o briefing, atualiza a
memória e commita.

> ⚠️ Rotinas em sessão "headless" podem não ter os conectores autenticados
> interativamente. Se o briefing agendado vier avisando que faltou o Microsoft
> 365, rode manualmente ou reautentique o conector. Comece manual por alguns dias
> antes de confiar 100% no agendamento.

## Manutenção
- Edite `contexto/perfil.md` sempre que mudar VIP, empresa, cadência de reporte.
- Deixe a `memoria.md` o agente cuidar — mas revise de vez em quando.
