import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard, type ProductRow } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Leaf, ShieldCheck, Truck, Star, ArrowRight, Heart } from "lucide-react";
import hero from "@/assets/hero-beauty.jpg";
import logo from "@/assets/rya-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RYA Business Group — Révélez votre beauté naturelle" },
      { name: "description", content: "Découvrez les laits corporels haut de gamme RYA : éclat, hydratation et nutrition pour toute la famille." },
      { property: "og:title", content: "RYA Business Group — Révélez votre beauté naturelle" },
      { property: "og:description", content: "Laits corporels premium : éclaircissants, hydratants, nourrissants, anti-taches." },
    ],
  }),
  component: HomePage,
});

interface Testimonial { id: string; customer_name: string; comment: string; rating: number }

function HomePage() {
  const [featured, setFeatured] = useState<ProductRow[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  useEffect(() => {
    supabase.from("products").select("id,slug,name,description,category,price,stock,image_url").eq("is_featured", true).eq("is_active", true).limit(4).then(({ data }) => setFeatured((data as ProductRow[]) ?? []));
    supabase.from("testimonials").select("id,customer_name,comment,rating").eq("approved", true).limit(3).then(({ data }) => setTestimonials((data as Testimonial[]) ?? []));
  }, []);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Brand />
      {featured.length > 0 && <Featured products={featured} />}
      <WhyUs />
      <Testimonials items={testimonials} />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rose/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Édition signature
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-rose-deep md:text-6xl lg:text-7xl">
            Révélez <em className="not-italic text-gradient-gold">l'éclat naturel</em> de votre peau
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
            Une collection exclusive de laits corporels haut de gamme pour femmes, hommes et enfants — formulés pour nourrir, protéger et sublimer chaque peau.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/boutique" className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-6 py-3 text-sm text-primary-foreground shadow-soft transition hover:opacity-90">
              Découvrir la boutique <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/a-propos" className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm text-foreground/80 transition hover:bg-gold/10">
              Notre histoire
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold text-gold" /> 4.9/5 — 320+ avis</div>
            <div className="h-4 w-px bg-border" />
            <div>Livraison rapide partout</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 mx-auto h-[480px] w-[480px] rounded-full bg-gradient-gold opacity-20 blur-3xl" />
          <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] border border-gold/30 shadow-gold animate-float-slow">
            <img src={hero} alt="Laits corporels RYA" width={1600} height={1100} className="aspect-[4/5] w-full object-cover" />
          </div>
          <img src={logo.url} alt="" aria-hidden className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full border border-gold/40 bg-background object-cover shadow-soft" />
        </div>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 text-center">
      <div className="divider-gold mx-auto mb-8 w-24" />
      <h2 className="font-display text-4xl text-rose-deep md:text-5xl">L'art de la beauté authentique</h2>
      <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
        Chez <span className="text-rose-deep">RYA Business Group</span>, nous croyons qu'une peau sublimée commence par des soins d'exception. Nos formules associent ingrédients naturels et savoir-faire moderne pour révéler la beauté unique de chacun.
      </p>
      <div className="divider-gold mx-auto mt-8 w-24" />
    </section>
  );
}

function Featured({ products }: { products: ProductRow[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Best-sellers</span>
          <h2 className="mt-2 font-display text-4xl text-rose-deep md:text-5xl">Produits vedettes</h2>
        </div>
        <Link to="/boutique" className="hidden items-center gap-2 text-sm text-rose-deep hover:underline md:inline-flex">
          Voir tout <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

const reasons = [
  { icon: Leaf, title: "Ingrédients authentiques", text: "Formules naturelles, testées dermatologiquement." },
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Wave, Orange Money ou à la livraison." },
  { icon: Truck, title: "Livraison rapide", text: "Expédition soignée et suivi à chaque étape." },
  { icon: Heart, title: "Conseils personnalisés", text: "Une équipe beauté à votre écoute." },
];

function WhyUs() {
  return (
    <section className="bg-secondary/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Pourquoi RYA</span>
          <h2 className="mt-2 font-display text-4xl text-rose-deep md:text-5xl">L'excellence, geste après geste</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-soft">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl text-rose-deep">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-gold">Témoignages</span>
        <h2 className="mt-2 font-display text-4xl text-rose-deep md:text-5xl">Elles parlent de nous</h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((r) => (
          <figure key={r.id} className="relative rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
            <div className="flex gap-1 text-gold">
              {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <blockquote className="mt-4 font-display text-lg leading-relaxed text-foreground/90">"{r.comment}"</blockquote>
            <figcaption className="mt-6 text-sm text-rose-deep">{r.customer_name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-rose px-8 py-16 text-center text-primary-foreground shadow-gold md:px-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-background/20 blur-3xl" />
        <h2 className="relative font-display text-4xl md:text-5xl">Commencez votre rituel d'éclat</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/90">Recevez vos laits corporels favoris directement chez vous, et offrez à votre peau le soin qu'elle mérite.</p>
        <Link to="/boutique" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm text-rose-deep shadow-soft transition hover:scale-105">
          Découvrir la boutique <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
