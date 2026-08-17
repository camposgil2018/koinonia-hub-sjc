# Refatorar o login (autenticação real) e corrigir o banco

## Por que o acesso não está funcionando hoje

Diagnóstico confirmado lendo o código e consultando o banco:

1. **O login é falso.** `auth.login` em `src/lib/church-store.ts` só compara e-mail/senha contra uma lista de usuários guardada no estado local (senhas em texto puro, ex.: `gilmar@koinonia.com` / `admin123`). Nenhuma chamada de autenticação real acontece.
2. **O app aponta para o projeto errado.** `src/lib/supabase.ts` cria um cliente próprio usando `VITE_SUPABASE_ANON_KEY`, variável que **não existe** no projeto. Ele cai no fallback com URL/chave de outro projeto antigo (`lhwlldxhslsoiwmkdkmm`), então toda leitura/gravação falha silenciosamente.
3. **Mesmo com a chave certa, gravar falharia.** A tabela `app_state` só permite leitura/escrita para usuários `authenticated`. Como ninguém está autenticado de verdade, nada é salvo — cada dispositivo/navegador fica com uma cópia isolada no `localStorage`, e às vezes o estado remoto sobrescreve o local, apagando o usuário logado.
4. **O banco já está pronto e é ignorado.** Existem 5 usuários reais em Auth, 5 `profiles` e a tabela `user_roles`, com **gilmar@koinonia.com já marcado como admin**. O app nunca usa nada disso.

## O que vou fazer

### Autenticação real
- Remover o login local (senhas no estado) e usar a autenticação do backend (Lovable Cloud).
- Tela de login/cadastro refeita: entrar com e-mail e senha reais, cadastro criando conta de verdade (perfil e papel `member` são criados automaticamente pelo gatilho já existente no banco).
- "Esqueci minha senha": passa a enviar e-mail real de redefinição, com nova página `/reset-password` para definir a nova senha (sai a senha temporária exibida na tela).
- Sessão persistente: sair e voltar mantém o usuário logado; botão Sair encerra a sessão de verdade.

### Admin padrão
- Admin: **gilmar@koinonia.com**, com papel `admin` já gravado em `user_roles`.
- Vou redefinir a senha desse admin para uma senha padrão e informá-la a você no chat, para que você entre e a troque no perfil.
- Papel de administrador passa a vir de `user_roles` (não mais de um campo no estado local), então promover/rebaixar membros na aba Membros grava no banco.

### Banco de dados
- Apontar o app para o projeto correto usando o cliente oficial gerado (`@/integrations/supabase/client`) e apagar o cliente com chaves antigas.
- Perfis (nome, telefone, ministérios, cor) passam a ser lidos/gravados na tabela `profiles`; a lista de membros da aba Membros vem do banco.
- O restante dos dados (escalas, agenda, avisos, orações, visitantes, devocionais) continua no registro único `app_state`, que volta a salvar/carregar corretamente agora que existe sessão autenticada — dados passam a ser compartilhados entre celular e desktop.
- Migração de dados: os dados atuais já gravados em `app_state` são preservados; apenas a lista de usuários deixa de ficar lá.

### Detalhes técnicos
- `src/lib/supabase.ts` removido; usar `supabase` de `@/integrations/supabase/client`.
- `church-store.ts`: tirar `password` de `User`, tirar `currentUserId` do estado sincronizado, e derivar o usuário atual da sessão + `profiles` + `user_roles`.
- Gate de rota: mover o app para `/_authenticated` com a tela pública `/auth`, e listener único de `onAuthStateChange` no root.
- Sem alteração de schema necessária (tabelas, políticas e gatilho já existem); apenas ajuste de senha do admin e, se preciso, `GRANT`/política para escrita de papéis por admin.
