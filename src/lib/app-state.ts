import { supabase } from "@/integrations/supabase/client";
import { getSharedState, saveSharedState } from "./app-state.functions";

// Estado compartilhado do app (escalas, agenda, avisos, orações, visitantes, devocionais).
// Usuários NÃO ficam aqui — eles vêm de `profiles` + `user_roles`.
// O backend filtra os dados de membros e valida cada alteração permitida.
export async function fetchState() {
  try {
    return await getSharedState();
  } catch (error) {
    console.warn(
      "Backend: falha ao buscar o estado",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return null;
  }
}

export async function upsertState(state: Record<string, unknown>) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return; // sem sessão não há permissão de escrita
  try {
    await saveSharedState({ data: { state } });
  } catch (error) {
    console.error(
      "Backend: falha ao salvar o estado",
      error instanceof Error ? error.message : "erro desconhecido",
    );
  }
}
