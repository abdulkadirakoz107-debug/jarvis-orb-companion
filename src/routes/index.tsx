import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Orb, HudFrame, Clock, type OrbState } from "@/components/Orb";
import { ChatPanel } from "@/components/ChatPanel";
import {
  TimePanel,
  WeatherPanel,
  StatusPanel,
  HealthPanel,
  SettingsHeaderPanel,
  UserFooter,
} from "@/components/SidePanels";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S — Just A Rather Very Intelligent System" },
      { name: "description", content: "Sesli, akıllı ve esprili Türkçe yapay zeka asistanı." },
    ],
  }),
});

function Index() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [muted, setMuted] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [chatWidth, setChatWidth] = useState(380);
  const dragging = useRef(false);

  const effectiveState: OrbState = shutdown ? "error" : muted ? "muted" : orbState;

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.min(560, Math.max(300, window.innerWidth - ev.clientX - 24));
      setChatWidth(w);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <main className="h-screen w-screen overflow-hidden grid-bg relative">
      <HudFrame>
        {/* Üst bar */}
        <header className="absolute top-3 left-6 right-6 flex items-center justify-between text-xs tracking-widest text-muted-foreground z-10">
          <div className="flex items-center gap-3">
            <span className="display text-jarvis-blue text-glow">J.A.R.V.I.S</span>
            <span className="hidden sm:inline">// SANTRAL HAZIR · SES İLE SİSTEM</span>
          </div>
          <Clock />
        </header>

        {/* Sol panel */}
        <aside className="absolute top-12 bottom-16 left-3 w-[240px] overflow-y-auto scrollbar-thin space-y-3 pr-1 z-10">
          <SettingsHeaderPanel />
          <TimePanel />
          <WeatherPanel />
          <StatusPanel />
          <HealthPanel />
          <UserFooter />
        </aside>

        {/* Merkez orb + alt butonlar */}
        <section
          className="absolute top-12 bottom-16 flex flex-col items-center justify-center"
          style={{ left: 260, right: chatWidth + 28 }}
        >
          <Orb state={effectiveState} />
          <div className="mt-10 flex items-center gap-3">
            <button
              onClick={() => setMuted((v) => !v)}
              className="px-4 py-2 border border-jarvis-yellow/50 text-jarvis-yellow hover:bg-jarvis-yellow/10 rounded-sm text-xs tracking-[0.25em] display"
              style={{ boxShadow: "0 0 12px oklch(0.85 0.18 90 / 0.3)" }}
            >
              {muted ? "SESİ AÇ" : "SESİ KAPATMAK"}
            </button>
            <button
              className="px-4 py-2 border border-jarvis-blue/60 text-jarvis-blue hover:bg-jarvis-blue/10 rounded-sm text-xs tracking-[0.25em] display"
              style={{ boxShadow: "0 0 12px oklch(0.72 0.20 230 / 0.4)" }}
            >
              KONUŞMA
            </button>
            <button
              onClick={() => setShutdown((v) => !v)}
              className="px-4 py-2 border border-jarvis-red/60 text-jarvis-red hover:bg-jarvis-red/10 rounded-sm text-xs tracking-[0.25em] display"
              style={{ boxShadow: "0 0 12px oklch(0.65 0.25 25 / 0.4)" }}
            >
              {shutdown ? "BOOT" : "KAPAT"}
            </button>
          </div>
        </section>

        {/* Resize handle */}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-12 bottom-16 w-[6px] cursor-col-resize group flex items-center justify-center z-10"
          style={{ right: chatWidth + 18 }}
          title="Sohbet panelini yeniden boyutlandır"
        >
          <div
            className="w-[2px] h-full bg-jarvis-blue/20 group-hover:bg-jarvis-blue/70 transition-colors"
            style={{ boxShadow: "0 0 8px var(--jarvis-blue)" }}
          />
        </div>

        {/* Sağ kolon: chat */}
        <aside
          className="absolute top-12 bottom-16"
          style={{ right: 12, width: chatWidth }}
        >
          <ChatPanel onStateChange={setOrbState} muted={muted} shutdown={shutdown} />
        </aside>

        {/* Alt bar */}
        <footer className="absolute bottom-3 left-6 right-6 flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground z-10">
          <span>● SİSTEM ÇEVRİMİÇİ</span>
          <span>[F4] MİKROFON · [F5] SES · [ESC] KAPAT</span>
        </footer>
      </HudFrame>
    </main>
  );
}
