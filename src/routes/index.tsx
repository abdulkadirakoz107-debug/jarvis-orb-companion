import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Orb, HudFrame, Clock, type OrbState } from "@/components/Orb";
import { ChatPanel } from "@/components/ChatPanel";

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
      <HudFrame>
        {/* Üst bar */}
        <header className="absolute top-3 left-6 right-6 flex items-center justify-between text-xs tracking-widest text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="display text-jarvis-blue text-glow">J.A.R.V.I.S</span>
            <span>// SYSTEM ONLINE</span>
          </div>
          <Clock />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted((v) => !v)}
              className="px-3 py-1 border border-jarvis-blue/40 hover:bg-jarvis-blue/10 rounded-sm"
            >
              {muted ? "UNMUTE" : "MUTE"}
            </button>
            <button
              onClick={() => setShutdown((v) => !v)}
              className="px-3 py-1 border border-jarvis-red/40 text-jarvis-red hover:bg-jarvis-red/10 rounded-sm"
            >
              {shutdown ? "BOOT" : "SHUTDOWN"}
            </button>
          </div>
        </header>

        {/* Merkez orb */}
        <section
          className="absolute top-0 bottom-0 left-0 flex items-center justify-center"
          style={{ right: chatWidth + 28 }}
        >
          <Orb state={effectiveState} />
        </section>

        {/* Sağ kolon: chat */}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-3 bottom-3 w-[6px] cursor-col-resize group flex items-center justify-center"
          style={{ right: chatWidth + 18 }}
          title="Sohbet panelini yeniden boyutlandır"
        >
          <div
            className="w-[2px] h-full bg-jarvis-blue/20 group-hover:bg-jarvis-blue/70 transition-colors"
            style={{ boxShadow: "0 0 8px var(--jarvis-blue)" }}
          />
        </div>
        <aside
          className="absolute top-3 bottom-3"
          style={{ right: 12, width: chatWidth }}
        >
          <ChatPanel onStateChange={setOrbState} muted={muted} shutdown={shutdown} />
        </aside>
      </HudFrame>
    </main>
  );
}
