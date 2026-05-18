import { useMemo } from "react";
import type { OrbState } from "./Orb";

const stateColor: Record<OrbState, string> = {
  idle: "var(--jarvis-green)",
  speaking: "var(--jarvis-blue)",
  thinking: "var(--jarvis-yellow)",
  error: "var(--jarvis-red)",
  muted: "oklch(0.45 0.04 250)",
};

const stateLabel: Record<OrbState, string> = {
  idle: "Standby",
  speaking: "Speaking",
  thinking: "Thinking",
  error: "Error",
  muted: "Muted",
};

type Dot = { x: number; y: number; r: number; o: number; d: number };

export function Radar({ state }: { state: OrbState }) {
  const color = stateColor[state];

  // Sonar dots — sabit rastgele pozisyonlar
  const dots = useMemo<Dot[]>(() => {
    const arr: Dot[] = [];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() ** 0.7 * 48; // %0-48 yarıçap
      arr.push({
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        r: 0.3 + Math.random() * 1.4,
        o: 0.25 + Math.random() * 0.6,
        d: Math.random() * 4,
      });
    }
    return arr;
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* Üst başlık */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1
          className="display text-[2.4rem] md:text-[3rem] tracking-[0.35em] text-glow"
          style={{ color }}
        >
          J.A.R.V.I.S
        </h1>
        <div className="text-[11px] tracking-[0.45em] text-muted-foreground mt-1">
          Just A Rather Very Intelligent System
        </div>
      </div>

      {/* Radar disk */}
      <div className="relative" style={{ width: "min(78vh, 78vmin)", aspectRatio: "1 / 1" }}>
        {/* Konsantrik halkalar */}
        {[100, 78, 56, 34, 14].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              left: `${(100 - p) / 2}%`,
              top: `${(100 - p) / 2}%`,
              width: `${p}%`,
              height: `${p}%`,
              borderColor: color,
              opacity: 0.22 + i * 0.06,
              boxShadow: i === 0 ? `0 0 28px ${color}` : undefined,
            }}
          />
        ))}

        {/* Çapraz çizgiler (haç) */}
        <div
          className="absolute left-1/2 top-[10%] bottom-[10%] w-px"
          style={{ background: color, opacity: 0.18 }}
        />
        <div
          className="absolute top-1/2 left-[10%] right-[10%] h-px"
          style={{ background: color, opacity: 0.18 }}
        />

        {/* Sonar dotlar */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={color}
              opacity={d.o}
              style={{
                animation: `blink-dot ${2 + d.d}s ease-in-out ${d.d}s infinite`,
                transformOrigin: `${d.x}px ${d.y}px`,
              }}
            />
          ))}
        </svg>

        {/* Tarayıcı konik beam */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${color} 25deg, transparent 60deg, transparent 360deg)`,
            opacity: 0.35,
            animation: "radar-sweep 4.5s linear infinite",
            mask: "radial-gradient(circle, black 60%, transparent 62%)",
            WebkitMask: "radial-gradient(circle, black 60%, transparent 62%)",
          }}
        />

        {/* Merkez parıltı */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "10%",
            height: "10%",
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: "blur(8px)",
            opacity: 0.7,
            animation: "orb-pulse 2.5s ease-in-out infinite",
          }}
        />

        {/* Köşe braketleri */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <div
            key={c}
            className="absolute w-6 h-6 pointer-events-none"
            style={{
              top: c.startsWith("t") ? -6 : undefined,
              bottom: c.startsWith("b") ? -6 : undefined,
              left: c.endsWith("l") ? -6 : undefined,
              right: c.endsWith("r") ? -6 : undefined,
              borderColor: color,
              borderTopWidth: c.startsWith("t") ? 2 : 0,
              borderBottomWidth: c.startsWith("b") ? 2 : 0,
              borderLeftWidth: c.endsWith("l") ? 2 : 0,
              borderRightWidth: c.endsWith("r") ? 2 : 0,
              borderStyle: "solid",
            }}
          />
        ))}
      </div>

      {/* Alt label */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
        <div className="display text-jarvis-blue text-glow tracking-[0.45em] text-xl">J.A.R.V.I.S</div>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span style={{ color }}>{stateLabel[state]}</span>
        </div>
      </div>
    </div>
  );
}
