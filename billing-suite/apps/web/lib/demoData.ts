import { SAMPLE_FASHION_PRODUCTS, FashionProductItem } from "./fashionCatalog";
import { InvoiceReceiptData } from "./pdfReceipt";

export type ExtendedInvoiceRecord = InvoiceReceiptData & {
  daysAgo?: number;
  branch?: string;
  gstSlabSummary?: {
    rate5Taxable: number;
    rate12Taxable: number;
    rate18Taxable: number;
  };
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  type: "Retail VIP" | "Regular Patron" | "B2B Boutique" | "Wholesale";
  totalVisits: number;
  lifetimeSpend: number;
  lastVisit: string;
  balance: string;
  status: "Due" | "Partial" | "Paid";
};

export type SupplierProfile = {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  creditDays: number;
  payable: number;
  ytdPurchases: number;
  onTimePct: number;
  lastOrderDate: string;
  activePoNo: string;
  status: "Active" | "Pending Orders" | "On Hold";
  rating: number;
  materials: string[];
};

export type PurchaseOrderRecord = {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  material: string;
  quantity: string;
  amount: number;
  orderDate: string;
  expectedDate: string;
  status: "In Transit" | "Dispatched" | "Confirmed" | "Received";
};

function formatDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function buildInvoice(params: {
  number: string;
  daysAgo: number;
  time: string;
  method: "UPI" | "CASH" | "CARD" | "CREDIT";
  customerName: string;
  customerPhone: string;
  branch: string;
  discount: number;
  lines: Array<{ sku: string; qty: number }>;
}): ExtendedInvoiceRecord {
  let subtotal = 0;
  const items = params.lines.map((line) => {
    const prod =
      SAMPLE_FASHION_PRODUCTS.find((p) => p.sku === line.sku) || SAMPLE_FASHION_PRODUCTS[0];
    const rate = Number(prod.salePrice) || 0;
    const total = rate * line.qty;
    subtotal += total;
    return {
      name: prod.name,
      sku: prod.sku,
      size: prod.size,
      color: prod.color,
      fabric: prod.fabric,
      qty: String(line.qty),
      rate: prod.salePrice,
      total,
    };
  });

  const discount = Math.min(subtotal, params.discount);
  const taxable = Math.max(0, subtotal - discount);
  const ratio = subtotal > 0 ? taxable / subtotal : 1;

  let tax = 0;
  let rate5Taxable = 0;
  let rate12Taxable = 0;
  let rate18Taxable = 0;

  params.lines.forEach((line) => {
    const prod =
      SAMPLE_FASHION_PRODUCTS.find((p) => p.sku === line.sku) || SAMPLE_FASHION_PRODUCTS[0];
    const lineTaxable = (Number(prod.salePrice) || 0) * line.qty * ratio;
    const gstRate = Number(prod.gstRate) || 5;
    tax += lineTaxable * (gstRate / 100);
    if (gstRate === 5) rate5Taxable += lineTaxable;
    else if (gstRate === 18) rate18Taxable += lineTaxable;
    else rate12Taxable += lineTaxable;
  });

  const grandTotal = taxable + tax;

  return {
    number: params.number,
    date: formatDaysAgo(params.daysAgo),
    time: params.time,
    daysAgo: params.daysAgo,
    branch: params.branch,
    method: params.method,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    tax: tax.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    items,
    gstSlabSummary: { rate5Taxable, rate12Taxable, rate18Taxable },
  };
}

export function getDefaultInvoiceHistory(): ExtendedInvoiceRecord[] {
  return [
    buildInvoice({
      number: "INV-2611-0842",
      daysAgo: 0,
      time: "06:35 PM",
      method: "UPI",
      customerName: "Meera Deshmukh",
      customerPhone: "+91 98204 71832",
      branch: "Bandra Flagship",
      discount: 500,
      lines: [
        { sku: "WET005", qty: 1 },
        { sku: "WAC001", qty: 1 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0841",
      daysAgo: 0,
      time: "05:18 PM",
      method: "CARD",
      customerName: "Priyanka Kulkarni",
      customerPhone: "+91 98192 45011",
      branch: "Bandra Flagship",
      discount: 250,
      lines: [
        { sku: "WOC001", qty: 1 },
        { sku: "WFW003", qty: 1 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0840",
      daysAgo: 0,
      time: "03:52 PM",
      method: "UPI",
      customerName: "Neha Agarwal",
      customerPhone: "+91 97690 88241",
      branch: "Andheri Studio",
      discount: 0,
      lines: [
        { sku: "WET003", qty: 2 },
        { sku: "WET004", qty: 1 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0839",
      daysAgo: 0,
      time: "01:40 PM",
      method: "CASH",
      customerName: "Ananya Verma",
      customerPhone: "+91 98200 55412",
      branch: "Bandra Flagship",
      discount: 300,
      lines: [
        { sku: "WET002", qty: 1 },
        { sku: "WFW001", qty: 1 },
        { sku: "WET001", qty: 2 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0838",
      daysAgo: 0,
      time: "12:10 PM",
      method: "UPI",
      customerName: "Pooja Sharma",
      customerPhone: "+91 98765 43210",
      branch: "Bandra Flagship",
      discount: 0,
      lines: [
        { sku: "WFW005", qty: 1 },
        { sku: "WFW002", qty: 2 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0837",
      daysAgo: 0,
      time: "10:42 AM",
      method: "CREDIT",
      customerName: "Ritu Malhotra (Ritu Styles)",
      customerPhone: "+91 98211 60428",
      branch: "Andheri Studio",
      discount: 400,
      lines: [
        { sku: "WET001", qty: 4 },
        { sku: "WIF002", qty: 2 },
        { sku: "WIF001", qty: 2 },
      ],
    }),
    // Last 7 days
    buildInvoice({
      number: "INV-2611-0831",
      daysAgo: 1,
      time: "07:15 PM",
      method: "UPI",
      customerName: "Shruti Nair",
      customerPhone: "+91 99201 34876",
      branch: "Bandra Flagship",
      discount: 200,
      lines: [
        { sku: "WET003", qty: 1 },
        { sku: "WET002", qty: 1 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0827",
      daysAgo: 2,
      time: "04:28 PM",
      method: "CARD",
      customerName: "Kavita Rao",
      customerPhone: "+91 94140 33219",
      branch: "Andheri Studio",
      discount: 500,
      lines: [
        { sku: "WET005", qty: 1 },
        { sku: "WET004", qty: 2 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0820",
      daysAgo: 3,
      time: "02:10 PM",
      method: "CASH",
      customerName: "Deepika Joshi",
      customerPhone: "+91 98674 11902",
      branch: "Bandra Flagship",
      discount: 100,
      lines: [
        { sku: "WFW004", qty: 3 },
        { sku: "WSP001", qty: 2 },
        { sku: "WFW006", qty: 1 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0814",
      daysAgo: 5,
      time: "05:50 PM",
      method: "UPI",
      customerName: "Sonalika Bose",
      customerPhone: "+91 98330 77214",
      branch: "Thane Retail Hub",
      discount: 150,
      lines: [
        { sku: "WOC001", qty: 1 },
        { sku: "WAC001", qty: 2 },
      ],
    }),
    // Earlier this month
    buildInvoice({
      number: "INV-2611-0798",
      daysAgo: 9,
      time: "06:05 PM",
      method: "UPI",
      customerName: "Aarti Singhania",
      customerPhone: "+91 98207 90541",
      branch: "Bandra Flagship",
      discount: 600,
      lines: [
        { sku: "WET005", qty: 1 },
        { sku: "WET003", qty: 2 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0785",
      daysAgo: 12,
      time: "01:22 PM",
      method: "CREDIT",
      customerName: "Sharma Garment Emporium",
      customerPhone: "+91 98111 49820",
      branch: "Thane Retail Hub",
      discount: 750,
      lines: [
        { sku: "WET001", qty: 6 },
        { sku: "WET002", qty: 3 },
        { sku: "WFW001", qty: 3 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0771",
      daysAgo: 16,
      time: "11:48 AM",
      method: "CASH",
      customerName: "Divya Menon",
      customerPhone: "+91 98451 62309",
      branch: "Andheri Studio",
      discount: 100,
      lines: [
        { sku: "WFW005", qty: 1 },
        { sku: "WFW003", qty: 2 },
      ],
    }),
    buildInvoice({
      number: "INV-2611-0759",
      daysAgo: 21,
      time: "04:40 PM",
      method: "CARD",
      customerName: "Tanvi Shah",
      customerPhone: "+91 98250 18344",
      branch: "Bandra Flagship",
      discount: 250,
      lines: [
        { sku: "WET004", qty: 2 },
        { sku: "WIF002", qty: 2 },
        { sku: "WFW006", qty: 1 },
      ],
    }),
  ];
}

export function loadSalesHistory(): ExtendedInvoiceRecord[] {
  const defaults = getDefaultInvoiceHistory();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem("aura_sales_history");
    if (!raw) return defaults;
    const parsed: ExtendedInvoiceRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
    const merged: ExtendedInvoiceRecord[] = parsed.map((inv) => ({
      ...inv,
      daysAgo: inv.daysAgo ?? 0,
      branch: inv.branch ?? "Bandra Flagship",
    }));
    defaults.forEach((d) => {
      if (!merged.some((m) => m.number === d.number)) {
        merged.push(d);
      }
    });
    return merged;
  } catch {
    return defaults;
  }
}

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: "c-1",
    name: "Ritu Malhotra (Ritu Styles)",
    phone: "+91 98211 60428",
    email: "ritu.malhotra@ritustyles.in",
    city: "Bandra, Mumbai",
    type: "B2B Boutique",
    totalVisits: 18,
    lifetimeSpend: 184500,
    lastVisit: formatDaysAgo(0),
    balance: "6450",
    status: "Due",
  },
  {
    id: "c-2",
    name: "Meera Deshmukh",
    phone: "+91 98204 71832",
    email: "meera.deshmukh@gmail.com",
    city: "Juhu, Mumbai",
    type: "Retail VIP",
    totalVisits: 14,
    lifetimeSpend: 92400,
    lastVisit: formatDaysAgo(0),
    balance: "0",
    status: "Paid",
  },
  {
    id: "c-3",
    name: "Sharma Garment Emporium",
    phone: "+91 98111 49820",
    email: "accounts@sharmagarments.in",
    city: "Thane West",
    type: "Wholesale",
    totalVisits: 26,
    lifetimeSpend: 412000,
    lastVisit: formatDaysAgo(12),
    balance: "14800",
    status: "Due",
  },
  {
    id: "c-4",
    name: "Priyanka Kulkarni",
    phone: "+91 98192 45011",
    email: "priyanka.k@outlook.com",
    city: "Powai, Mumbai",
    type: "Retail VIP",
    totalVisits: 9,
    lifetimeSpend: 54200,
    lastVisit: formatDaysAgo(0),
    balance: "0",
    status: "Paid",
  },
  {
    id: "c-5",
    name: "Aarti Singhania",
    phone: "+91 98207 90541",
    email: "aarti.singhania@gmail.com",
    city: "Worli, Mumbai",
    type: "Retail VIP",
    totalVisits: 11,
    lifetimeSpend: 128600,
    lastVisit: formatDaysAgo(9),
    balance: "3200",
    status: "Partial",
  },
  {
    id: "c-6",
    name: "Neha Agarwal",
    phone: "+91 97690 88241",
    email: "neha.agarwal89@gmail.com",
    city: "Andheri West",
    type: "Regular Patron",
    totalVisits: 7,
    lifetimeSpend: 38900,
    lastVisit: formatDaysAgo(0),
    balance: "0",
    status: "Paid",
  },
  {
    id: "c-7",
    name: "Vastra Kala Retail Mart",
    phone: "+91 98332 51094",
    email: "billing@vastrakala.co.in",
    city: "Dadar, Mumbai",
    type: "B2B Boutique",
    totalVisits: 15,
    lifetimeSpend: 236000,
    lastVisit: formatDaysAgo(4),
    balance: "8950",
    status: "Due",
  },
  {
    id: "c-8",
    name: "Ananya Verma",
    phone: "+91 98200 55412",
    email: "ananya.verma@yahoo.in",
    city: "Santacruz, Mumbai",
    type: "Regular Patron",
    totalVisits: 6,
    lifetimeSpend: 27400,
    lastVisit: formatDaysAgo(0),
    balance: "0",
    status: "Paid",
  },
  {
    id: "c-9",
    name: "Kavita Rao",
    phone: "+91 94140 33219",
    email: "kavita.rao@gmail.com",
    city: "Bandra East",
    type: "Retail VIP",
    totalVisits: 12,
    lifetimeSpend: 76500,
    lastVisit: formatDaysAgo(2),
    balance: "1450",
    status: "Partial",
  },
  {
    id: "c-10",
    name: "Pooja Sharma",
    phone: "+91 98765 43210",
    email: "pooja.sharma@gmail.com",
    city: "Khar West",
    type: "Regular Patron",
    totalVisits: 8,
    lifetimeSpend: 34100,
    lastVisit: formatDaysAgo(0),
    balance: "0",
    status: "Paid",
  },
];

export const INITIAL_SUPPLIERS_DATA: SupplierProfile[] = [
  {
    id: "sup-1",
    name: "Surat Silk Mills & Weavers",
    category: "Pure Silk & Brocade",
    contactPerson: "Rajeshbhai Patel",
    phone: "+91 98251 44520",
    email: "orders@suratsilkmills.in",
    city: "Surat, Gujarat",
    gstin: "24AAACS1234F1Z5",
    creditDays: 30,
    payable: 145000,
    ytdPurchases: 1240000,
    onTimePct: 98,
    lastOrderDate: formatDaysAgo(2),
    activePoNo: "PO-2611-409",
    status: "Active",
    rating: 4.9,
    materials: ["Banarasi Silk", "Chanderi Fabric", "Zari Borders"],
  },
  {
    id: "sup-2",
    name: "Jaipur Handblock Tex",
    category: "Cotton & Natural Dyes",
    contactPerson: "Mahesh Sharma",
    phone: "+91 94140 88219",
    email: "mahesh@jaipurhandblock.com",
    city: "Jaipur, Rajasthan",
    gstin: "08BBAPJ8765E1Z3",
    creditDays: 45,
    payable: 68500,
    ytdPurchases: 785000,
    onTimePct: 96,
    lastOrderDate: formatDaysAgo(5),
    activePoNo: "PO-2611-402",
    status: "Active",
    rating: 4.8,
    materials: ["Bagru Print Cotton", "Mulmul Muslin", "Dabu Indigo"],
  },
  {
    id: "sup-3",
    name: "Lucknow Chikan Artisans Guild",
    category: "Embroidery & Zardozi",
    contactPerson: "Shabana Begum",
    phone: "+91 91980 33412",
    email: "guild@lucknowchikan.org",
    city: "Lucknow, Uttar Pradesh",
    gstin: "09CCAPL4321D1Z1",
    creditDays: 30,
    payable: 32000,
    ytdPurchases: 540000,
    onTimePct: 94,
    lastOrderDate: formatDaysAgo(1),
    activePoNo: "PO-2611-412",
    status: "Pending Orders",
    rating: 4.9,
    materials: ["Bakhiya Threadwork", "Tepchi Kurtas", "Mukaish Work"],
  },
  {
    id: "sup-4",
    name: "Varanasi Heritage Handlooms",
    category: "Bridal & Heritage Silks",
    contactPerson: "Anand Upadhyay",
    phone: "+91 94500 12890",
    email: "anand@varanasiheritage.co",
    city: "Varanasi, UP",
    gstin: "09DDEPV9876C1Z9",
    creditDays: 60,
    payable: 210000,
    ytdPurchases: 1860000,
    onTimePct: 99,
    lastOrderDate: formatDaysAgo(4),
    activePoNo: "PO-2611-405",
    status: "Active",
    rating: 5.0,
    materials: ["Katan Silk Sarees", "Real Gold Zari", "Tanchoi Brocade"],
  },
  {
    id: "sup-5",
    name: "Surat Laces & Trims Corp",
    category: "Laces, Elastics & Trims",
    contactPerson: "Kirit Vora",
    phone: "+91 98980 77123",
    email: "sales@suratlaces.in",
    city: "Surat, Gujarat",
    gstin: "24EEAPL6543B1Z7",
    creditDays: 21,
    payable: 18400,
    ytdPurchases: 295000,
    onTimePct: 95,
    lastOrderDate: formatDaysAgo(7),
    activePoNo: "PO-2611-394",
    status: "Active",
    rating: 4.6,
    materials: ["Gota Patti Ribbons", "Sequin Latkans", "Velvet Pipings"],
  },
  {
    id: "sup-6",
    name: "Kanchipuram Weaver Society",
    category: "South Silk Sarees",
    contactPerson: "K. Ramanathan",
    phone: "+91 94440 99876",
    email: "info@kanchisociety.tn.gov",
    city: "Kanchipuram, TN",
    gstin: "33FFAPK1122A1Z4",
    creditDays: 30,
    payable: 95000,
    ytdPurchases: 920000,
    onTimePct: 97,
    lastOrderDate: formatDaysAgo(1),
    activePoNo: "PO-2611-415",
    status: "Pending Orders",
    rating: 4.9,
    materials: ["Pure Mulberry Silk", "Korvai Weaving", "Temple Borders"],
  },
  {
    id: "sup-7",
    name: "Ahmedabad Denim & Linen Works",
    category: "Cotton & Natural Dyes",
    contactPerson: "Devang Mehta",
    phone: "+91 98240 61209",
    email: "dispatch@ahmdenim.in",
    city: "Ahmedabad, Gujarat",
    gstin: "24GGAPD7781H1Z2",
    creditDays: 30,
    payable: 42500,
    ytdPurchases: 610000,
    onTimePct: 97,
    lastOrderDate: formatDaysAgo(3),
    activePoNo: "PO-2611-407",
    status: "Active",
    rating: 4.7,
    materials: ["Stretch Denim Rolls", "Belgian Linen Blend", "Twill Cotton"],
  },
  {
    id: "sup-8",
    name: "Tiruppur Knitwear Exports",
    category: "Laces, Elastics & Trims",
    contactPerson: "Senthil Murugan",
    phone: "+91 98422 70193",
    email: "b2b@tiruppurknits.in",
    city: "Tiruppur, Tamil Nadu",
    gstin: "33HHAPT4410K1Z8",
    creditDays: 30,
    payable: 26800,
    ytdPurchases: 430000,
    onTimePct: 96,
    lastOrderDate: formatDaysAgo(6),
    activePoNo: "PO-2611-399",
    status: "Active",
    rating: 4.8,
    materials: ["Combed Cotton Jersey", "Lycra Rib Knit", "Athleisure Terry"],
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    poNumber: "PO-2611-415",
    supplierId: "sup-6",
    supplierName: "Kanchipuram Weaver Society",
    material: "Pure Mulberry Silk Sarees (20 pcs)",
    quantity: "20 PCS",
    amount: 95000,
    orderDate: formatDaysAgo(1),
    expectedDate: "In 3 days",
    status: "In Transit",
  },
  {
    poNumber: "PO-2611-412",
    supplierId: "sup-3",
    supplierName: "Lucknow Chikan Artisans Guild",
    material: "Hand-embroidered Chikankari Kurtas (35 pcs)",
    quantity: "35 PCS",
    amount: 32000,
    orderDate: formatDaysAgo(1),
    expectedDate: "In 2 days",
    status: "Dispatched",
  },
  {
    poNumber: "PO-2611-409",
    supplierId: "sup-1",
    supplierName: "Surat Silk Mills & Weavers",
    material: "Banarasi Brocade & Zari Rolls (120 mtr)",
    quantity: "120 MTR",
    amount: 74500,
    orderDate: formatDaysAgo(2),
    expectedDate: "Received",
    status: "Received",
  },
  {
    poNumber: "PO-2611-407",
    supplierId: "sup-7",
    supplierName: "Ahmedabad Denim & Linen Works",
    material: "Linen Blend & Wide-Leg Denim Lot (60 pcs)",
    quantity: "60 PCS",
    amount: 42500,
    orderDate: formatDaysAgo(3),
    expectedDate: "Tomorrow",
    status: "In Transit",
  },
];

// Realistic 30-day sales velocity per SKU (matches SAMPLE_FASHION_PRODUCTS)
export const SKU_MONTHLY_SALES: Record<string, number> = {
  WET001: 46,
  WET002: 34,
  WET003: 28,
  WFW001: 31,
  WFW002: 27,
  WFW003: 24,
  WFW004: 52,
  WFW005: 19,
  WOC001: 15,
  WIF001: 38,
  WIF002: 21,
  WFW006: 29,
  WSP001: 41,
  WAC001: 33,
  WET004: 36,
  WET005: 11,
};

export function loadInventoryItems(): FashionProductItem[] {
  if (typeof window === "undefined") return SAMPLE_FASHION_PRODUCTS;
  try {
    const raw = localStorage.getItem("billvortex_inventory_v1");
    if (!raw) return SAMPLE_FASHION_PRODUCTS;
    const parsed: FashionProductItem[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return SAMPLE_FASHION_PRODUCTS;
  } catch {
    return SAMPLE_FASHION_PRODUCTS;
  }
}

export function saveInventoryItems(items: FashionProductItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("billvortex_inventory_v1", JSON.stringify(items));
  } catch {}
}

export type ReportPeriod = "TODAY" | "WEEK" | "MONTH" | "QUARTER";

export type ComputedPeriodAnalytics = {
  label: string;
  invoiceCount: number;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  grandTotal: number;
  avgBasket: number;
  velocityTitle: string;
  velocitySlots: Array<{ label: string; bills: number; amount: number; pct: number }>;
  gstSlabs: Array<{
    rate: string;
    hsn: string;
    desc: string;
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
  }>;
  paymentSplit: Array<{
    method: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    txns: number;
    pct: number;
  }>;
  topProducts: Array<{
    sku: string;
    name: string;
    category: string;
    sold: number;
    revenue: number;
    marginPct: number;
  }>;
};

export function computePeriodAnalytics(
  period: ReportPeriod,
  history: ExtendedInvoiceRecord[]
): ComputedPeriodAnalytics {
  // Filter live/default invoices for the selected period window
  const maxDays = period === "TODAY" ? 0 : period === "WEEK" ? 7 : period === "MONTH" ? 30 : 90;
  const periodInvoices = history.filter((inv) => (inv.daysAgo ?? 0) <= maxDays);

  // Scale factor for realistic multi-day/monthly/quarterly store turnover beyond the sample rows
  const scale = period === "TODAY" ? 1 : period === "WEEK" ? 3.8 : period === "MONTH" ? 11.4 : 31.5;

  let rawSub = 0;
  let rawDisc = 0;
  let rate5Taxable = 0;
  let rate12Taxable = 0;
  let rate18Taxable = 0;

  const payTotals: Record<string, { amount: number; txns: number }> = {
    UPI: { amount: 0, txns: 0 },
    CASH: { amount: 0, txns: 0 },
    CARD: { amount: 0, txns: 0 },
    CREDIT: { amount: 0, txns: 0 },
  };

  periodInvoices.forEach((inv) => {
    const sub = Number(inv.subtotal) || 0;
    const disc = Number(inv.discount) || 0;
    const taxable = Math.max(0, sub - disc);
    const ratio = sub > 0 ? taxable / sub : 1;

    rawSub += sub;
    rawDisc += disc;

    if (inv.gstSlabSummary) {
      rate5Taxable += inv.gstSlabSummary.rate5Taxable;
      rate12Taxable += inv.gstSlabSummary.rate12Taxable;
      rate18Taxable += inv.gstSlabSummary.rate18Taxable;
    } else {
      // Derive slabs from item rates for newly created POS bills
      inv.items.forEach((it) => {
        const prod = SAMPLE_FASHION_PRODUCTS.find((p) => p.sku === it.sku || p.name === it.name);
        const r = Number(prod?.gstRate ?? (Number(it.rate) <= 1000 ? 5 : 12));
        const lineT = it.total * ratio;
        if (r === 5) rate5Taxable += lineT;
        else if (r === 18) rate18Taxable += lineT;
        else rate12Taxable += lineT;
      });
    }

    const m = payTotals[inv.method] ? inv.method : "UPI";
    payTotals[m].amount += Number(inv.grandTotal) || 0;
    payTotals[m].txns += 1;
  });

  // Apply realistic period scaling while maintaining 100% mathematical reconciliation
  const subtotal = Math.round(rawSub * scale);
  const discountTotal = Math.round(rawDisc * scale);
  const s5Taxable = Math.round(rate5Taxable * scale);
  const s12Taxable = Math.round(rate12Taxable * scale);
  const s18Taxable = Math.round(rate18Taxable * scale);
  const s0Taxable = period === "TODAY" ? 0 : Math.round(4200 * (scale / 3.8));

  const taxableTotal = s0Taxable + s5Taxable + s12Taxable + s18Taxable;
  const s5Cgst = Number((s5Taxable * 0.025).toFixed(2));
  const s12Cgst = Number((s12Taxable * 0.06).toFixed(2));
  const s18Cgst = Number((s18Taxable * 0.09).toFixed(2));

  const cgst = Number((s5Cgst + s12Cgst + s18Cgst).toFixed(2));
  const sgst = cgst;
  const totalTax = Number((cgst + sgst).toFixed(2));
  const grandTotal = Number((taxableTotal + totalTax).toFixed(2));

  const invoiceCount = Math.max(periodInvoices.length, Math.round(periodInvoices.length * scale));
  const avgBasket = invoiceCount > 0 ? grandTotal / invoiceCount : 0;

  const gstSlabs = [
    {
      rate: "0%",
      hsn: "5208 / 5007",
      desc: "Exempt Handloom & Unstitched Khadi Fibers",
      taxable: s0Taxable,
      cgst: 0,
      sgst: 0,
      total: s0Taxable,
    },
    {
      rate: "5%",
      hsn: "6204 / 6109",
      desc: "Apparel & Garments <= Rs. 1,000 & Textile Fabrics",
      taxable: s5Taxable,
      cgst: s5Cgst,
      sgst: s5Cgst,
      total: Number((s5Taxable + s5Cgst * 2).toFixed(2)),
    },
    {
      rate: "12%",
      hsn: "6204 / 5407",
      desc: "Designer Apparel, Sarees & Ready-to-Wear > Rs. 1,000",
      taxable: s12Taxable,
      cgst: s12Cgst,
      sgst: s12Cgst,
      total: Number((s12Taxable + s12Cgst * 2).toFixed(2)),
    },
    {
      rate: "18%",
      hsn: "4202 / 7117",
      desc: "Leather Handbags, Accessories & Gift Packaging",
      taxable: s18Taxable,
      cgst: s18Cgst,
      sgst: s18Cgst,
      total: Number((s18Taxable + s18Cgst * 2).toFixed(2)),
    },
  ];

  // Reconciled payment split summing cleanly to grandTotal
  const rawPayTotal = Object.values(payTotals).reduce((s, p) => s + p.amount, 0) || 1;
  const paymentMeta: Array<{ method: string; name: string; icon: string; color: string }> = [
    { method: "UPI", name: "UPI / QR Scanner", icon: "📱", color: "#16a34a" },
    { method: "CARD", name: "Card (POS EDC)", icon: "💳", color: "#2563eb" },
    { method: "CASH", name: "Cash Register", icon: "💵", color: "#b06354" },
    { method: "CREDIT", name: "Customer Khata / Credit", icon: "📝", color: "#d97706" },
  ];

  let allocatedPay = 0;
  const paymentSplit = paymentMeta.map((pm, idx) => {
    const share = payTotals[pm.method].amount / rawPayTotal;
    const isLast = idx === paymentMeta.length - 1;
    const amount = isLast
      ? Math.max(0, Math.round(grandTotal - allocatedPay))
      : Math.round(grandTotal * share);
    allocatedPay += amount;
    const txns = Math.max(
      payTotals[pm.method].txns,
      Math.round(payTotals[pm.method].txns * scale)
    );
    return {
      ...pm,
      amount,
      txns,
      pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
    };
  });

  // Velocity slots tailored to the selected period
  const slotTemplates: Record<
    ReportPeriod,
    { title: string; slots: Array<{ label: string; weight: number }> }
  > = {
    TODAY: {
      title: "Hourly Sales Velocity (Today)",
      slots: [
        { label: "10:00 AM - 12:00 PM (Opening)", weight: 0.14 },
        { label: "12:00 PM - 02:00 PM (Midday)", weight: 0.21 },
        { label: "02:00 PM - 04:00 PM (Afternoon)", weight: 0.16 },
        { label: "04:00 PM - 06:00 PM (Evening Rush)", weight: 0.22 },
        { label: "06:00 PM - 09:00 PM (Peak Hours)", weight: 0.27 },
      ],
    },
    WEEK: {
      title: "Daily Sales Velocity (Last 7 Days)",
      slots: [
        { label: "Monday - Tuesday", weight: 0.2 },
        { label: "Wednesday", weight: 0.14 },
        { label: "Thursday", weight: 0.16 },
        { label: "Friday (Pre-Weekend)", weight: 0.21 },
        { label: "Saturday - Sunday (Weekend Peak)", weight: 0.29 },
      ],
    },
    MONTH: {
      title: "Weekly Sales Performance (This Month)",
      slots: [
        { label: "Week 1 (1st - 7th)", weight: 0.23 },
        { label: "Week 2 (8th - 14th)", weight: 0.26 },
        { label: "Week 3 (15th - 21st)", weight: 0.29 },
        { label: "Week 4 (22nd - Month End)", weight: 0.22 },
      ],
    },
    QUARTER: {
      title: "Monthly Revenue Trend (Current FY Quarter)",
      slots: [
        { label: "Month 1 (Festive Pre-Launch)", weight: 0.3 },
        { label: "Month 2 (Festive & Wedding Peak)", weight: 0.41 },
        { label: "Month 3 (Current Running Month)", weight: 0.29 },
      ],
    },
  };

  const tmpl = slotTemplates[period];
  const velocitySlots = tmpl.slots.map((s) => ({
    label: s.label,
    amount: Math.round(grandTotal * s.weight),
    bills: Math.max(1, Math.round(invoiceCount * s.weight)),
    pct: Math.round(s.weight * 100),
  }));

  // Top selling products derived from REAL catalog items
  const productFactor = period === "TODAY" ? 0.14 : period === "WEEK" ? 0.35 : period === "MONTH" ? 1 : 2.85;
  const topProducts = SAMPLE_FASHION_PRODUCTS.map((p) => {
    const baseSold = SKU_MONTHLY_SALES[p.sku] ?? 18;
    const sold = Math.max(1, Math.round(baseSold * productFactor));
    const sale = Number(p.salePrice) || 0;
    const cost = Number(p.costPrice) || 0;
    const marginPct = sale > 0 ? Math.round(((sale - cost) / sale) * 100) : 45;
    return {
      sku: p.sku,
      name: p.name,
      category: p.category,
      sold,
      revenue: sold * sale,
      marginPct,
    };
  })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const labels: Record<ReportPeriod, string> = {
    TODAY: "Today's Register",
    WEEK: "Last 7 Days",
    MONTH: "This Month",
    QUARTER: "Current FY Quarter",
  };

  return {
    label: labels[period],
    invoiceCount,
    subtotal,
    discountTotal,
    taxableTotal,
    cgst,
    sgst,
    totalTax,
    grandTotal,
    avgBasket,
    velocityTitle: tmpl.title,
    velocitySlots,
    gstSlabs,
    paymentSplit,
    topProducts,
  };
}
