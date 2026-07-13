import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface LogApiActionParams {
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Non-blocking audit entry via `log_activity` RPC (same pattern as auth). */
export function logApiAction({ action, entity, entityId, metadata }: LogApiActionParams): void {
  void createSupabaseServerClient().then((supabase) => {
    void supabase
      .rpc("log_activity", {
        p_action: action,
        p_entity: entity,
        p_entity_id: entityId,
        p_metadata: (metadata ?? {}) as Json,
      })
      .then(({ error }) => {
        if (error) console.warn("[api] log_activity skipped:", error.message);
      });
  });
}
