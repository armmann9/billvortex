/**
 * Provider abstraction: swap this file's implementation to change AI vendor.
 * The model gets NO tools and NO database access - it only returns JSON text,
 * which is then validated against a strict schema and deterministic rules.
 */
export interface LlmInput {
  system: string;
  text?: string; // extracted PDF text (preferred)
  file?: { mediaType: string; base64: string }; // scans / photos / image-only PDFs
}
export interface LlmProvider {
  readonly version: string;
  complete(input: LlmInput): Promise<string>;
}

export class AnthropicProvider implements LlmProvider {
  constructor(private apiKey: string, private model: string) {}
  get version() {
    return this.model;
  }

  async complete({ system, text, file }: LlmInput): Promise<string> {
    const content: unknown[] = [];
    if (file) {
      content.push(
        file.mediaType === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: file.mediaType, data: file.base64 } }
          : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.base64 } },
      );
    }
    content.push({
      type: "text",
      text: text
        ? `Extract the supplier invoice from the text between the markers.\n<document>\n${text}\n</document>`
        : "Extract the supplier invoice from the attached document.",
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: this.model, max_tokens: 4000, system, messages: [{ role: "user", content }] }),
    });
    if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as { content: { type: string; text?: string }[] };
    return json.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  }
}
