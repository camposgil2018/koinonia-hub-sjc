# Arquivar avisos e corrigir exclusão de membros

## Implementação

- Separar automaticamente os avisos pela data: o mural mostra os atuais e uma área de arquivo mantém os vencidos acessíveis.
- Permitir que a liderança consulte, edite e exclua avisos arquivados, sem criar uma rotina agendada desnecessária.
- Corrigir a exclusão de membros no fluxo autenticado, garantindo sessão válida, autorização administrativa e atualização da lista após a remoção.
- Validar os dois fluxos no aplicativo e concluir as tarefas pendentes do roadmap.

## Detalhes técnicos

- O arquivamento será derivado da data do aviso no momento da leitura, evitando gravações recorrentes e custos de uma tarefa agendada.
- A exclusão continuará protegida no servidor e não permitirá que o administrador remova a própria conta.