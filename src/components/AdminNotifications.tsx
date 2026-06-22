import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Admin-only live notification bell.
 * - Counts orders awaiting proof validation (payment_proof not null, order_status = en_attente)
 * - Counts testimonials awaiting moderation (approved = false)
 * - Subscribes to Realtime updates on `orders` and `testimonials`.
 */
export function AdminNotifications() {
  const { isAdmin, user } = useAuth();
  const [pendingProofs, setPendingProofs] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!isAdmin || !user) return;

    const refresh = async () => {
      const [{ count: proofs }, { count: reviews }] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .not("payment_proof", "is", null)
          .eq("order_status", "en_attente"),
        supabase
          .from("testimonials")
          .select("id", { count: "exact", head: true })
          .eq("approved", false),
      ]);
      setPendingProofs(proofs ?? 0);
      setPendingReviews(reviews ?? 0);
    };

    refresh();

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const next = (payload.new ?? {}) as Record<string, unknown>;
          const prev = (payload.old ?? {}) as Record<string, unknown>;
          const proofAdded =
            next.payment_proof && next.payment_proof !== prev.payment_proof;
          if (proofAdded && !firstLoad.current) {
            toast.success("Nouvelle preuve de paiement reçue", {
              description: `Commande ${String(next.order_number ?? "")}`.trim(),
            });
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "testimonials" },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          if (!row.approved && !firstLoad.current) {
            toast.message("Nouvel avis à modérer", {
              description: String(row.name ?? "Client"),
            });
          }
          refresh();
        },
      )
      .subscribe();

    firstLoad.current = false;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user]);

  if (!isAdmin) return null;
  const total = pendingProofs + pendingReviews;

  return (
    <Link
      to="/admin"
      title={`${pendingProofs} preuve(s) • ${pendingReviews} avis en attente`}
      className="relative hidden sm:inline-flex items-center justify-center rounded-full border border-gold/40 p-2 text-foreground/80 transition hover:bg-gold/10"
    >
      <Bell className="h-4 w-4" />
      {total > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-deep px-1 text-[10px] font-semibold text-primary-foreground">
          {total}
        </span>
      )}
    </Link>
  );
}
