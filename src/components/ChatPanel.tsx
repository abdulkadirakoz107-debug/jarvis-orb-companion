import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { OrbState } from "./Orb";
import { speak, stopSpeaking } from "@/lib/voice";
import { isSpeechRecognitionSupported, startListening, type Listener } from "@/lib/speech";
import { getWeather } from "@/lib/weather";
import { askJarvis } from "@/lib/ai.functions";

export type Msg = {
  id: string;
  role: "user" | "jarvis" | "system";
  text: string;
  ts: number;
  kind?: "text" | "error" | "action";
  imageUrl?: string; // data URL
};

type Props = {
  onStateChange: (s: OrbState) => void;
  muted: boolean;
  shutdown: boolean;
};

type CmdResult = { reply: string; kind?: "error" | "action"; orb: OrbState };

type AskAI = (input: {
  data: { messages: { role: "user" | "assistant" | "system"; content: string; imageUrl?: string }[] };
}) => Promise<{ reply: string }>;

async function processCommand(
  input: string,
  history: Msg[],
  askAI: AskAI,
  imageUrl?: string,
): Promise<CmdResult> {
  const raw = input.trim();
  const cmd = raw.toLowerCase();

  // Görsel varsa doğrudan AI'a (görsel analiz)
  if (imageUrl) {
    try {
      const convo: { role: "assistant" | "user"; content: string; imageUrl?: string }[] = history
        .filter((m) => m.role === "user" || m.role === "jarvis")
        .slice(-6)
        .map((m) => ({
          role: m.role === "jarvis" ? "assistant" : "user",
          content: m.text,
        }));
      convo.push({
        role: "user",
        content: raw || "Bu görselde ne görüyorsun? Türkçe açıkla.",
        imageUrl,
      });
      const { reply } = await askAI({ data: { messages: convo } });
      return { reply, orb: "speaking" };
    } catch (e) {
      return { reply: (e as Error).message || "Görsel analiz edilemedi.", kind: "error", orb: "error" };
    }
  }

  if (!cmd) return { reply: "Lütfen bir komut girin efendim.", kind: "error", orb: "error" };

  const openMatch = cmd.match(/^(?:aç|open|başlat)\s+(.+)/);
  if (openMatch) {
    return { reply: `🚀 ${openMatch[1]} uygulaması başlatılıyor... (simülasyon)`, kind: "action", orb: "speaking" };
  }

  if (/^(müzik|music|şarkı|çal)\b/.test(cmd) || /(müzik çal|şarkı çal)/.test(cmd)) {
    const tracks = ["Daft Punk - Aerodynamic", "Hans Zimmer - Time", "TOOL - Pneuma", "Interstellar OST"];
    const t = tracks[Math.floor(Math.random() * tracks.length)];
    return { reply: `🎵 Şu an çalınıyor: "${t}"`, kind: "action", orb: "speaking" };
  }

  const msgMatch = cmd.match(/(?:mesaj gönder|send message|sms)\s+(\S+)\s+(.+)/);
  if (msgMatch) {
    return { reply: `✉️ ${msgMatch[1]} kişisine mesaj gönderildi: "${msgMatch[2]}"`, kind: "action", orb: "speaking" };
  }

  if (/(hava durumu|weather|hava nasıl)/.test(cmd) || /^hava\b/.test(cmd)) {
    const m = cmd.match(/(?:hava(?:sı)?|weather)\s+([a-zçğıöşü\s]+)/i);
    let city = m?.[1]?.trim();
    if (!city) {
      const known = ["istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya", "trabzon"];
      city = known.find((c) => cmd.includes(c)) ?? "istanbul";
    }
    try {
      const reply = await getWeather(city);
      return { reply, kind: "action", orb: "speaking" };
    } catch (e) {
      return { reply: `Hava durumu alınamadı: ${(e as Error).message}`, kind: "error", orb: "error" };
    }
  }

  if (/^(sistem bilgisi|system info|cpu|ram|bellek)\b/.test(cmd)) {
    const cpu = (Math.random() * 60 + 10).toFixed(0);
    const ram = (Math.random() * 50 + 30).toFixed(0);
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "?";
    return {
      reply: `🖥️ Sistem Durumu\n• CPU: %${cpu}\n• RAM: %${ram} (${mem} GB)\n• Tarayıcı: ${navigator.userAgent.split(" ").slice(-2).join(" ")}\n• Çekirdek: ${navigator.hardwareConcurrency}`,
      kind: "action",
      orb: "speaking",
    };
  }

  if (cmd === "help" || cmd === "yardım") {
    return {
      reply:
        "Bana her şeyi sorabilirsiniz efendim. Görsel de yollayabilirsiniz. Özel komutlar:\n• aç <uygulama>\n• müzik çal\n• mesaj gönder <isim> <metin>\n• hava <şehir>\n• sistem bilgisi\n• terminal: echo, date, whoami, pwd, ls",
      orb: "speaking",
    };
  }
  if (cmd === "date" || cmd === "tarih") return { reply: new Date().toString(), orb: "speaking" };
  if (cmd === "whoami") return { reply: "tony.stark", orb: "speaking" };
  if (cmd === "pwd") return { reply: "/home/sir", orb: "speaking" };
  if (cmd === "ls") return { reply: "Documents  Lab  Suits  Workshop", orb: "speaking" };
  if (cmd.startsWith("echo ")) return { reply: cmd.slice(5), orb: "speaking" };

  // Geri kalan her şey için AI Gateway
  try {
    const convo = history
      .filter((m) => m.role === "user" || m.role === "jarvis")
      .slice(-8)
      .map((m) => ({
        role: (m.role === "jarvis" ? "assistant" : "user") as "assistant" | "user",
        content: m.text,
      }));
    convo.push({ role: "user", content: raw });
    const { reply } = await askAI({ data: { messages: convo } });
    return { reply, orb: "speaking" };
  } catch (e) {
    return { reply: (e as Error).message || "Bir hata oluştu efendim.", kind: "error", orb: "error" };
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

export function ChatPanel({ onStateChange, muted, shutdown }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", role: "system", text: "J.A.R.V.I.S sistemi başlatıldı. Komutlarınız bekleniyor.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const listenerRef = useRef<Listener | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const askAI = useServerFn(askJarvis);

  useEffect(() => {
    setVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  // Otomatik aşağı kaydır - sadece kullanıcı zaten en alttaysa
  useEffect(() => {
    if (!autoScroll) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partial, autoScroll]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(nearBottom);
  };

  const submit = async (text: string, imageUrl?: string | null) => {
    if ((!text.trim() && !imageUrl) || shutdown) return;
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || (imageUrl ? "[görsel]" : ""),
      ts: Date.now(),
      imageUrl: imageUrl ?? undefined,
    };
    setMessages((m) => [...m, userMsg]);
    setAutoScroll(true);

    onStateChange("thinking");
    const { reply, kind, orb } = await processCommand(text, messages, askAI, imageUrl ?? undefined);
    const reMsg: Msg = { id: crypto.randomUUID(), role: "jarvis", text: reply, ts: Date.now(), kind };
    setMessages((m) => [...m, reMsg]);

    if (muted) {
      onStateChange("muted");
      return;
    }

    if (kind === "error") {
      onStateChange("error");
      setTimeout(() => {
        speak(reply, {
          onStart: () => onStateChange("speaking"),
          onEnd: () => onStateChange(listening ? "thinking" : "idle"),
        });
      }, 600);
    } else {
      speak(reply, {
        onStart: () => onStateChange(orb),
        onEnd: () => onStateChange(listening ? "thinking" : "idle"),
      });
    }
  };

  const send = () => {
    const text = input;
    const img = pendingImage;
    setInput("");
    setPendingImage(null);
    void submit(text, img);
  };

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "system", text: "Görsel 8MB'tan büyük olamaz.", ts: Date.now() },
      ]);
      return;
    }
    const url = await fileToDataUrl(file);
    setPendingImage(url);
  };

  const toggleMic = () => {
    if (shutdown) return;
    if (listening) {
      listenerRef.current?.stop();
      listenerRef.current = null;
      setListening(false);
      onStateChange("idle");
      return;
    }
    stopSpeaking();
    setPartial("");
    onStateChange("thinking");
    const l = startListening({
      continuous: true,
      onPartial: (t) => setPartial(t),
      onResult: (t) => {
        setPartial("");
        // Mikrofon açık kalır; sadece bu cümleyi işle
        void submit(t, null);
      },
      onError: (err) => {
        setPartial("");
        setListening(false);
        onStateChange("error");
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "system", text: `🎙️ Mikrofon hatası: ${err}`, ts: Date.now() },
        ]);
        setTimeout(() => onStateChange("idle"), 1500);
      },
      onEnd: () => {
        setListening(false);
        setPartial("");
      },
    });
    if (l) {
      listenerRef.current = l;
      setListening(true);
    } else {
      onStateChange("idle");
    }
  };

  useEffect(() => {
    if (muted || shutdown) {
      stopSpeaking();
      listenerRef.current?.stop();
      listenerRef.current = null;
      setListening(false);
    }
  }, [muted, shutdown]);

  return (
    <div className="glass rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="display text-jarvis-blue text-glow text-sm tracking-widest">COMM // CHAT</div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${listening ? "bg-jarvis-red" : "bg-jarvis-blue"} animate-pulse`} />
          <span className="text-xs text-muted-foreground">{listening ? "LISTENING" : "CONNECTED"}</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin"
        style={{ touchAction: "pan-y" }}
      >
        {messages.map((m) => (
          <div key={m.id} className={`text-sm leading-relaxed ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary/20 border border-primary/40 text-foreground"
                  : m.role === "system"
                  ? "bg-muted/40 text-muted-foreground text-xs italic"
                  : m.kind === "error"
                  ? "bg-destructive/20 border border-destructive/50 text-destructive-foreground"
                  : "bg-accent/30 border border-jarvis-blue/30"
              }`}
            >
              {m.role === "jarvis" && (
                <div className="text-[10px] tracking-widest text-jarvis-blue mb-1 display">JARVIS</div>
              )}
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="görsel"
                  className="mb-2 max-h-48 rounded border border-jarvis-blue/40"
                />
              )}
              {m.text}
            </div>
          </div>
        ))}
        {partial && (
          <div className="text-right text-sm">
            <div className="inline-block max-w-[85%] px-3 py-2 rounded-lg bg-jarvis-yellow/10 border border-jarvis-yellow/40 text-jarvis-yellow italic">
              🎙️ {partial}…
            </div>
          </div>
        )}
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            }}
            className="sticky bottom-0 mx-auto block text-[10px] display tracking-widest text-jarvis-blue bg-background/70 px-2 py-1 rounded border border-jarvis-blue/40"
          >
            ↓ EN ALTA
          </button>
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {pendingImage && (
          <div className="flex items-center gap-2 p-2 rounded border border-jarvis-blue/40 bg-accent/20">
            <img src={pendingImage} alt="ek" className="h-12 w-12 object-cover rounded" />
            <span className="text-xs text-muted-foreground flex-1">Görsel hazır — bir şey sorabilir veya direkt yollayabilirsiniz.</span>
            <button
              onClick={() => setPendingImage(null)}
              className="text-xs text-jarvis-red display tracking-widest"
            >
              ✕ KALDIR
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            disabled={shutdown || !voiceSupported}
            title={voiceSupported ? "Sürekli sesli sohbet" : "Tarayıcınız desteklemiyor"}
            className="display text-xs px-2 py-1 rounded border transition disabled:opacity-30"
            style={{
              color: listening ? "var(--jarvis-red)" : "var(--jarvis-blue)",
              borderColor: listening ? "var(--jarvis-red)" : "var(--jarvis-blue)",
              boxShadow: listening ? "0 0 14px var(--jarvis-red)" : "none",
              background: listening ? "color-mix(in oklab, var(--jarvis-red) 18%, transparent)" : "transparent",
            }}
          >
            {listening ? "● REC" : "🎙 MIC"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={shutdown}
            title="Görsel ekle"
            className="display text-xs px-2 py-1 rounded border border-jarvis-blue text-jarvis-blue disabled:opacity-30"
          >
            🖼 IMG
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="text-jarvis-blue display text-sm">{">"}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={shutdown}
            placeholder={
              shutdown
                ? "Sistem kapalı..."
                : listening
                ? "Dinleniyor — istediğiniz kadar konuşun..."
                : pendingImage
                ? "Görsel hakkında bir şey sorun veya boş bırakıp gönderin..."
                : "Komut girin, soru sorun veya görsel ekleyin..."
            }
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60 disabled:opacity-40"
          />
          <button
            onClick={send}
            disabled={shutdown}
            className="display text-xs tracking-widest text-jarvis-blue hover:text-glow disabled:opacity-30 transition"
          >
            SEND ↵
          </button>
        </div>
      </div>
    </div>
  );
}
