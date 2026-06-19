import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "rya_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item, qty = 1) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === item.product_id);
        if (existing) {
          return prev.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: Math.min(i.stock, i.quantity + qty) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: Math.min(item.stock, qty) }];
      }),
    remove: (product_id) => setItems((prev) => prev.filter((i) => i.product_id !== product_id)),
    setQty: (product_id, qty) =>
      setItems((prev) =>
        prev
          .map((i) =>
            i.product_id === product_id ? { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) } : i,
          )
          .filter((i) => i.quantity > 0),
      ),
    clear: () => setItems([]),
    count: items.reduce((a, i) => a + i.quantity, 0),
    total: items.reduce((a, i) => a + i.quantity * i.price, 0),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
