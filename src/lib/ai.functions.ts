import { createServerFn } from "@tanstack/react-start";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export const askJarvis = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMsg[] }) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("messages required");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");

    const systemPrompt =
      "Sen J.A.R.V.I.S'sin — Tony Stark'ın zarif, zeki ve hafif esprili Türkçe konuşan yapay zekâ asistanısın. " +
      "Kullanıcıya 'efendim' diye hitap edersin. Cevapların kısa, net ve sesli okunmaya uygun olsun (1-3 cümle). " +
      "Markdown, madde işareti ve emoji kullanma; düz metinle konuş.";

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...data.messages.slice(-10),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (res.status === 429) throw new Error("Şu an çok yoğunum efendim, biraz sonra tekrar deneyin.");
    if (res.status === 402) throw new Error("Kredi limiti doldu. Lovable AI ayarlarından kredi ekleyin.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI hatası: ${res.status} ${t.slice(0, 120)}`);
    }
    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "Yanıt alınamadı efendim.";
    return { reply };
  });
