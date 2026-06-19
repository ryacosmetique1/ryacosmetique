import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

const fallbacks: Record<string, string> = {
  "lumiere-rose": p1,
  "miel-ambre": p2,
  "pure-blanc": p3,
  "rose-eclat": p4,
  "soie-douce": p1,
  "or-precieux": p2,
  "perle-nuit": p3,
  "fleur-coton": p4,
};

export function resolveProductImage(slug: string, imageUrl: string | null | undefined) {
  if (imageUrl && /^https?:\/\//.test(imageUrl)) return imageUrl;
  return fallbacks[slug] ?? p1;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

export const categoriesList = [
  "Éclaircissants",
  "Hydratants",
  "Nourrissants",
  "Anti-taches",
  "Peaux sensibles",
] as const;
