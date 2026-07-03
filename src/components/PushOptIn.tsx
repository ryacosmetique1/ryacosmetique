import { useEffect, useState } from "react";
import { Bell, BellOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  isPreviewHost,
  pushSupported,
  registerPushSW,
  subscribeToPush,
} from "@/lib/push/client";

const DISMISS_KEY = "rya_push_dismissed_v1";

type Status = "idle" | "working" | "success" | "error";

export function PushOptIn() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pushSupported()) return;
    if (isPreviewHost()) return;
    if (Notification.permission === "granted") return; // already opted in
    if (Notification.permission === "denied") return; // can't re-ask from JS
    if (localStorage.getItem(DISMISS_KEY)) return;
    void registerPushSW();
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  async function enable() {
    setStatus("working");
    setMessage("");
    try {
      if (!pushSupported()) throw new Error("Votre navigateur ne prend pas en charge les notifications Web Push.");
      // iOS Safari requires the site to be installed as a PWA first.
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isIOS && !isStandalone) {
        throw new Error("Sur iPhone, ajoutez d'abord RYA à l'écran d'accueil (Partager → Sur l'écran d'accueil), puis réessayez.");
      }
      const sub = await subscribeToPush();
      if (!sub) throw new Error("Souscription impossible.");
      setStatus("success");
      setMessage("Notifications activées — vous recevrez les nouveautés RYA.");
      toast.success("Notifications activées ✨", {
        description: "Vous serez alerté(e) dès qu'un nouveau produit est publié.",
      });
      setTimeout(() => setShow(false), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible d'activer les notifications.";
      setStatus("error");
      setMessage(msg);
      toast.error("Activation échouée", { description: msg });
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div
      role="dialog"
      aria-label="Activer les notifications"
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-md md:inset-x-auto md:right-6 md:left-auto transition-colors ${
        isSuccess
          ? "border-emerald-400/50 bg-emerald-50/95 dark:bg-emerald-950/90"
          : isError
            ? "border-rose-deep/40 bg-card/95"
            : "border-gold/30 bg-card/95"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary-foreground ${
            isSuccess ? "bg-emerald-600" : isError ? "bg-rose-deep" : "bg-gradient-rose"
          }`}
        >
          {isSuccess ? <Check className="h-5 w-5" /> : isError ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="font-medium text-rose-deep">
            {isSuccess ? "C'est activé !" : isError ? "Activation échouée" : "Nouveautés RYA en avant-première"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground" role={isError ? "alert" : undefined} aria-live="polite">
            {message ||
              (isSuccess
                ? "Merci — vos notifications sont en place."
                : "Recevez une notification dès qu'un nouveau produit est publié.")}
          </p>
          {!isSuccess && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={enable}
                disabled={status === "working"}
                className="rounded-full bg-gradient-rose px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                {status === "working" ? "Activation…" : isError ? "Réessayer" : "Activer"}
              </button>
              <button
                onClick={dismiss}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Plus tard
              </button>
            </div>
          )}
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
