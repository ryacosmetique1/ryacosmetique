import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/product-images";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mon-compte")({
  head: () => ({ meta: [{ title: "Mon compte — RYA" }] }),
  component: AccountPage,
});

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  order_status: string;
  created_at: string;
  order_items: { product_name: string; quantity: number; unit_price: number }[];
}

function AccountPage() {
  const { user, signOut } = useAuth();
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("fullname,phone,address").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setFullname(data.fullname ?? ""); setPhone(data.phone ?? ""); setAddress(data.address ?? ""); }
    });
    supabase.from("orders").select("id,order_number,total_amount,payment_method,order_status,created_at,order_items(product_name,quantity,unit_price)").order("created_at", { ascending: false }).then(({ data }) => {
      setOrders((data as Order[]) ?? []);
    });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, fullname, phone, address });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profil enregistré");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Mon compte</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-sm text-muted-foreground underline hover:text-rose-deep">Déconnexion</button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
          <form onSubmit={save} className="flex h-fit flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-rose-deep">Mon profil</h2>
            <input value={fullname} onChange={(e) => setFullname(e.target.value)} placeholder="Nom complet" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse" rows={3} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button disabled={saving} className="rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground">{saving ? "…" : "Enregistrer"}</button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-rose-deep">Historique des commandes</h2>
            {orders.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aucune commande pour le moment. <Link to="/boutique" className="text-rose-deep underline">Découvrir la boutique</Link></p>
            ) : (
              <ul className="mt-6 flex flex-col gap-4">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-rose-deep">{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-rose-pale/40 px-3 py-1 text-xs capitalize text-rose-deep">{o.order_status.replace("_", " ")}</span>
                        <span className="font-semibold">{formatPrice(Number(o.total_amount))}</span>
                      </div>
                    </div>
                    <ul className="mt-3 text-sm text-muted-foreground">
                      {o.order_items?.map((it, k) => (
                        <li key={k}>× {it.quantity} {it.product_name} <span className="text-xs">— {formatPrice(Number(it.unit_price))}</span></li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
