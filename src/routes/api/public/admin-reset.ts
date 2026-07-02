// Admin password reset endpoint — protected by ADMIN_RESET_SECRET.
// Used by CI / Playwright to guarantee a known admin credential.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ADMIN_RESET_SECRET;
        if (!secret) return json({ error: "not_configured" }, 500);
        const provided = request.headers.get("x-admin-reset-secret");
        if (!provided || provided !== secret) return json({ error: "unauthorized" }, 401);

        let payload: { email?: string; password?: string } = {};
        try {
          payload = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const email = payload.email || process.env.TEST_ADMIN_EMAIL;
        const password = payload.password || process.env.TEST_ADMIN_PASSWORD;
        if (!email || !password) return json({ error: "missing_credentials" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Find or create the user.
        const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (list.error) return json({ error: list.error.message }, 500);
        const existing = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        let userId: string;
        if (existing) {
          const upd = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
          });
          if (upd.error) return json({ error: upd.error.message }, 500);
          userId = existing.id;
        } else {
          const cr = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { fullname: "Admin E2E" },
          });
          if (cr.error || !cr.data.user) return json({ error: cr.error?.message || "create_failed" }, 500);
          userId = cr.data.user.id;
        }

        // Ensure admin role.
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

        return json({ ok: true, user_id: userId, email });
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
