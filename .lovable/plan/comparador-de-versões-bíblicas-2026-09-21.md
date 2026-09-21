# Comparador de versões bíblicas

## Alterações
- Tornar cada versículo da leitura selecionável por toque ou clique.
- Ao selecionar um versículo, abrir um comparador com a mesma referência nas versões bíblicas escolhidas.
- Permitir marcar ou desmarcar NVI, ARA, NAA, ARC, ACF e KJA, mantendo a versão atual selecionada inicialmente.
- Exibir cada tradução com sua sigla, nome completo e texto do versículo para facilitar a comparação.
- Manter livro, capítulo, versículo e versões escolhidas enquanto o comparador estiver aberto.
- Incluir estados claros de carregamento, falha e texto indisponível sem interromper a leitura do capítulo.
- Adaptar a comparação para celular, com versões empilhadas, e para telas maiores, com leitura lado a lado quando houver espaço.

## Detalhes técnicos
- Reutilizar a API bíblica já integrada e buscar o mesmo livro, capítulo e número de versículo para cada tradução selecionada.
- Fazer as consultas em paralelo e ignorar respostas antigas caso o usuário troque rapidamente a seleção.
- Não será necessário criar ou alterar dados no banco.

## Validação
- Comparar versículos dos dois testamentos nas seis versões disponíveis.
- Confirmar que adicionar ou remover versões atualiza apenas o comparador.
- Verificar abertura, fechamento, carregamento e legibilidade no celular e no computador.
- Confirmar que a leitura normal, busca, troca de livro, capítulo e versão continuam funcionando.
