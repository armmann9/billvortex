function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const stripped = value.replace(/[^\d+]/g, "");
  if (stripped.length >= 10) return stripped;
  return null;
}

export async function sendInvoiceSms({
  customerPhone,
  invoiceNumber,
  total,
}: {
  customerPhone?: string | null;
  invoiceNumber: string;
  total: string;
}) {
  const phone = normalizePhone(customerPhone);
  if (!phone) {
    return { sent: false, reason: "No customer phone number" };
  }

  const provider = process.env.SMS_PROVIDER ?? "demo";
  const message = `Your invoice ${invoiceNumber} for ₹${total} is ready. Thank you.`;

  if (provider === "demo" || provider === "console") {
    console.log(`[SMS demo] -> ${phone}: ${message}`);
    return { sent: true, provider: "demo", phone, message };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;

    if (!sid || !token || !from) {
      console.warn("Twilio SMS configured but missing credentials; skipping send.");
      return { sent: false, reason: "Twilio not configured" };
    }

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }).toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message ?? `Twilio SMS failed (${res.status})`);
    }

    return { sent: true, provider: "twilio", phone, message, sid };
  }

  console.log(`[SMS ${provider}] -> ${phone}: ${message}`);
  return { sent: true, provider, phone, message };
}
