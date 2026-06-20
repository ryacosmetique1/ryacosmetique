import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { formatPrice, resolveProductImage } from "@/lib/product-images";
import { toast } from "sonner";

export const Route = createFileRoute("/produit/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — RYA` }] }),
  component: ProductDetail,
});

interface Product {
  id: string; slug: string; name: string; description: string | null;
  category: string; price: number; stock: number; image_url: string | null;
}
interface Review {
  id: string; customer_name: string; comment: string; rating: number; created_at: string;
}

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function reload(productId?: string) {
    const pid = productId ?? product?.id;
    if (!pid) return;
    const { data } = await supabase
      .from("testimonials")
      .select("id,customer_name,comment,rating,created_at")
      .eq("product_id", pid)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
  }

  useEffect(() => {
    setLoading(true);
    supabase
      .from("products")
      .select("id,slug,name,description,category,price,stock,image_url")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
        if (data) reload((data as Product).id);
      });
  }, [slug]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !product) return toast.error("Connectez-vous pour laisser un avis");
    setSubmitting(true);
    const { data: profile } = await supabase.from("profiles").select("fullname,email").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("testimonials").insert({
      product_id: product.id,
      user_id: user.id,
      customer_name: profile?.fullname || profile?.email || "Cliente",
      comment,
      rating,
      approved: false,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Merci ! Votre avis sera publié après modération.");
    setComment(""); setRating(5);
  }

  if (loading) return <div className="min-h-screen"><SiteHeader /><p className="p-12 text-center text-muted-foreground">Chargement…</p><SiteFooter /></div>;
  if (!product) return <div className="min-h-screen"><SiteHeader /><div className="p-12 text-center"><p className="text-muted-foreground">Produit introuvable.</p><Link to="/boutique" className="text-rose-deep underline">Retour à la boutique</Link></div><SiteFooter /></div>;

  const out = product.stock <= 0;
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link to="/boutique" className="text-xs text-muted-foreground hover:text-rose-deep">← Retour à la boutique</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-gradient-hero">
            <img src={resolveProductImage(product.slug, product.image_url)} alt={product.name} className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">{product.category}</span>
            <h1 className="mt-2 font-display text-4xl text-rose-deep md:text-5xl">{product.name}</h1>
            {reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}</div>
                <span className="text-muted-foreground">({reviews.length} avis)</span>
              </div>
            )}
            <p className="mt-6 whitespace-pre-line text-foreground/80">{product.description || "Un soin d'exception pensé pour sublimer votre peau jour après jour."}</p>
            <div className="mt-8 flex items-end justify-between rounded-2xl border border-border bg-card p-6">
              <div>
                <div className="text-3xl font-medium text-rose-deep">{formatPrice(product.price)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{out ? "Indisponible" : `En stock : ${product.stock}`}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  disabled={out}
                  onClick={() => {
                    add({ product_id: product.id, slug: product.slug, name: product.name, price: Number(product.price), image_url: product.image_url, stock: product.stock });
                    toast.success(`${product.name} ajouté au panier`);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-deep px-5 py-2 text-sm text-rose-deep hover:bg-rose-pale/40 disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" /> Ajouter au panier
                </button>
                <button
                  disabled={out}
                  onClick={() => {
                    add({ product_id: product.id, slug: product.slug, name: product.name, price: Number(product.price), image_url: product.image_url, stock: product.stock });
                    navigate({ to: "/commande" });
                  }}
                  className="rounded-full bg-gradient-rose px-5 py-2 text-sm text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50"
                >
                  Commander
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-3xl text-rose-deep">Avis clients</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aucun avis publié pour le moment. Soyez la première à partager votre expérience.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-rose-deep">{r.customer_name}</div>
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}</div>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-xl text-rose-deep">Laisser un avis</h3>
            {!user ? (
              <p className="mt-2 text-sm text-muted-foreground"><Link to="/auth" className="text-rose-deep underline">Connectez-vous</Link> pour partager votre avis.</p>
            ) : (
              <form onSubmit={submitReview} className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setRating(i + 1)}>
                      <Star className={`h-6 w-6 ${i < rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre commentaire" rows={3} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <button disabled={submitting} className="self-start rounded-full bg-gradient-rose px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">
                  {submitting ? "Envoi…" : "Publier mon avis"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
