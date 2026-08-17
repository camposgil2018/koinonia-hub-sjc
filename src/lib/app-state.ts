import { supabase } from "@/integrations/supabase/client";

// Estado compartilhado do app (escalas, agenda, avisos, orações, visitantes, devocionais).
// Usuários NÃO ficam aqui — eles vêm de `profiles` + `user_roles`.
export async function fetchState() {
  const { data, error } = await supabase
    .from("app_state")
    .select("state_json")
    .eq("id", "singleton")
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn("Backend: falha ao buscar o estado", error.message);
    return null;
  }
  return data.state_json as Record<string, unknown>;
}

export async function upsertState(state: Record<string, unknown>) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return; // sem sessão não há permissão de escrita
  const { error } = await supabase
    .from("app_state")
    .upsert({ id: "singleton", state_json: state as never }, { onConflict: "id" });
  if (error) console.error("Backend: falha ao salvar o estado", error.message);
}
