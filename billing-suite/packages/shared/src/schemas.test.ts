import { describe, expect, it } from "vitest";
import { createInvoiceSchema } from "./schemas";

describe("createInvoiceSchema", () => {
  it("preserves a customer phone number for SMS delivery", () => {
    const parsed = createInvoiceSchema.parse({
      customerPhone: "+91 98765 43210",
      lines: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          quantity: "1",
        },
      ],
    });

    expect(parsed.customerPhone).toBe("+91 98765 43210");
  });
});
