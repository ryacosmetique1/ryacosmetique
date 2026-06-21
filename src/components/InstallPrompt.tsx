import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rya_install_dismissed_v1";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;

    function onBIP(e: Event) {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setHidden(false);
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (hidden || !evt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card/95 p-4 shadow-soft backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-pale text-rose-deep">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-rose-deep">Installer RYA</div>
          <div className="text-xs text-muted-foreground">Ajoutez l'app à votre écran d'accueil</div>
        </div>
        <button
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice;
            setHidden(true);
            setEvt(null);
          }}
          className="rounded-full bg-gradient-rose px-4 py-2 text-xs text-primary-foreground shadow-soft"
        >
          Installer
        </button>
        <button
          aria-label="Fermer"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setHidden(true);
          }}
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
