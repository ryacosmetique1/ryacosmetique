import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard, type ProductRow } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { categoriesList } from "@/lib/product-images";

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "Boutique — RYA Business Group" },
      { name: "description", content: "Explorez notre boutique : laits corporels éclaircissants, hydratants, nourrissants, anti-taches et pour peaux sensibles." },
    ],
  }),
  component: Shop,
});

type Cat = (typeof categoriesList)[number] | "Tous";

function Shop() {
  const [active, setActive] = useState<Cat>("Tous");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("id,slug,name,description,category,price,stock,image_url").eq("is_active", true).order("created_at", { ascending: false }).then(({ data }) => {
      setProducts((data as ProductRow[]) ?? []);
      setLoading(false);
    });
  }, []);

  const list = active === "Tous" ? products : products.filter((p) => p.category === active);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-gradient-hero py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Boutique</span>
          <h1 className="mt-3 font-display text-5xl text-rose-deep md:text-6xl">Notre collection</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Découvrez des laits corporels d'exception, pensés pour chaque type de peau.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {(["Tous", ...categoriesList] as const).map((c) => (
            <button
              key={c}
              onClick={() => setActive(c as Cat)}
              className={`rounded-full border px-5 py-2 text-sm transition ${
                active === c
                  ? "border-rose-deep bg-gradient-rose text-primary-foreground shadow-soft"
                  : "border-border bg-background text-foreground/70 hover:border-gold hover:text-rose-deep"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-center text-muted-foreground">Chargement…</p>
        ) : list.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucun produit dans cette catégorie.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
