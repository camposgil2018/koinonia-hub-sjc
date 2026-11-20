import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  filterSharedStateForMember,
  mergeMemberSharedState,
  prepareSharedState,
  type SharedState,
} from "./shared-state-access";

const stateInput = z.object({
  state: z
    .record(z.string(), z.unknown())
    .refine((value) => JSON.stringify(value).length <= 4_000_000),
});

export const getSharedState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isModerator }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "moderator" }),
    ]);

    if (isAdmin || isModerator) {
      const { data, error } = await context.supabase
        .from("app_state")
        .select("state_json")
        .eq("id", "singleton")
        .maybeSingle();
      if (error) {
        console.error("Shared state read failed");
        throw new Error("Não foi possível carregar os dados compartilhados");
      }
      return data ? (prepareSharedState(data.state_json as SharedState) as Json) : null;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_state")
      .select("state_json")
      .eq("id", "singleton")
      .maybeSingle();
    if (error) {
      console.error("Filtered shared state read failed");
      throw new Error("Não foi possível carregar os dados compartilhados");
    }
    return data
      ? (filterSharedStateForMember(data.state_json as SharedState, context.userId) as Json)
      : null;
  });

export const saveSharedState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(stateInput)
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isModerator }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "moderator" }),
    ]);
    const submitted = prepareSharedState(data.state);

    if (isAdmin || isModerator) {
      const { error } = await context.supabase.from("app_state").upsert(
        {
          id: "singleton",
          state_json: submitted as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) {
        console.error("Leadership shared state write failed");
        throw new Error("Não foi possível salvar os dados compartilhados");
      }
      return { ok: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current, error: readError } = await supabaseAdmin
      .from("app_state")
      .select("state_json")
      .eq("id", "singleton")
      .maybeSingle();
    if (readError || !current) {
      console.error("Member shared state source read failed");
      throw new Error("Não foi possível salvar os dados compartilhados");
    }

    let merged: SharedState;
    try {
      merged = mergeMemberSharedState(current.state_json as SharedState, submitted, context.userId);
    } catch {
      throw new Error("A alteração contém dados inválidos ou fora do seu acesso");
    }

    const { error } = await supabaseAdmin
      .from("app_state")
      .update({ state_json: merged as never, updated_at: new Date().toISOString() })
      .eq("id", "singleton");
    if (error) {
      console.error("Member shared state write failed");
      throw new Error("Não foi possível salvar os dados compartilhados");
    }
    return { ok: true };
  });
