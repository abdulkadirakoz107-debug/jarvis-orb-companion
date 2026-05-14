import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Orb, HudFrame, Clock, type OrbState } from "@/components/Orb";
import { ChatPanel } from "@/components/ChatPanel";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S — AI Assistant" },
      { name: "description", content: "Just A Rather Very Intelligent System." },
    ],
  }),
});

function ControlButton({
  label,
  active,
  variant,
  onClick,
}: {
  label: string;
  active?: boolean;
  variant: "blue" | "yellow" | "red";
  onClick: () => void;
}) {
  const colorVar =
    variant === "blue" ? "var(--jarvis-blue)" : variant === "yellow" ? "var(--jarvis-yellow)" : "var(--jarvis-red)";
  return (
    <button
      onClick={onClick}
      className="group relative display tracking-[0.3em] text-xs px-8 py-4 rounded-md transition-all"
      style={{
        color: colorVar,
        border: `1px solid ${colorVar}`,
        background: active ? `${colorVar.replace(")", " / 0.18)")}` : "transparent",
        boxShadow: active ? `0 0 24px ${colorVar}, inset 0 0 16px ${colorVar.replace(")", " / 0.3)")}` : "none",
      }}
    >
      <span className="text-glow">{label}</span>
      <span
        className="absolute -top-1 -left-1 w-2 h-2 border-t border-l"
        style={{ borderColor: colorVar }}
      />
      <span
        className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r"
        style={{ borderColor: colorVar }}
      />
    </button>
  );
}

function Index() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [muted, setMuted] = useState(false);
  const [shutdown, setShutdown] = useState(false);

  const effectiveState: OrbState = shutdown ? "error" : muted ? "muted" : orbState;

  return (
    <main className="h-screen w-screen relative grid-bg overflow-hidden">
      <HudFrame>
        {/* Top bar */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-10">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-jarvis-blue animate-pulse" style={{ boxShadow: "0 0 12px var(--jarvis-blue)" }} />
            <h1 className="display text-jarvis-blue text-glow text-lg">J.A.R.V.I.S</h1>
            <span className="text-xs text-muted-foreground tracking-widest">// JUST A RATHER VERY INTELLIGENT SYSTEM</span>
          </div>
          <Clock />
        </header>

        {/* Main grid: orb (center) + chat (right) */}
        <div className="h-full w-full grid grid-cols-[1fr_420px] gap-6 px-8 pt-20 pb-32">
          {/* Center: orb area */}
          <section className="relative flex items-center justify-center">
            <Orb state={effectiveState} />

            {/* Side stat panels */}
            <div className="absolute top-8 left-0 glass rounded-md px-4 py-3 text-xs space-y-1 min-w-[180px]">
              <div className="display text-jarvis-blue text-glow text-[10px] tracking-widest">SYSTEM</div>
              <div className="flex justify-between"><span className="text-muted-foreground">CORE</span><span>{shutdown ? "OFFLINE" : "ONLINE"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">AUDIO</span><span>{muted ? "MUTED" : "ACTIVE"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">MODE</span><span>{effectiveState.toUpperCase()}</span></div>
            </div>
            <div className="absolute bottom-8 right-0 glass rounded-md px-4 py-3 text-xs space-y-1 min-w-[180px]">
              <div className="display text-jarvis-blue text-glow text-[10px] tracking-widest">DIAGNOSTICS</div>
              <div className="flex justify-between"><span className="text-muted-foreground">LATENCY</span><span>12ms</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UPTIME</span><span>99.98%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">NEURAL</span><span>NOMINAL</span></div>
            </div>
          </section>

          {/* Right: chat */}
          <aside>
            <ChatPanel onStateChange={setOrbState} muted={muted} shutdown={shutdown} />
          </aside>
        </div>

        {/* Bottom controls */}
        <footer className="absolute bottom-0 left-0 right-[420px] mr-8 flex items-center justify-center gap-6 pb-8 pt-4">
          <ControlButton
            label={muted ? "MUTED" : "MUTE"}
            variant="yellow"
            active={muted}
            onClick={() => setMuted((v) => !v)}
          />
          <ControlButton
            label="RESUME"
            variant="blue"
            active={!shutdown && !muted && orbState !== "idle"}
            onClick={() => {
              setShutdown(false);
              setMuted(false);
              setOrbState("idle");
            }}
          />
          <ControlButton
            label={shutdown ? "OFFLINE" : "SHUTDOWN"}
            variant="red"
            active={shutdown}
            onClick={() => setShutdown((v) => !v)}
          />
        </footer>
      </HudFrame>
    </main>
  );
}
