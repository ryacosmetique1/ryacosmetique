import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, resolveProductImage } from "@/lib/product-images";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/commande")({
  head: () => ({ meta: [{ title: "Commander — RYA" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("wave");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("fullname,phone,address")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullname(data.fullname ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
        }
      });
  }, [user]);

  useEffect(() => {
    if (items.length === 0) navigate({ to: "/panier" });
  }, [items.length, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      // save profile for next time
      await supabase.from("profiles").upsert({ id: user.id, fullname, phone, address, email: user.email });

      const { data, error } = await supabase.rpc("place_order", {
        _fullname: fullname,
        _phone: phone,
        _address: address,
        _payment_method: payment,
        _items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      if (error) throw error;
      const orderId = data as string;
      const { data: order } = await supabase.from("orders").select("order_number").eq("id", orderId).single();
      toast.success(`Commande ${order?.order_number} enregistrée !`);
      clear();
      navigate({ to: "/mon-compte" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Finaliser ma commande</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-rose-deep">Coordonnées de livraison</h2>
            <input required value={fullname} onChange={(e) => setFullname(e.target.value)} placeholder="Nom complet" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (WhatsApp de préférence)" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
            <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse complète de livraison" rows={3} className="rounded-md border border-border bg-background px-4 py-3 text-sm" />

            <h2 className="mt-2 font-display text-xl text-rose-deep">Mode de paiement</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { id: "wave", label: "Wave", desc: "Paiement mobile via Wave" },
                { id: "orange_money", label: "Orange Money", desc: "Paiement mobile via Orange Money" },
                { id: "livraison", label: "À la livraison", desc: "Paiement en espèces" },
              ].map((p) => (
                <label key={p.id} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${payment === p.id ? "border-rose-deep bg-rose-pale/30" : "border-border hover:border-gold"}`}>
                  <input type="radio" name="pm" className="hidden" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                  <div className="font-medium text-rose-deep">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </label>
              ))}
            </div>
            {(payment === "wave" || payment === "orange_money") && (
              <div className="rounded-md bg-rose-pale/30 p-3 text-xs text-muted-foreground">
                Envoyez le montant total au <strong>+221 77 000 00 00</strong> ({payment === "wave" ? "Wave" : "Orange Money"}) puis confirmez votre commande. Nous vous contactons sous 24h.
              </div>
            )}

            <button disabled={busy} className="mt-2 rounded-full bg-gradient-rose px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60">
              {busy ? "Envoi…" : `Confirmer la commande — ${formatPrice(total)}`}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-rose-deep">Votre panier</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-3">
                  <img src={resolveProductImage(i.slug, i.image_url)} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="text-foreground">{i.name}</div>
                    <div className="text-xs text-muted-foreground">×{i.quantity}</div>
                  </div>
                  <div className="text-sm">{formatPrice(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-rose-deep">{formatPrice(total)}</span></div>
            </div>
            <Link to="/panier" className="mt-4 block text-center text-xs text-muted-foreground hover:text-rose-deep">Modifier le panier</Link>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
