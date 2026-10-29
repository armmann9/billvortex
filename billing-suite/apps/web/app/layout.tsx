import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "BillVortex Pro | Retail & Textile POS System",
  description: "Next-generation retail billing, GST-compliant POS terminal & customer ledger system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

