import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export { supabase };

const dataClient = supabase as unknown as SupabaseClient;

// Funções auxiliares para persistência do estado da aplicação
export async function fetchState() {
  const { data, error } = await dataClient
    .from("app_state")
    .select("state_json")
    .eq("id", "singleton")
    .single();
  if (error || !data) {
    console.warn("Supabase: falha ao buscar o estado, usando localStorage", error);
    return null;
  }
  return data.state_json as any;
}

export async function upsertState(state: any) {
  // Só persiste quando há sessão ativa (RLS exige usuário autenticado)
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await dataClient
    .from("app_state")
    .upsert({ id: "singleton", state_json: state }, { onConflict: "id" });
  if (error) console.error("Supabase: falha ao salvar o estado", error);
}
