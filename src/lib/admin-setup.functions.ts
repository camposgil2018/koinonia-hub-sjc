import { createServerFn } from "@tanstack/react-start";

// Uso interno único: define a senha padrão do administrador principal.
export const resetAdminPassword = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);
  const user = list.users.find((u) => u.email?.toLowerCase() === "gilmar@koinonia.com");
  if (!user) throw new Error("admin não encontrado");
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: "Koinonia@2026",
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const, id: user.id };
});
