import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/product-images";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/preuve-paiement")({
  head: () => ({ meta: [{ title: "Preuves de paiement — RYA" }] }),
  component: PaymentProofPage,
});

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  order_status: string;
  payment_proof: string | null;
  created_at: string;
}

function PaymentProofPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  async function reload() {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,total_amount,payment_method,order_status,payment_proof,created_at")
      .in("payment_method", ["wave", "orange_money"])
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  }
  useEffect(() => { reload(); }, [user]);

  async function upload(orderId: string, file: File) {
    if (!user) return;
    setUploading(orderId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { error } = await supabase.from("orders").update({ payment_proof: path }).eq("id", orderId);
      if (error) throw error;
      toast.success("Preuve envoyée ! Nous validons votre commande sous 24h.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Mes preuves de paiement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Téléversez ici la capture d'écran du transfert Wave ou Orange Money pour valider votre commande.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-rose-pale/20 p-5 text-sm">
          <div className="font-medium text-rose-deep">Coordonnées de paiement</div>
          <ul className="mt-2 space-y-1 text-foreground/80">
            <li>💸 <strong>Wave :</strong> +221 77 000 00 00 — RYA BUSINESS GROUP</li>
            <li>🟠 <strong>Orange Money :</strong> +221 77 000 00 00 — RYA BUSINESS GROUP</li>
          </ul>
        </div>

        {orders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Aucune commande Wave / Orange Money à régler.</p>
            <Link to="/boutique" className="mt-3 inline-block text-rose-deep underline">Découvrir la boutique</Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-rose-deep">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("fr-FR")} · {o.payment_method === "wave" ? "Wave" : "Orange Money"}
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{formatPrice(Number(o.total_amount))}</div>
                </div>

                {o.payment_proof ? (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Preuve envoyée — en attente de validation
                  </div>
                ) : (
                  <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground hover:border-rose-deep hover:text-rose-deep">
                    <Upload className="h-4 w-4" />
                    {uploading === o.id ? "Envoi en cours…" : "Cliquez pour téléverser votre preuve (image)"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading === o.id}
                      onChange={(e) => e.target.files?.[0] && upload(o.id, e.target.files[0])}
                    />
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
