import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { type OrbState } from "@/components/Orb";
import { Radar } from "@/components/Radar";
import { ChatPanel } from "@/components/ChatPanel";
import {
  HealthPanel,
  SettingsHeaderPanel,
  StatusPanel,
  TimePanel,
  UserFooter,
  WeatherPanel,
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

function ControlButton({
  label,
  icon,
  variant,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  variant: "green" | "blue" | "red";
  active?: boolean;
  onClick: () => void;
}) {
  const c =
    variant === "green" ? "var(--jarvis-green)" : variant === "blue" ? "var(--jarvis-blue)" : "var(--jarvis-red)";
  return (
    <button
      onClick={onClick}
      className="relative display tracking-[0.3em] text-xs px-6 py-2.5 rounded-sm transition-all flex items-center gap-2"
      style={{
        color: c,
        border: `1px solid ${c}`,
        background: active ? `color-mix(in oklab, ${c} 20%, transparent)` : "transparent",
        boxShadow: active ? `0 0 18px ${c}` : "none",
      }}
    >
      <span>{icon}</span>
      <span className="text-glow">{label}</span>
      <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l" style={{ borderColor: c }} />
      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r" style={{ borderColor: c }} />
    </button>
  );
}

function Index() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [muted, setMuted] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const dragging = useRef(false);

  const effectiveState: OrbState = shutdown ? "error" : muted ? "muted" : orbState;

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.min(640, Math.max(320, window.innerWidth - ev.clientX - 24));
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
      {/* SOL KOLON: panel yığını */}
      <aside className="absolute top-3 left-3 bottom-12 w-[240px] flex flex-col gap-2 overflow-y-auto scrollbar-thin pr-1">
        <SettingsHeaderPanel />
        <TimePanel />
        <WeatherPanel />
        <StatusPanel />
        <HealthPanel />
      </aside>

      {/* MERKEZ: radar + kontroller */}
      <section
        className="absolute top-0 bottom-0"
        style={{ left: 260, right: chatWidth + 28 }}
      >
        <div className="relative w-full h-full">
          <Radar state={effectiveState} />

          {/* LIVE / PAUSE / SHUTDOWN */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <ControlButton
              label="LIVE"
              icon="🎙"
              variant="green"
              active={!shutdown && !muted}
              onClick={() => { setShutdown(false); setMuted(false); setOrbState("idle"); }}
            />
            <ControlButton
              label="PAUSE"
              icon="❚❚"
              variant="blue"
              active={muted}
              onClick={() => setMuted((v) => !v)}
            />
            <ControlButton
              label="SHUTDOWN"
              icon="⏻"
              variant="red"
              active={shutdown}
              onClick={() => setShutdown((v) => !v)}
            />
          </div>
        </div>
      </section>

      {/* SAĞ KOLON: chat */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-3 bottom-12 w-[6px] cursor-col-resize group flex items-center justify-center"
        style={{ right: chatWidth + 18 }}
        title="Sohbet panelini yeniden boyutlandır"
      >
        <div
          className="w-[2px] h-full bg-jarvis-green/20 group-hover:bg-jarvis-green/70 transition-colors"
          style={{ boxShadow: "0 0 8px var(--jarvis-green)" }}
        />
      </div>
      <aside
        className="absolute top-3 bottom-12"
        style={{ right: 12, width: chatWidth }}
      >
        <ChatPanel onStateChange={setOrbState} muted={muted} shutdown={shutdown} />
      </aside>

      {/* ALT BAR */}
      <footer className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-between px-4 text-[10px] tracking-[0.3em] text-muted-foreground border-t border-jarvis-green/15">
        <UserFooter />
        <div className="text-center">
          JARVIS · Windows Edition · Realtime Voice Core
        </div>
        <div className="flex gap-3">
          <span><span className="text-jarvis-green">[F4]</span> MUTE</span>
          <span><span className="text-jarvis-blue">[F5]</span> PAUSE</span>
          <span><span className="text-jarvis-red">[ESC]</span> EXIT</span>
        </div>
      </footer>
    </main>
  );
}
