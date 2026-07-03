import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, categoriesList } from "@/lib/product-images";
import { Pencil, Trash2, Plus, X, Bell } from "lucide-react";
import { toast } from "sonner";
import { notifyNewProduct } from "@/lib/notify.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administration — RYA" }] }),
  component: AdminPage,
});

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  fullname: string;
  phone: string;
  address: string;
  total_amount: number;
  payment_method: string;
  order_status: string;
  created_at: string;
  order_items: { product_name: string; quantity: number; unit_price: number }[];
}

interface CustomerRow { id: string; fullname: string | null; email: string | null; phone: string | null; created_at: string }
interface PromoRow { id: string; code: string; description: string | null; discount_percent: number; active: boolean }
interface ReviewRow { id: string; customer_name: string; comment: string; rating: number; approved: boolean; created_at: string; product_id: string | null; products?: { name: string } | null }
interface PushSubRow { id: string; endpoint: string; user_id: string | null; user_agent: string | null; created_at: string; profiles?: { fullname: string | null; email: string | null } | null }

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "customers" | "promotions" | "reviews" | "push">("dashboard");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [promotions, setPromotions] = useState<PromoRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [pushSubs, setPushSubs] = useState<PushSubRow[]>([]);
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Accès réservé à l'administrateur");
      navigate({ to: "/mon-compte" });
    }
  }, [loading, isAdmin, navigate]);

  async function reload() {
    const [p, o, c, pr, rv, ps] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*,order_items(product_name,quantity,unit_price)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,fullname,email,phone,created_at").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").order("created_at", { ascending: false }),
      supabase.from("testimonials").select("id,customer_name,comment,rating,approved,created_at,product_id,products(name)").order("created_at", { ascending: false }),
      supabase.from("push_subscriptions").select("id,endpoint,user_id,user_agent,created_at").order("created_at", { ascending: false }),
    ]);
    const profs = (c.data as CustomerRow[]) ?? [];
    const profMap = new Map(profs.map((x) => [x.id, x]));
    setProducts((p.data as ProductRow[]) ?? []);
    setOrders((o.data as OrderRow[]) ?? []);
    setCustomers(profs);
    setPromotions((pr.data as PromoRow[]) ?? []);
    setReviews((rv.data as ReviewRow[]) ?? []);
    setPushSubs(((ps.data as Omit<PushSubRow, "profiles">[]) ?? []).map((s) => ({
      ...s,
      profiles: s.user_id ? (profMap.get(s.user_id) ? { fullname: profMap.get(s.user_id)!.fullname, email: profMap.get(s.user_id)!.email } : null) : null,
    })));
  }
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  async function moderateReview(id: string, approved: boolean) {
    const { error } = await supabase.from("testimonials").update({ approved }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Avis publié" : "Avis masqué");
    reload();
  }
  async function deleteReview(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  }

  const stats = useMemo(() => {
    const revenue = orders.reduce((a, o) => a + Number(o.total_amount), 0);
    const sales: Record<string, number> = {};
    orders.forEach((o) => o.order_items?.forEach((it) => { sales[it.product_name] = (sales[it.product_name] ?? 0) + it.quantity; }));
    const top = Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { revenue, top };
  }, [orders]);

  const notifyFn = useServerFn(notifyNewProduct);
  async function notifyProduct(id: string, name: string) {
    if (!confirm(`Envoyer une notification push aux abonnés pour "${name}" ?`)) return;
    try {
      const r = (await notifyFn({ data: { product_id: id } })) as { sent: number; failed: number; total: number };
      toast.success(`Push envoyé : ${r.sent}/${r.total} (${r.failed} échecs)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur envoi push");
    }
  }

  async function saveProduct(p: Partial<ProductRow>) {
    if (!p.name || !p.slug || !p.category) return toast.error("Champs requis manquants");
    const payload = {
      slug: p.slug, name: p.name, description: p.description ?? null, category: p.category,
      price: Number(p.price ?? 0), stock: Number(p.stock ?? 0), image_url: p.image_url ?? null,
      is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
    };
    const { error } = p.id ? await supabase.from("products").update(payload).eq("id", p.id) : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Produit enregistré"); setEditing(null); reload();
  }
  async function deleteProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  }
  async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  }
  async function savePromotion(p: Partial<PromoRow>) {
    if (!p.code) return;
    const payload = { code: p.code, description: p.description ?? null, discount_percent: Number(p.discount_percent ?? 10), active: p.active ?? true };
    const { error } = p.id ? await supabase.from("promotions").update(payload).eq("id", p.id) : await supabase.from("promotions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Promotion enregistrée"); reload();
  }

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Gérez le catalogue, les commandes, les clients et les promotions.</p>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {([
            ["dashboard", "Vue d'ensemble"],
            ["products", "Produits"],
            ["orders", "Commandes"],
            ["customers", "Clients"],
            ["promotions", "Promotions"],
            ["reviews", `Avis${reviews.filter(r=>!r.approved).length ? ` (${reviews.filter(r=>!r.approved).length})` : ""}`],
            ["push", `Push (${pushSubs.length})`],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as typeof tab)} className={`px-4 py-2 text-sm transition ${tab === k ? "border-b-2 border-rose-deep text-rose-deep" : "text-muted-foreground hover:text-rose-deep"}`}>{l}</button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Stat label="Produits" value={products.length} />
            <Stat label="Commandes" value={orders.length} />
            <Stat label="Clients" value={customers.length} />
            <Stat label="Chiffre d'affaires" value={formatPrice(stats.revenue)} />
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg text-rose-deep">Produits les plus vendus</h3>
              {stats.top.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Pas encore de ventes.</p> : (
                <ul className="mt-3 space-y-2 text-sm">{stats.top.map(([n, q]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="font-medium">×{q}</span></li>)}</ul>
              )}
            </div>
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg text-rose-deep">Clients récents</h3>
              <ul className="mt-3 space-y-2 text-sm">{customers.slice(0, 5).map((c) => <li key={c.id} className="flex justify-between"><span>{c.fullname || c.email}</span><span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span></li>)}</ul>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-8">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setEditing({ is_active: true })} className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Nouveau produit</button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-3">Nom</th><th className="p-3">Catégorie</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{formatPrice(Number(p.price))}</td>
                      <td className="p-3"><span className={p.stock <= 5 ? "text-rose-deep" : ""}>{p.stock}</span></td>
                      <td className="p-3 text-xs">{p.is_active ? "Actif" : "Masqué"}{p.is_featured ? " · Vedette" : ""}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setEditing(p)} className="p-1 hover:text-rose-deep" title="Modifier"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => notifyProduct(p.id, p.name)} className="p-1 hover:text-rose-deep" title="Envoyer une notif push"><Bell className="h-4 w-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1 hover:text-rose-deep" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-3">N°</th><th className="p-3">Client</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Paiement</th><th className="p-3">Statut</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border align-top">
                    <td className="p-3 font-medium text-rose-deep">{o.order_number}</td>
                    <td className="p-3"><div>{o.fullname}</div><div className="text-xs text-muted-foreground">{o.phone}</div><div className="text-xs text-muted-foreground">{o.address}</div></td>
                    <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                    <td className="p-3">{formatPrice(Number(o.total_amount))}</td>
                    <td className="p-3 text-xs">{o.payment_method}</td>
                    <td className="p-3">
                      <select value={o.order_status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
                        <option value="en_attente">En attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="expediee">Expédiée</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "customers" && (
          <CustomersSection customers={customers} orders={orders} />
        )}

        {tab === "promotions" && (
          <div className="mt-8 space-y-4">
            <PromoForm onSave={savePromotion} />
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-3">Code</th><th className="p-3">Description</th><th className="p-3">Réduction</th><th className="p-3">Active</th></tr>
                </thead>
                <tbody>
                  {promotions.map((pr) => (
                    <tr key={pr.id} className="border-t border-border">
                      <td className="p-3 font-medium">{pr.code}</td>
                      <td className="p-3">{pr.description}</td>
                      <td className="p-3">{pr.discount_percent}%</td>
                      <td className="p-3"><input type="checkbox" checked={pr.active} onChange={(e) => savePromotion({ ...pr, active: e.target.checked })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-8 space-y-3">
            {reviews.length === 0 ? <p className="text-sm text-muted-foreground">Aucun avis.</p> : reviews.map((r) => (
              <div key={r.id} className={`rounded-2xl border p-4 ${r.approved ? "border-border bg-card" : "border-amber-300 bg-amber-50/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-rose-deep">{r.customer_name} <span className="text-xs text-muted-foreground">· {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></div>
                    <div className="text-xs text-muted-foreground">Produit : {r.products?.name ?? "—"} · {new Date(r.created_at).toLocaleString("fr-FR")}</div>
                  </div>
                  <div className="flex gap-2">
                    {r.approved ? (
                      <button onClick={() => moderateReview(r.id, false)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">Masquer</button>
                    ) : (
                      <button onClick={() => moderateReview(r.id, true)} className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">Publier</button>
                    )}
                    <button onClick={() => deleteReview(r.id)} className="rounded-full border border-rose-deep px-3 py-1 text-xs text-rose-deep hover:bg-rose-pale/40">Supprimer</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>
                <div className="mt-2 text-xs">{r.approved ? <span className="text-emerald-700">✓ Publié</span> : <span className="text-amber-700">⏳ En attente de modération</span>}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && <ProductModal product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />}
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl text-rose-deep">{value}</div>
    </div>
  );
}

function CustomersSection({ customers, orders }: { customers: CustomerRow[]; orders: OrderRow[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) =>
      [c.fullname, c.email, c.phone].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [customers, q]);

  const customerOrders = useMemo(() => {
    if (!selected) return [];
    return orders.filter(
      (o) =>
        o.customer_id === selected.id ||
        (selected.phone && o.phone === selected.phone) ||
        (selected.email && o.fullname && selected.fullname && o.fullname === selected.fullname),
    );
  }, [orders, selected]);

  const stats = useMemo(() => {
    const total = customerOrders.reduce((a, o) => a + Number(o.total_amount), 0);
    return { count: customerOrders.length, total };
  }, [customerOrders]);

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone…"
          className="flex-1 min-w-[240px] rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} client(s)</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Commandes</th>
              <th className="p-3">Inscription</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const count = orders.filter(
                (o) => o.customer_id === c.id || (c.phone && o.phone === c.phone),
              ).length;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.fullname || "—"}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.phone || "—"}</td>
                  <td className="p-3">{count}</td>
                  <td className="p-3 text-xs">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelected(c)}
                      className="rounded-full border border-rose-deep px-3 py-1 text-xs text-rose-deep hover:bg-rose-pale/40"
                    >
                      Historique
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">Aucun client trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-2xl text-rose-deep">{selected.fullname || selected.email}</h3>
                <p className="text-xs text-muted-foreground">{selected.email} · {selected.phone || "—"}</p>
                <p className="mt-1 text-xs">Client depuis {new Date(selected.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Commandes</div>
                <div className="mt-1 font-display text-2xl text-rose-deep">{stats.count}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Total dépensé</div>
                <div className="mt-1 font-display text-2xl text-rose-deep">{formatPrice(stats.total)}</div>
              </div>
            </div>

            <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-2xl border border-border">
              {customerOrders.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Aucune commande pour ce client.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="p-3">N°</th><th className="p-3">Date</th><th className="p-3">Articles</th><th className="p-3">Total</th><th className="p-3">Statut</th></tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((o) => (
                      <tr key={o.id} className="border-t border-border align-top">
                        <td className="p-3 font-medium text-rose-deep">{o.order_number}</td>
                        <td className="p-3 text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="p-3 text-xs">
                          {o.order_items?.map((it, i) => (
                            <div key={i}>{it.product_name} ×{it.quantity}</div>
                          ))}
                        </td>
                        <td className="p-3">{formatPrice(Number(o.total_amount))}</td>
                        <td className="p-3 text-xs">{o.order_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoForm({ onSave }: { onSave: (p: Partial<PromoRow>) => void }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(10);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ code, description, discount_percent: discount, active: true }); setCode(""); setDescription(""); }} className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-4">
      <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="rounded border border-border bg-background px-3 py-2 text-sm" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" />
      <input type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 rounded border border-border bg-background px-3 py-2 text-sm" />
      <button className="rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground">Ajouter</button>
    </form>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Partial<ProductRow>; onClose: () => void; onSave: (p: Partial<ProductRow>) => void }) {
  const [p, setP] = useState<Partial<ProductRow>>(product);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const up = await supabase.storage.from("products").upload(path, file);
    if (up.error) { toast.error("Upload impossible : " + up.error.message); setUploading(false); return; }
    const signed = await supabase.storage.from("products").createSignedUrl(path, 60 * 60 * 24 * 365);
    setP((prev) => ({ ...prev, image_url: signed.data?.signedUrl ?? null }));
    setUploading(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl text-rose-deep">{p.id ? "Modifier" : "Nouveau"} produit</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <input required value={p.name ?? ""} onChange={(e) => setP({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} placeholder="Nom du produit" className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <input required value={p.slug ?? ""} onChange={(e) => setP({ ...p, slug: e.target.value })} placeholder="slug-url" className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} placeholder="Description" rows={3} className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <select value={p.category ?? ""} onChange={(e) => setP({ ...p, category: e.target.value })} className="rounded border border-border bg-background px-3 py-2 text-sm">
            <option value="">Catégorie…</option>
            {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min={0} value={p.price ?? 0} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} placeholder="Prix (FCFA)" className="rounded border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" min={0} value={p.stock ?? 0} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} placeholder="Stock" className="rounded border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <input value={p.image_url ?? ""} onChange={(e) => setP({ ...p, image_url: e.target.value })} placeholder="URL image (ou téléverser ci-dessous)" className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="text-xs" />
          {uploading && <p className="text-xs text-muted-foreground">Téléversement…</p>}
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_active ?? true} onChange={(e) => setP({ ...p, is_active: e.target.checked })} /> Actif</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_featured ?? false} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Vedette</label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Annuler</button>
            <button onClick={() => onSave(p)} className="rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
