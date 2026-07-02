// Seed endpoint — protected by SEED_SECRET.
// (Re)creates a test client account + ensures baseline test products exist.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SEED_SECRET;
        if (!secret) return json({ error: "not_configured" }, 500);
        const provided = request.headers.get("x-seed-secret");
        if (!provided || provided !== secret) return json({ error: "unauthorized" }, 401);

        const clientEmail = process.env.TEST_CLIENT_EMAIL;
        const clientPassword = process.env.TEST_CLIENT_PASSWORD;
        if (!clientEmail || !clientPassword) return json({ error: "missing_test_client_env" }, 500);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // --- 1. Ensure test client user ---
        const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (list.error) return json({ error: list.error.message }, 500);
        const existing = list.data.users.find(
          (u) => u.email?.toLowerCase() === clientEmail.toLowerCase(),
        );
        let clientId: string;
        if (existing) {
          const upd = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password: clientPassword,
            email_confirm: true,
          });
          if (upd.error) return json({ error: upd.error.message }, 500);
          clientId = existing.id;
        } else {
          const cr = await supabaseAdmin.auth.admin.createUser({
            email: clientEmail,
            password: clientPassword,
            email_confirm: true,
            user_metadata: { fullname: "Client E2E", phone: "+221770000000" },
          });
          if (cr.error || !cr.data.user) return json({ error: cr.error?.message || "create_failed" }, 500);
          clientId = cr.data.user.id;
        }
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: clientId, role: "customer" }, { onConflict: "user_id,role" });

        // --- 2. Ensure at least one active test product ---
        const testProducts = [
          {
            slug: "lait-corps-e2e-test",
            name: "Lait Corps E2E Test",
            description: "Produit de test automatisé — ne pas supprimer.",
            category: "lait-corporel",
            price: 12500,
            stock: 999,
            is_active: true,
            is_featured: false,
          },
        ];
        for (const p of testProducts) {
          await supabaseAdmin.from("products").upsert(p, { onConflict: "slug" });
        }

        return json({ ok: true, client_id: clientId, email: clientEmail });
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
