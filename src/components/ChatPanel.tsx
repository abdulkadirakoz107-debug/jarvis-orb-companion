import { useEffect, useRef, useState } from "react";
import type { OrbState } from "./Orb";

export type Msg = {
  id: string;
  role: "user" | "jarvis" | "system";
  text: string;
  ts: number;
  kind?: "text" | "error" | "action";
};

type Props = {
  onStateChange: (s: OrbState) => void;
  muted: boolean;
  shutdown: boolean;
};

// Local Jarvis "brain" — simulates command handling.
function processCommand(input: string): { reply: string; kind?: "error" | "action"; orb: OrbState } {
  const cmd = input.trim().toLowerCase();
  if (!cmd) return { reply: "Lütfen bir komut girin efendim.", kind: "error", orb: "error" };

  // Open app
  const openMatch = cmd.match(/^(?:aç|open|başlat)\s+(.+)/);
  if (openMatch) {
    const app = openMatch[1];
    return { reply: `🚀 ${app} uygulaması başlatılıyor... (simülasyon)`, kind: "action", orb: "speaking" };
  }

  // Music
  if (/(müzik|music|şarkı|çal)/.test(cmd)) {
    const tracks = ["Daft Punk - Aerodynamic", "Hans Zimmer - Time", "TOOL - Pneuma", "Interstellar OST"];
    const t = tracks[Math.floor(Math.random() * tracks.length)];
    return { reply: `🎵 Şu an çalınıyor: "${t}"`, kind: "action", orb: "speaking" };
  }

  // Message
  const msgMatch = cmd.match(/(?:mesaj gönder|send message|sms)\s+(\S+)\s+(.+)/);
  if (msgMatch) {
    return { reply: `✉️ ${msgMatch[1]} kişisine mesaj gönderildi: "${msgMatch[2]}"`, kind: "action", orb: "speaking" };
  }
  if (/mesaj/.test(cmd)) {
    return { reply: "Kime ve ne yazılacak? Örn: mesaj gönder Ayşe Merhaba", kind: "action", orb: "speaking" };
  }

  // Weather
  if (/(hava|weather)/.test(cmd)) {
    const cities = ["İstanbul", "Ankara", "İzmir"];
    const city = cities.find((c) => cmd.includes(c.toLowerCase())) ?? "İstanbul";
    const temp = (Math.random() * 25 + 5).toFixed(1);
    const cond = ["güneşli ☀️", "parçalı bulutlu ⛅", "yağmurlu 🌧️", "rüzgârlı 🌬️"][Math.floor(Math.random() * 4)];
    return { reply: `🌍 ${city}: ${temp}°C, ${cond}`, kind: "action", orb: "speaking" };
  }

  // System info
  if (/(sistem|system|cpu|ram|bellek)/.test(cmd)) {
    const cpu = (Math.random() * 60 + 10).toFixed(0);
    const ram = (Math.random() * 50 + 30).toFixed(0);
    const mem = navigator.deviceMemory ?? "?";
    return {
      reply: `🖥️ Sistem Durumu\n• CPU: %${cpu}\n• RAM: %${ram} (${mem} GB)\n• Tarayıcı: ${navigator.userAgent.split(" ").slice(-2).join(" ")}\n• Çekirdek: ${navigator.hardwareConcurrency}`,
      kind: "action",
      orb: "speaking",
    };
  }

  // Terminal-style commands
  if (cmd === "help" || cmd === "yardım") {
    return {
      reply:
        "Komutlar:\n• aç <uygulama>\n• müzik çal\n• mesaj gönder <isim> <metin>\n• hava <şehir>\n• sistem bilgisi\n• terminal: echo, date, whoami, pwd, ls\n• mute / resume / shutdown",
      orb: "speaking",
    };
  }
  if (cmd === "date" || cmd === "tarih") return { reply: new Date().toString(), orb: "speaking" };
  if (cmd === "whoami") return { reply: "tony.stark", orb: "speaking" };
  if (cmd === "pwd") return { reply: "/home/sir", orb: "speaking" };
  if (cmd === "ls") return { reply: "Documents  Lab  Suits  Workshop", orb: "speaking" };
  if (cmd.startsWith("echo ")) return { reply: cmd.slice(5), orb: "speaking" };

  // Greeting
  if (/(merhaba|selam|hello|hi|hey|jarvis)/.test(cmd)) {
    return { reply: "Merhaba efendim. Size nasıl yardımcı olabilirim?", orb: "speaking" };
  }

  return {
    reply: `"${input}" komutu tanınmadı. 'help' yazarak komut listesine ulaşabilirsiniz.`,
    kind: "error",
    orb: "error",
  };
}

export function ChatPanel({ onStateChange, muted, shutdown }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", role: "system", text: "J.A.R.V.I.S sistemi başlatıldı. Komutlarınız bekleniyor.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || shutdown) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: input, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    const text = input;
    setInput("");

    onStateChange("thinking");
    setTimeout(() => {
      const { reply, kind, orb } = processCommand(text);
      const finalOrb = muted ? "muted" : orb;
      const reMsg: Msg = { id: crypto.randomUUID(), role: "jarvis", text: reply, ts: Date.now(), kind };
      setMessages((m) => [...m, reMsg]);
      onStateChange(finalOrb);
      setTimeout(() => onStateChange(muted ? "muted" : "idle"), 2200);
    }, 700 + Math.random() * 600);
  };

  return (
    <div className="glass rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="display text-jarvis-blue text-glow text-sm tracking-widest">COMM // CHAT</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-jarvis-blue animate-pulse" />
          <span className="text-xs text-muted-foreground">CONNECTED</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm leading-relaxed ${
              m.role === "user" ? "text-right" : "text-left"
            }`}
          >
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
                <div className="text-[10px] tracking-widest text-jarvis-blue mb-1 display">
                  JARVIS
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <span className="text-jarvis-blue display text-sm">{">"}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={shutdown}
            placeholder={shutdown ? "Sistem kapalı..." : "Komutu girin..."}
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
