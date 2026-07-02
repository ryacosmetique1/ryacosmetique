// Admin-only server function: broadcast a "new product" push notification.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const input = z.object({
  product_id: z.string().uuid().optional(),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(300).optional(),
  url: z.string().max(500).optional(),
  image: z.string().url().max(500).optional(),
});

export const notifyNewProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let payload = {
      title: data.title || "Nouveau produit RYA ✨",
      body: data.body || "Découvrez la nouveauté qui vient d'arriver dans la boutique.",
      url: data.url || "/boutique",
      image: data.image,
      tag: "rya-new-product",
    };

    if (data.product_id) {
      const { data: p } = await supabase
        .from("products")
        .select("name,slug,image_url,description")
        .eq("id", data.product_id)
        .maybeSingle();
      if (p) {
        payload = {
          ...payload,
          title: data.title || `Nouveauté : ${p.name}`,
          body: data.body || (p.description ? p.description.slice(0, 140) : payload.body),
          url: data.url || `/produit/${p.slug}`,
          image: data.image || p.image_url || undefined,
        };
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth");
    if (error) throw new Error(error.message);

    const { sendPushToAll } = await import("@/lib/webpush.server");
    const result = await sendPushToAll(subs || [], payload);

    if (result.goneEndpoints.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", result.goneEndpoints);
    }
    return { total: subs?.length || 0, ...result };
  });
