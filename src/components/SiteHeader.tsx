import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/rya-logo.png.asset.json";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/boutique", label: "Boutique" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="RYA Business Group" className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/40" />
          <div className="leading-tight">
            <div className="font-display text-lg text-rose-deep">RYA</div>
            <div className="text-[10px] tracking-[0.25em] text-gold">BUSINESS GROUP</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm tracking-wide text-foreground/80 transition-colors hover:text-rose-deep [&.active]:text-rose-deep"
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/boutique" className="hidden md:inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm text-foreground/80 transition hover:bg-gold/10">
            <ShoppingBag className="h-4 w-4" /> Panier
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden rounded-full p-2 hover:bg-muted">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm hover:bg-muted">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
