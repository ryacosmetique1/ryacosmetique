import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { formatPrice, resolveProductImage } from "@/lib/product-images";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/panier")({
  head: () => ({ meta: [{ title: "Mon panier — RYA Business Group" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total, count, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl text-rose-deep md:text-5xl">Mon panier</h1>
        <p className="mt-2 text-sm text-muted-foreground">{count} article{count > 1 ? "s" : ""} dans votre panier.</p>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Votre panier est vide.</p>
            <Link to="/boutique" className="mt-6 inline-flex rounded-full bg-gradient-rose px-5 py-2 text-sm text-primary-foreground">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="flex flex-col gap-4">
              {items.map((i) => (
                <li key={i.product_id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <img src={resolveProductImage(i.slug, i.image_url)} alt={i.name} className="h-24 w-24 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg text-rose-deep">{i.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatPrice(i.price)} l'unité</p>
                      </div>
                      <button onClick={() => remove(i.product_id)} className="text-muted-foreground hover:text-rose-deep" aria-label="Retirer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                        <button onClick={() => setQty(i.product_id, i.quantity - 1)} className="rounded-full p-1 hover:bg-muted" aria-label="Diminuer"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm">{i.quantity}</span>
                        <button onClick={() => setQty(i.product_id, i.quantity + 1)} disabled={i.quantity >= i.stock} className="rounded-full p-1 hover:bg-muted disabled:opacity-30" aria-label="Augmenter"><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="text-base font-medium">{formatPrice(i.price * i.quantity)}</div>
                    </div>
                  </div>
                </li>
              ))}
              <button onClick={clear} className="self-start text-xs text-muted-foreground underline hover:text-rose-deep">Vider le panier</button>
            </ul>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl text-rose-deep">Récapitulatif</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(total)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>Calculée à la commande</span></div>
                <div className="my-3 h-px bg-border" />
                <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-rose-deep">{formatPrice(total)}</span></div>
              </div>
              <button
                onClick={() => navigate({ to: user ? "/commande" : "/auth" })}
                className="mt-6 w-full rounded-full bg-gradient-rose px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90"
              >
                {user ? "Passer la commande" : "Se connecter pour commander"}
              </button>
              <Link to="/boutique" className="mt-3 block text-center text-xs text-muted-foreground hover:text-rose-deep">Continuer mes achats</Link>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
