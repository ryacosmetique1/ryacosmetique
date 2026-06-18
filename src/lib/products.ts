import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

export type Category =
  | "Éclaircissants"
  | "Hydratants"
  | "Nourrissants"
  | "Anti-taches"
  | "Peaux sensibles";

export interface Product {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number; // FCFA
  stock: number;
  image: string;
  featured?: boolean;
}

export const products: Product[] = [
  { id: "lumiere-rose", name: "Lumière de Rose", category: "Éclaircissants", description: "Lait éclaircissant à la rose et vitamine C pour un teint lumineux et unifié.", price: 18500, stock: 24, image: p1, featured: true },
  { id: "miel-ambre", name: "Miel & Ambre", category: "Nourrissants", description: "Soin nourrissant au miel pur et beurre de karité pour peaux sèches.", price: 22000, stock: 18, image: p2, featured: true },
  { id: "pure-blanc", name: "Pure Blanc Velours", category: "Hydratants", description: "Lait hydratant 24h à l'aloe vera et acide hyaluronique.", price: 16000, stock: 32, image: p3, featured: true },
  { id: "rose-eclat", name: "Rose Éclat Anti-Taches", category: "Anti-taches", description: "Formule ciblée pour estomper les taches et révéler un teint uniforme.", price: 24500, stock: 12, image: p4, featured: true },
  { id: "soie-douce", name: "Soie Douce Sensitive", category: "Peaux sensibles", description: "Sans parfum, à la camomille — apaise et protège les peaux réactives.", price: 19500, stock: 20, image: p1 },
  { id: "or-precieux", name: "Or Précieux Hydra", category: "Hydratants", description: "Lait riche en huiles précieuses pour une peau veloutée et parfumée.", price: 26000, stock: 15, image: p2 },
  { id: "perle-nuit", name: "Perle de Nuit", category: "Anti-taches", description: "Soin de nuit régénérant pour estomper les imperfections.", price: 23000, stock: 9, image: p3 },
  { id: "fleur-coton", name: "Fleur de Coton", category: "Peaux sensibles", description: "Texture ultra-douce pour toute la famille, même les enfants.", price: 14500, stock: 40, image: p4 },
];

export const categories: Category[] = [
  "Éclaircissants",
  "Hydratants",
  "Nourrissants",
  "Anti-taches",
  "Peaux sensibles",
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
