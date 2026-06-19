import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — RYA Business Group" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/mon-compte" });
  }, [user, loading, navigate]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/mon-compte`,
            data: { fullname, phone },
          },
        });
        if (error) throw error;
        toast.success("Compte créé, vous êtes connecté.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de réinitialisation envoyé.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/mon-compte" });
    if (r.error) toast.error(r.error.message || "Échec Google");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl text-rose-deep">
            {mode === "signup" ? "Créer un compte" : mode === "reset" ? "Mot de passe oublié" : "Connexion"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Rejoignez RYA pour suivre vos commandes." : mode === "reset" ? "Recevez un email pour réinitialiser." : "Heureux de vous revoir."}
          </p>
        </div>

        <button onClick={google} type="button" className="rounded-full border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted">
          Continuer avec Google
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> OU <div className="h-px flex-1 bg-border" /></div>

        <form onSubmit={handle} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input required value={fullname} onChange={(e) => setFullname(e.target.value)} placeholder="Nom complet" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
            </>
          )}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
          {mode !== "reset" && (
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
          )}
          <button disabled={busy} className="rounded-full bg-gradient-rose px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60">
            {busy ? "…" : mode === "signup" ? "Créer mon compte" : mode === "reset" ? "Envoyer l'email" : "Se connecter"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("signup")} className="hover:text-rose-deep">Pas de compte ? Inscription</button>
              <button onClick={() => setMode("reset")} className="hover:text-rose-deep">Mot de passe oublié ?</button>
            </>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-rose-deep">← Retour à la connexion</button>
          )}
          <Link to="/" className="hover:text-rose-deep">Retour à l'accueil</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
