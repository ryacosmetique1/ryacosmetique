// Fallback push subscribe endpoint (visitors can subscribe even when signed out).
// The client can also insert directly via Supabase RLS; this route exists so
// external tests / server-side flows can register a subscription too.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(10).max(500),
  auth: z.string().min(4).max(200),
  user_agent: z.string().max(500).optional(),
});

export const Route = createFileRoute("/api/public/push-subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("push_subscriptions")
          .upsert(
            { ...parsed.data, user_id: null },
            { onConflict: "endpoint" },
          );
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
