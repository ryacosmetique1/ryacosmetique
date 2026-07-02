import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import {
  isPreviewHost,
  pushSupported,
  registerPushSW,
  subscribeToPush,
} from "@/lib/push/client";

const DISMISS_KEY = "rya_push_dismissed_v1";

export function PushOptIn() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pushSupported() || isPreviewHost()) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Register SW quietly so the browser is ready when the user opts in.
    void registerPushSW();
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  async function enable() {
    setBusy(true);
    try {
      await subscribeToPush();
      toast.success("Notifications activées ! Vous serez alerté(e) des nouveautés RYA.");
      setShow(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'activer les notifications.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Activer les notifications"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-gold/30 bg-card/95 p-4 shadow-2xl backdrop-blur-md md:inset-x-auto md:right-6 md:left-auto"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-rose text-primary-foreground">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-rose-deep">Nouveautés RYA en avant-première</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Recevez une notification dès qu'un nouveau produit est publié.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={enable}
              disabled={busy}
              className="rounded-full bg-gradient-rose px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy ? "…" : "Activer"}
            </button>
            <button
              onClick={dismiss}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
