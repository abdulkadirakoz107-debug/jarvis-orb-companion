import { useEffect, useState } from "react";

export type OrbState = "idle" | "speaking" | "thinking" | "error" | "muted";

const stateColor: Record<OrbState, string> = {
  idle: "var(--jarvis-idle)",
  speaking: "var(--jarvis-blue)",
  thinking: "var(--jarvis-yellow)",
  error: "var(--jarvis-red)",
  muted: "oklch(0.35 0.02 250)",
};

const stateLabel: Record<OrbState, string> = {
  idle: "STANDBY",
  speaking: "SPEAKING",
  thinking: "THINKING",
  error: "ERROR",
  muted: "MUTED",
};

export function Orb({ state }: { state: OrbState }) {
  const color = stateColor[state];
  const [bars] = useState(() => Array.from({ length: 32 }));

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer rotating ring */}
      <div
        className="absolute w-[420px] h-[420px] rounded-full border opacity-40"
        style={{
          borderColor: color,
          animation: "orb-rotate 20s linear infinite",
          boxShadow: `0 0 40px ${color}`,
        }}
      >
        <div
          className="absolute top-0 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
      {/* Mid counter-rotating ring */}
      <div
        className="absolute w-[340px] h-[340px] rounded-full border-2 border-dashed opacity-50"
        style={{
          borderColor: color,
          animation: "orb-rotate-rev 14s linear infinite",
        }}
      />
      {/* Tick ring */}
      <div className="absolute w-[300px] h-[300px]">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-0 w-px"
            style={{
              height: i % 5 === 0 ? "12px" : "6px",
              background: color,
              opacity: i % 5 === 0 ? 0.7 : 0.3,
              transform: `translateX(-50%) rotate(${i * 6}deg)`,
              transformOrigin: "50% 150px",
            }}
          />
        ))}
      </div>

      {/* Core orb */}
      <div
        className="relative w-[220px] h-[220px] rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, oklch(0.15 0.04 250) 75%)`,
          boxShadow: `0 0 80px ${color}, inset 0 0 60px ${color}`,
          animation: "orb-pulse 2.5s ease-in-out infinite",
        }}
      >
        {/* Inner core glow */}
        <div
          className="absolute w-[120px] h-[120px] rounded-full blur-2xl opacity-80"
          style={{ background: color }}
        />
        {/* Audio waveform bars */}
        <div className="relative flex items-end gap-[3px] h-16 z-10">
          {bars.map((_, i) => {
            const isActive = state === "speaking" || state === "thinking";
            return (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  height: "100%",
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  transformOrigin: "bottom",
                  animation: isActive
                    ? `wave ${0.6 + (i % 5) * 0.15}s ease-in-out ${i * 0.04}s infinite`
                    : "none",
                  transform: isActive ? undefined : "scaleY(0.15)",
                  opacity: isActive ? 1 : 0.4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Status label */}
      <div
        className="mt-12 display text-sm tracking-[0.4em] text-glow"
        style={{ color }}
      >
        {stateLabel[state]}
      </div>
      <div className="mt-2 text-xs text-muted-foreground tracking-widest">
        J.A.R.V.I.S // v1.0
      </div>
    </div>
  );
}

// HUD corner brackets
export function HudFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <div
          key={c}
          className="absolute w-8 h-8 border-jarvis-blue pointer-events-none"
          style={{
            top: c.startsWith("t") ? 12 : undefined,
            bottom: c.startsWith("b") ? 12 : undefined,
            left: c.endsWith("l") ? 12 : undefined,
            right: c.endsWith("r") ? 12 : undefined,
            borderColor: "var(--jarvis-blue)",
            borderTopWidth: c.startsWith("t") ? 2 : 0,
            borderBottomWidth: c.startsWith("b") ? 2 : 0,
            borderLeftWidth: c.endsWith("l") ? 2 : 0,
            borderRightWidth: c.endsWith("r") ? 2 : 0,
          }}
        />
      ))}
      {children}
    </div>
  );
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="display text-jarvis-blue text-glow text-2xl tabular-nums">
      {now ? now.toLocaleTimeString("tr-TR") : "--:--:--"}
    </div>
  );
}
