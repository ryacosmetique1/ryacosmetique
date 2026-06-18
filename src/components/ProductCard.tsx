import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { ShoppingBag } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-gold">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-hero">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl text-rose-deep">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-medium text-foreground">{formatPrice(product.price)}</div>
            <div className="text-xs text-muted-foreground">Stock : {product.stock}</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground shadow-soft transition hover:opacity-90">
            <ShoppingBag className="h-4 w-4" /> Commander
          </button>
        </div>
      </div>
    </article>
  );
}
