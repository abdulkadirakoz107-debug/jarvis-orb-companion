import { createServerFn } from "@tanstack/react-start";

type GenInput = {
  prompt: string;
  imageUrl?: string; // varsa düzenleme modu
  model?: "fast" | "pro"; // fast = nano banana, pro = yüksek kalite
};

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((input: GenInput) => {
    if (!input?.prompt || typeof input.prompt !== "string") throw new Error("prompt required");
    if (input.prompt.length > 2000) throw new Error("prompt too long");
    if (input.imageUrl && !input.imageUrl.startsWith("data:image/")) throw new Error("invalid image");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");

    const model =
      data.model === "pro"
        ? "google/gemini-3-pro-image-preview"
        : "google/gemini-2.5-flash-image-preview";

    const userContent: any[] = [
      {
        type: "text",
        text: data.imageUrl
          ? `Bu görseli aşağıdaki talimata göre düzenle. Sadece istenen değişikliği uygula, kompozisyonu ve stili koru. Talimat: ${data.prompt}`
          : `Yüksek kaliteli, detaylı, sinematik bir görsel üret. Konu: ${data.prompt}. Net kompozisyon, gerçekçi ışık, zengin renk.`,
      },
    ];
    if (data.imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: data.imageUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userContent }],
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
    const msg = json?.choices?.[0]?.message;
    const imageUrl: string | undefined =
      msg?.images?.[0]?.image_url?.url ?? msg?.images?.[0]?.url;
    if (!imageUrl) throw new Error("Görsel alınamadı efendim.");
    const note: string = typeof msg?.content === "string" ? msg.content : "";
    return { imageUrl, note };
  });
