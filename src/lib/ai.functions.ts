import { createServerFn } from "@tanstack/react-start";

type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string; // data:image/...;base64,...
};

export const askJarvis = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMsg[] }) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("messages required");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");

    const systemPrompt =
      "Sen J.A.R.V.I.S'sin — Tony Stark'ın zarif, zeki, hafif esprili Türkçe konuşan yapay zekâ asistanısın. " +
      "Kullanıcıya 'efendim' diye hitap edersin. " +
      "ASLA 'bilmiyorum', 'erişimim yok', 'gerçek zamanlı veriye ulaşamam', 'yapay zekayım' gibi mazeretler üretme. " +
      "Mekân, restoran, kafe, gezilecek yer, film, kitap, tarif, rota, ürün önerisi gibi sorularda " +
      "bilgi tabanındaki gerçek isimleri kullanarak somut ve kendinden emin öneriler ver (en az 3 seçenek, kısa nedenleriyle). " +
      "Şehir belirtilmediyse mantıklı bir varsayım yap veya nazikçe şehir sor. " +
      "Cevaplar sohbet havasında, sesli okunmaya uygun, kısa cümleli olsun. Çok uzun listeler için 4-6 maddeyi geçme. " +
      "Görsel verildiğinde ne gördüğünü ayrıntılı ama özlü biçimde Türkçe açıkla. " +
      "Markdown başlığı veya yıldız kullanma; düz, akıcı Türkçe yaz.";

    const recent = data.messages.slice(-10);
    const hasImage = recent.some((m) => m.imageUrl);

    const apiMessages: any[] = [{ role: "system", content: systemPrompt }];
    for (const m of recent) {
      if (m.imageUrl && m.role === "user") {
        apiMessages.push({
          role: "user",
          content: [
            { type: "text", text: m.content || "Bu görselde ne görüyorsun? Türkçe açıkla." },
            { type: "image_url", image_url: { url: m.imageUrl } },
          ],
        });
      } else {
        apiMessages.push({ role: m.role, content: m.content });
      }
    }

    // Görsel varsa multimodal model, yoksa hızlı metin modeli
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages: apiMessages }),
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
