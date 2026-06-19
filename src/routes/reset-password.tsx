import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nouveau mot de passe — RYA" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/mon-compte" });
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl text-rose-deep">Nouveau mot de passe</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="rounded-md border border-border bg-background px-4 py-3 text-sm" />
          <button disabled={busy} className="rounded-full bg-gradient-rose px-4 py-3 text-sm font-medium text-primary-foreground">{busy ? "…" : "Enregistrer"}</button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
