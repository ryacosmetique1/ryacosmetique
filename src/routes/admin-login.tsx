import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [
    { title: "Accès administrateur — RYA Business Group" },
    { name: "robots", content: "noindex,nofollow" },
  ]}),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Connexion échouée");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isAdminUser = roles?.some((r) => r.role === "admin");
      if (!isAdminUser) {
        await supabase.auth.signOut();
        throw new Error("Accès refusé — compte non administrateur");
      }

      toast.success("Bienvenue, administrateur");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gold/30 bg-card/80 backdrop-blur-sm p-10 shadow-soft">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-rose ring-2 ring-gold/40 shadow-soft">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="mt-5 font-display text-3xl text-rose-deep">Espace administrateur</h1>
            <p className="mt-2 text-xs tracking-[0.25em] text-gold uppercase">RYA · Privé</p>
            <p className="mt-3 text-sm text-muted-foreground">Connexion réservée au personnel autorisé.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email administrateur"
              autoComplete="email"
              className="rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className="rounded-md border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <button
              disabled={busy}
              className="mt-2 rounded-full bg-gradient-rose px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-rose-deep">← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
