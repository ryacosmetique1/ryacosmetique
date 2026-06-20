import { ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice, resolveProductImage } from "@/lib/product-images";
import { toast } from "sonner";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
}

export function ProductCard({ product }: { product: ProductRow }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-gold">
      <Link to="/produit/$slug" params={{ slug: product.slug }} className="relative aspect-[4/5] overflow-hidden bg-gradient-hero">
        <img
          src={resolveProductImage(product.slug, product.image_url)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
          {product.category}
        </span>
        {out && (
          <span className="absolute right-4 top-4 rounded-full bg-rose-deep px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-primary-foreground">
            Épuisé
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to="/produit/$slug" params={{ slug: product.slug }} className="font-display text-xl text-rose-deep hover:underline">{product.name}</Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-medium text-foreground">{formatPrice(product.price)}</div>
            <div className="text-xs text-muted-foreground">Stock : {product.stock}</div>
          </div>
          <button
            disabled={out}
            onClick={() => {
              add({
                product_id: product.id,
                slug: product.slug,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                stock: product.stock,
              });
              toast.success(`${product.name} ajouté au panier`);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" /> {out ? "Indisponible" : "Ajouter"}
          </button>
        </div>
      </div>
    </article>
  );
}
