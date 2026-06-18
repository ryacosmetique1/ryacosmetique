import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Phone, Mail, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — RYA Business Group" },
      { name: "description", content: "Contactez RYA Business Group par WhatsApp, email ou en personne. Nous répondons rapidement." },
      { property: "og:title", content: "Contact RYA Business Group" },
      { property: "og:description", content: "Une question, une commande ? Notre équipe est à votre écoute." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-gradient-hero py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Contact</span>
          <h1 className="mt-3 font-display text-5xl text-rose-deep md:text-6xl">Parlons beauté</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Notre équipe vous accompagne pour choisir le soin idéal et passer commande en toute simplicité.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-5">
        <form
          onSubmit={(e) => { e.preventDefault(); alert("Merci ! Nous vous recontactons très vite."); }}
          className="md:col-span-3 space-y-4 rounded-3xl border border-border/60 bg-card p-8 shadow-soft"
        >
          {[
            { id: "name", label: "Nom complet", type: "text" },
            { id: "phone", label: "Téléphone", type: "tel" },
            { id: "email", label: "Email", type: "email" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</label>
              <input id={f.id} type={f.type} required className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold" />
            </div>
          ))}
          <div>
            <label htmlFor="msg" className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea id="msg" rows={5} required className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-6 py-3 text-sm text-primary-foreground shadow-soft hover:opacity-90">
            Envoyer <Send className="h-4 w-4" />
          </button>
        </form>

        <aside className="md:col-span-2 space-y-4">
          {[
            { icon: Phone, title: "WhatsApp", value: "+221 00 000 00 00" },
            { icon: Mail, title: "Email", value: "contact@ryabusinessgroup.com" },
            { icon: MapPin, title: "Adresse", value: "Dakar, Sénégal" },
          ].map((c) => (
            <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-gold text-gold-foreground"><c.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.title}</div>
                <div className="mt-1 text-sm text-rose-deep">{c.value}</div>
              </div>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-soft">
            <iframe
              title="Carte"
              src="https://www.google.com/maps?q=Dakar%20Senegal&output=embed"
              className="h-64 w-full"
              loading="lazy"
            />
          </div>
        </aside>
      </section>
      <SiteFooter />
    </div>
  );
}
