import { SAMPLE_FASHION_PRODUCTS, CATEGORIES_MASTER, AGE_GROUPS, STYLE_ATTRIBUTES } from "./fashionCatalog";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DEMO_TOKEN = "demo-token";
const DEMO_PRODUCTS = SAMPLE_FASHION_PRODUCTS;

const DEMO_CUSTOMERS = [
  { id: "c-1", name: "Ritu Textiles", phone: "+91 98765 11111", email: "ritu@example.com", balance: "4200", status: "Due" },
  { id: "c-2", name: "City Fashion Hub", phone: "+91 98220 22222", email: "city@example.com", balance: "0", status: "Paid" },
  { id: "c-3", name: "Sharma Garments", phone: "+91 98111 33333", email: "sharma@example.com", balance: "13500", status: "Due" },
  { id: "c-4", name: "Metro Retail", phone: "+91 98770 44444", email: "metro@example.com", balance: "780", status: "Partial" },
];

export const DEMO_ACCOUNT = {
  email: "demo@billvortex.com",
  password: "demo123",
  name: "Boutique Manager (Demo)",
  businessName: "Aura Boutique & Apparel",
};

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));
export const setToken = (t: string) => (typeof window === "undefined" ? null : localStorage.setItem("token", t));
export const removeToken = () => (typeof window === "undefined" ? null : localStorage.removeItem("token"));

function mockApi<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  if (path === "/auth/login" || path === "/auth/register") {
    return Promise.resolve({ token: DEMO_TOKEN, businessId: "demo-business" } as T);
  }

  if (path.startsWith("/categories")) {
    return Promise.resolve(CATEGORIES_MASTER as T);
  }

  if (path.startsWith("/age-groups")) {
    return Promise.resolve(AGE_GROUPS as T);
  }

  if (path.startsWith("/attributes")) {
    return Promise.resolve(STYLE_ATTRIBUTES as T);
  }

  if (path.startsWith("/products")) {
    const searchParams = new URLSearchParams(path.split("?")[1] ?? "");
    const q = searchParams.get("q") ?? "";
    const cat = searchParams.get("category") ?? "";
    const rows = DEMO_PRODUCTS.filter((p) => {
      const text = `${p.name} ${p.sku} ${p.category} ${p.fabric} ${p.color}`.toLowerCase();
      const matchQ = !q || text.includes(q.toLowerCase());
      const matchCat = !cat || cat === "ALL" || p.category.toLowerCase() === cat.toLowerCase();
      return matchQ && matchCat;
    });
    return Promise.resolve(rows as T);
  }

  if (path === "/invoices") {
    const body = init.body ? JSON.parse(String(init.body)) : { lines: [] };
    const total = (body.lines ?? []).reduce((sum: number, line: any) => {
      const prod = DEMO_PRODUCTS.find((p) => p.id === line.productId);
      const price = Number(prod?.salePrice ?? 800);
      const disc = Number(line.discountPct || 0) / 100;
      return sum + Number(line.quantity || 1) * price * (1 - disc);
    }, 0);
    const invoiceNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    return Promise.resolve({ number: invoiceNum, grandTotal: total.toFixed(2) } as T);
  }

  if (path === "/customers") {
    return Promise.resolve(DEMO_CUSTOMERS as T);
  }

  if (path.startsWith("/reports/daily-sales")) {
    return Promise.resolve({
      date: "2026-10-12",
      invoices: 28,
      totals: { subtotal: "184500", discountTotal: "2500", taxableTotal: "182000", cgst: "9000", sgst: "9000", igst: "0", grandTotal: "200000" },
      paymentSplit: [
        { method: "CASH", _sum: { amount: "82000" } },
        { method: "UPI", _sum: { amount: "64000" } },
        { method: "CARD", _sum: { amount: "54000" } },
      ],
    } as T);
  }

  if (path.startsWith("/reports/gst-summary")) {
    return Promise.resolve([
      { docType: "TAX_INVOICE", _sum: { taxableTotal: "60000", cgst: "2700", sgst: "2700", igst: "0", cess: "0", grandTotal: "65400" }, _count: 12 },
      { docType: "BILL_OF_SUPPLY", _sum: { taxableTotal: "30000", cgst: "0", sgst: "0", igst: "0", cess: "0", grandTotal: "30000" }, _count: 6 },
    ] as T);
  }

  return Promise.resolve({ ok: true } as T);
}

export async function api<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const t = getToken();
  if (t) headers.authorization = `Bearer ${t}`;
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  try {
    const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
    return body as T;
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn("Backend unavailable, using demo mode:", error);
    }
    return mockApi<T>(path, init);
  }
}
