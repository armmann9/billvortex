# 🌸 BillVortex — Boutique Billing & Retail POS Suite

An editorial, high-speed Point-of-Sale (POS) and boutique management platform designed specifically for women's fashion boutiques, apparel designers, saree showrooms, and textile retail stores.

---

## ⚡ How to Open and Run Easily

### Option 1: One-Click Launch (Sabse Aasan Tarika)
Bas is file par **double-click** karein:
```
start.bat
```
> Server automatically start ho jayega aur 3 seconds me aapke browser me **http://localhost:3000** khul jayega!

---

### 🔑 Demo Login ID & Password:
Jab aap POS ya Inventory par click karenge, toh sign-in maangega. Aap is ID se login kar sakte hain:
- **Email / ID:** `demo@billvortex.com`
- **Password:** `demo123`
- Ya fir website par **⚡ One-Click Demo Sign In** button dabayein!

---

### Option 2: Terminal Se Start Karna
Terminal ya Command Prompt open karke ye command run karein:

```bash
npm run dev:web --prefix billing-suite
```

Fir browser me jaake ye link open karein:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 🇮🇳 Hinglish Guide (Step-by-Step):
1. **Start karna:** `start.bat` par double click karein.
2. **Billing counter kholna:** Browser me **http://localhost:3000/pos** par jayein.
3. **Apparel select karein:** Grid me photo aur kapde ka naam dekh kar `+ Add to Bill` par click karein.
4. **Discount dena:** Agar discount dena ho toh bill discount drawer se `%` ya flat `₹` chunein (e.g. `5%`, `10%`, `₹100`).
5. **Bill nikalna aur WhatsApp bhejna:** Customer ka phone number daalein aur `Complete Payment & WhatsApp Bill` par click karein. Zero paper waste me direct customer ke WhatsApp par sundar invoice chala jayega!

---

## 🧭 Direct Page Links

| Section | URL | Description |
|---|---|---|
| **🌸 Boutique Landing & About** | `http://localhost:3000` | Editorial showcase, feature cards, and brand about section |
| **🧾 Quick Bill (POS Counter)** | `http://localhost:3000/pos` | Touch product grid with real photos, discount drawer, WhatsApp dispatch |
| **📊 Live Store Overview** | `http://localhost:3000/dashboard` | Real-time sales velocity, live invoice logs, GSTR-1 CSV export |
| **📦 Fashion Inventory Master** | `http://localhost:3000/inventory` | Size, color, fabric taxonomy, stock level counts & alerts |
| **👥 Customer Khata Ledger** | `http://localhost:3000/customers` | Receivables tracking & WhatsApp payment reminders |
| **🚚 Textile Suppliers & Mills** | `http://localhost:3000/suppliers` | Banarasi silk, Jaipur handblock & Lucknow chikan mill vendors |
| **🏛️ GST & Tax Reports** | `http://localhost:3000/reports` | 5% / 12% GST slab reconciliation, Z-reports, payment splits |
| **✨ About BillVortex** | `http://localhost:3000/about` | Capabilities, design architecture, and specs |

---

## 🌟 Key Highlights & Features

1. **Luxury Boutique Design System**:
   - Warm cream canvas (`#faf7f2`), white boutique cards with soft borders (`#ebdcd0`), terracotta accents (`#b06354`), and serif typography (`Playfair Display`).
2. **Apparel Product Cards**:
   - High-definition individual photography for all 18 catalog garments with product name and SKU directly underneath each image.
3. **Bill Discount Feature**:
   - Cashiers can easily apply discounts as a percentage (`%`) or flat amount (`₹`) with 1-click preset buttons (`5%`, `10%`, `15%`, `₹100`, `₹250`).
4. **Paperless WhatsApp Invoicing**:
   - Instant digital tax invoice generation sent straight to the customer's WhatsApp with zero paper waste.
5. **Deterministic GST Engine**:
   - Compliant Indian GST calculation (2.5% + 2.5% CGST/SGST on garments below ₹1,000; 6% + 6% on luxury items above ₹1,000).
