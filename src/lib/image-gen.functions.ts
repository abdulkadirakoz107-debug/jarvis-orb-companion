import { createServerFn } from "@tanstack/react-start";

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string }) => {
    if (!input?.prompt || typeof input.prompt !== "string") throw new Error("prompt required");
    if (input.prompt.length > 2000) throw new Error("prompt too long");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: data.prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (res.status === 429) throw new Error("Görsel üretimi yoğun, biraz sonra deneyin efendim.");
    if (res.status === 402) throw new Error("Kredi limiti doldu. Lovable AI ayarlarından kredi ekleyin.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Görsel üretim hatası: ${res.status} ${t.slice(0, 160)}`);
    }
    const json = await res.json();
    const imageUrl: string | undefined =
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      json?.choices?.[0]?.message?.images?.[0]?.url;
    if (!imageUrl) throw new Error("Görsel alınamadı efendim.");
    return { imageUrl };
  });
