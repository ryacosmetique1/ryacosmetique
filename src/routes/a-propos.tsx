import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Check } from "lucide-react";
import logo from "@/assets/rya-logo.png.asset.json";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — RYA Business Group" },
      { name: "description", content: "RYA Business Group : entreprise spécialisée dans la commercialisation de laits corporels de qualité supérieure." },
      { property: "og:title", content: "À propos de RYA Business Group" },
      { property: "og:description", content: "Nourrir, protéger et sublimer la peau — notre engagement beauté." },
    ],
  }),
  component: About,
});

const advantages = [
  "Produits authentiques",
  "Livraison rapide",
  "Paiement sécurisé",
  "Conseils beauté personnalisés",
  "Service client réactif",
];

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Notre maison</span>
          <h1 className="mt-3 font-display text-5xl text-rose-deep md:text-6xl">À propos de RYA</h1>
          <p className="mt-6 text-muted-foreground">
            <span className="text-rose-deep">RYA Business Group</span> est une entreprise spécialisée dans la commercialisation de laits corporels de qualité supérieure, conçus pour <em>nourrir, protéger et sublimer</em> la peau.
          </p>
          <p className="mt-4 text-muted-foreground">
            Notre mission : rendre les soins haut de gamme accessibles, et accompagner chaque cliente — chaque client — vers une peau plus belle, plus saine, plus rayonnante.
          </p>
          <ul className="mt-8 space-y-3">
            {advantages.map((a) => (
              <li key={a} className="flex items-center gap-3 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-gold text-gold-foreground"><Check className="h-3.5 w-3.5" /></span>
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 mx-auto h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-hero p-12 shadow-gold">
            <img src={logo.url} alt="RYA Business Group" className="mx-auto h-72 w-72 rounded-full object-cover" />
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
