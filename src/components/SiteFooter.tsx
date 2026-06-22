import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Phone, Mail, MapPin, Lock } from "lucide-react";
import logo from "@/assets/rya-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="RYA" className="h-12 w-12 rounded-full ring-1 ring-gold/40" />
            <div>
              <div className="font-display text-lg text-rose-deep">RYA</div>
              <div className="text-[10px] tracking-[0.25em] text-gold">BUSINESS GROUP</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Révélez votre beauté naturelle avec nos laits corporels d'exception.</p>
        </div>
        <div>
          <h4 className="font-display text-base text-rose-deep">Navigation</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-rose-deep">Accueil</Link></li>
            <li><Link to="/boutique" className="hover:text-rose-deep">Boutique</Link></li>
            <li><Link to="/a-propos" className="hover:text-rose-deep">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-rose-deep">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base text-rose-deep">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> +221 00 000 00 00</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> contact@ryabusinessgroup.com</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Dakar, Sénégal</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base text-rose-deep">Suivez-nous</h4>
          <div className="mt-4 flex gap-3">
            <a aria-label="Instagram" href="#" className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold transition hover:bg-gold hover:text-gold-foreground"><Instagram className="h-4 w-4" /></a>
            <a aria-label="Facebook" href="#" className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold transition hover:bg-gold hover:text-gold-foreground"><Facebook className="h-4 w-4" /></a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Recevez nos conseils beauté & offres exclusives.</p>
          <form className="mt-3 flex gap-2">
            <input type="email" required placeholder="Votre email" className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-gold" />
            <button className="rounded-full bg-gradient-rose px-4 py-2 text-sm text-primary-foreground shadow-soft hover:opacity-90">OK</button>
          </form>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground relative">
        © {new Date().getFullYear()} RYA Business Group. Tous droits réservés.
        <Link
          to="/admin-login"
          aria-label="Accès administrateur"
          title="Accès administrateur"
          className="absolute right-6 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-gold/30 text-muted-foreground/60 opacity-60 transition hover:opacity-100 hover:text-gold hover:border-gold hover:bg-gold/5"
        >
          <Lock className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  );
}
