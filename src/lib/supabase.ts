import { createClient } from "@supabase/supabase-js";

// Supabase URL e chave pública (anon) fornecida pelo usuário
const SUPABASE_URL = "https://lhwlldxhslsoiwmkdkmm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fnCqmSYquvGcySmiAj_k7Q_Lkqdd_ok";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções auxiliares para persistência do estado da aplicação
export async function fetchState() {
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from("app_state")
    .upsert({ id: "singleton", state_json: state }, { returning: "minimal" });
  if (error) console.error("Supabase: falha ao salvar o estado", error);
}
