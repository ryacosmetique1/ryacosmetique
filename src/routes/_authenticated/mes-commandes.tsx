import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Upload, Eye, Package } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/product-images";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mes-commandes")({
  head: () => ({ meta: [{ title: "Suivi de mes commandes — RYA" }] }),
  component: OrderTrackingPage,
});

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  order_status: string;
  payment_proof: string | null;
  created_at: string;
  order_items: { product_name: string; quantity: number; unit_price: number }[];
}

const STATUS = {
  en_attente: { label: "En attente", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmee: { label: "Validée", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expediee: { label: "Expédiée", icon: Package, cls: "bg-blue-50 text-blue-700 border-blue-200" },
  livree: { label: "Livrée", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  annulee: { label: "Rejetée", icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200" },
} as const;

function OrderTrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  async function reload() {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,total_amount,payment_method,order_status,payment_proof,created_at,order_items(product_name,quantity,unit_price)")
      .order("created_at", { ascending: false });
    const list = (data as Order[]) ?? [];
    setOrders(list);

    // signed URLs for proofs
    const urls: Record<string, string> = {};
    await Promise.all(list.filter((o) => o.payment_proof).map(async (o) => {
      const { data: s } = await supabase.storage.from("payment-proofs").createSignedUrl(o.payment_proof!, 60 * 60);
      if (s?.signedUrl) urls[o.id] = s.signedUrl;
    }));
    setProofUrls(urls);
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
      toast.success("Preuve envoyée — validation sous 24h");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Suivi de mes commandes</h1>
            <p className="mt-2 text-sm text-muted-foreground">Statut en temps réel et preuves de paiement.</p>
          </div>
          <Link to="/mon-compte" className="text-sm text-rose-deep underline">← Mon compte</Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Aucune commande pour le moment.</p>
            <Link to="/boutique" className="mt-4 inline-block rounded-full bg-gradient-rose px-5 py-2 text-sm text-primary-foreground">Découvrir la boutique</Link>
          </div>
        ) : (
          <ul className="mt-10 flex flex-col gap-5">
            {orders.map((o) => {
              const st = STATUS[o.order_status as keyof typeof STATUS] ?? STATUS.en_attente;
              const Icon = st.icon;
              const needsProof = ["wave", "orange_money"].includes(o.payment_method) && !o.payment_proof;
              return (
                <li key={o.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-lg text-rose-deep">{o.order_number}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")} · {o.payment_method.replace("_", " ")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatPrice(Number(o.total_amount))}</div>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${st.cls}`}>
                        <Icon className="h-3 w-3" /> {st.label}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-border text-sm">
                    {o.order_items?.map((it, i) => (
                      <li key={i} className="flex justify-between py-2">
                        <span>{it.product_name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                        <span>{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  {needsProof && (
                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-deep/40 bg-rose-pale/20 px-4 py-4 text-sm text-rose-deep hover:bg-rose-pale/40">
                      <Upload className="h-4 w-4" />
                      {uploading === o.id ? "Envoi…" : "Téléverser ma preuve Wave / Orange Money"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading === o.id} onChange={(e) => e.target.files?.[0] && upload(o.id, e.target.files[0])} />
                    </label>
                  )}

                  {o.payment_proof && proofUrls[o.id] && (
                    <a href={proofUrls[o.id]} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs hover:bg-muted/70">
                      <Eye className="h-3 w-3" /> Voir ma preuve de paiement
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
