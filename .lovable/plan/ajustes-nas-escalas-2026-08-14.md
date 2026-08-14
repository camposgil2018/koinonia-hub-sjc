# Ajustes nas Escalas

## 1. Indisponibilidade bloqueia escalação

Hoje o voluntário indisponível já aparece desabilitado no seletor, mas o bloqueio pode ser burlado quando a data é escolhida/alterada depois de incluir voluntários.

Mudanças em `src/components/church/Schedules.tsx` (diálogo de nova escala):

- Exigir a data antes de liberar o bloco "Adicionar voluntário" (campos desabilitados enquanto não houver data).
- Ao alterar a data, revalidar a lista de escalações já adicionadas: quem ficar indisponível na nova data é removido automaticamente, com aviso na tela.
- Manter o bloqueio no salvamento: se qualquer voluntário estiver dentro de um período de indisponibilidade, a escala não é salva.
- Deixar o alerta visual mais claro no cartão da escala (voluntário marcado como indisponível).

## 2. Confirmação de presença some após responder

No cartão da escala, o bloco "Confirmar sua presença nesta escala" com os botões Confirmar/Recusar hoje aparece sempre.

- Passa a aparecer somente enquanto a escalação do usuário estiver **pendente**.
- Depois de confirmar ou recusar, o bloco desaparece e fica apenas o selo de status (Confirmado / Recusado).
- Um link discreto "alterar resposta" reexibe os botões, caso o usuário mude de ideia.

## Detalhes técnicos

- Arquivo único: `src/components/church/Schedules.tsx`.
- Regra de indisponibilidade continua usando `isUserUnavailable` de `src/lib/church-store.ts`; nenhuma mudança de modelo de dados.
- Visibilidade dos botões controlada por `myAssignments.every(a => a.status && a.status !== "pending")` mais um estado local de "reabrir resposta".
