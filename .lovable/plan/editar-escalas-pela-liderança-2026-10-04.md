# Editar Escalas pela Liderança

## Implementação

- Adicionar a ação **Editar escala** nos cartões futuros para o perfil de Liderança.
- Permitir alterar título, data, horário, ministério, função e voluntários já escalados.
- Permitir adicionar e remover participantes dentro da edição, preservando os status existentes dos que permanecerem.
- Revalidar indisponibilidades quando a data ou os participantes forem alterados e impedir o salvamento de conflitos.
- Manter a exclusão de escalas restrita ao administrador e as escalas arquivadas somente para consulta.

## Validação

- Confirmar que uma escala editada é atualizada na lista e permanece salva.
- Confirmar que voluntários indisponíveis não podem ser incluídos.
- Verificar a apresentação e o funcionamento em telas grandes e no celular.

## Detalhes técnicos

- A mudança ficará concentrada na tela de Escalas e reutilizará o estado persistente atual.
- Neste aplicativo, o perfil **Liderança** corresponde ao papel administrativo; o perfil **Equipe** continuará sem edição completa.