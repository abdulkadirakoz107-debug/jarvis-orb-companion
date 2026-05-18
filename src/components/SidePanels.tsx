import { useEffect, useState } from "react";

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-md p-3 relative ${className}`}>
      <div className="display text-jarvis-green text-glow text-[10px] tracking-[0.35em] mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-jarvis-green" style={{ boxShadow: "0 0 6px var(--jarvis-green)" }} />
        {title}
      </div>
      {children}
      <span className="absolute top-1 right-1 w-2 h-2 border-t border-r border-jarvis-green/60" />
      <span className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-jarvis-green/60" />
    </div>
  );
}

function Bar({ label, value, color = "var(--jarvis-green)" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground tracking-wider">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function TimePanel() {
  const now = useClock();
  const hh = now ? String(now.getHours()).padStart(2, "0") : "--";
  const mm = now ? String(now.getMinutes()).padStart(2, "0") : "--";
  const ss = now ? String(now.getSeconds()).padStart(2, "0") : "--";
  const date = now
    ? now.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
    : "";
  const day = now ? now.toLocaleDateString("tr-TR", { weekday: "long" }).toUpperCase() : "";

  return (
    <Panel title="TIME">
      <div className="flex items-baseline gap-1">
        <span className="display text-4xl text-jarvis-green text-glow tabular-nums">{hh}:{mm}</span>
        <span className="display text-jarvis-green/60 text-sm tabular-nums">:{ss}</span>
      </div>
      <div className="mt-1 text-[10px] tracking-[0.3em] text-muted-foreground">{date}</div>
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{day}</div>
    </Panel>
  );
}

type Weather = { temp: number; feels: number; desc: string; humidity: number; city: string } | null;

export function WeatherPanel() {
  const [w, setW] = useState<Weather>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // İstanbul koordinatları, ücretsiz open-meteo
        const r = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code",
        );
        const j = await r.json();
        if (cancel) return;
        const code: number = j?.current?.weather_code ?? 0;
        const desc =
          code === 0 ? "açık" :
          code <= 2 ? "az bulutlu" :
          code <= 3 ? "parçalı bulutlu" :
          code <= 48 ? "sisli" :
          code <= 67 ? "yağmurlu" :
          code <= 77 ? "karlı" :
          code <= 82 ? "sağanak" : "fırtınalı";
        setW({
          temp: Math.round(j.current.temperature_2m),
          feels: Math.round(j.current.apparent_temperature),
          desc,
          humidity: Math.round(j.current.relative_humidity_2m),
          city: "İSTANBUL",
        });
      } catch {
        setW({ temp: 22, feels: 25, desc: "parçalı bulutlu", humidity: 53, city: "İSTANBUL" });
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <Panel title="WEATHER">
      <div className="flex items-baseline gap-1">
        <span className="display text-4xl text-jarvis-green text-glow tabular-nums">{w?.temp ?? "--"}</span>
        <span className="text-jarvis-green/70 text-lg">°C</span>
      </div>
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1">{w?.city}</div>
      <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
        <li>• {w?.desc ?? "yükleniyor"}</li>
        <li>• hissedilen {w?.feels ?? "--"}°</li>
        <li>• nem yüzde {w?.humidity ?? "--"}</li>
      </ul>
    </Panel>
  );
}

function useUptime() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function StatusPanel() {
  const uptime = useUptime();
  const [stats, setStats] = useState({ cpu: 0, ram: 68, disk: 47, battery: 55, up: 2.3, down: 2.2 });
  useEffect(() => {
    const t = setInterval(() => {
      setStats((s) => ({
        cpu: Math.max(0, Math.min(100, s.cpu + (Math.random() - 0.5) * 18)),
        ram: Math.max(20, Math.min(95, s.ram + (Math.random() - 0.5) * 4)),
        disk: s.disk,
        battery: Math.max(5, s.battery - (Math.random() < 0.05 ? 1 : 0)),
        up: +(Math.random() * 4 + 0.5).toFixed(1),
        down: +(Math.random() * 4 + 0.5).toFixed(1),
      }));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <Panel title="SYSTEM STATUS">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
        UPTIME <span className="text-jarvis-green tabular-nums ml-2">{uptime}</span>
      </div>
      <div className="space-y-2">
        <Bar label="CPU" value={Math.round(stats.cpu)} />
        <Bar label="RAM" value={Math.round(stats.ram)} color="var(--jarvis-yellow)" />
        <Bar label="DISK" value={Math.round(stats.disk)} />
        <Bar label="BATTERY" value={Math.round(stats.battery)} />
      </div>
      <div className="mt-3 flex justify-between text-[10px] tracking-widest">
        <span className="text-jarvis-yellow">▲ {stats.up} KB/s</span>
        <span className="text-jarvis-green">▼ {stats.down} KB/s</span>
      </div>
    </Panel>
  );
}

export function HealthPanel() {
  return (
    <Panel title="HEALTH SUMMARY">
      <ul className="text-[11px] text-muted-foreground space-y-1">
        <li>• Çekirdek sıcaklığı normal</li>
        <li>• Bellek ısı dağılımı stabil</li>
        <li>• Ağ gecikmesi düşük</li>
        <li>• Tüm sensörler aktif</li>
      </ul>
    </Panel>
  );
}

export function SettingsHeaderPanel() {
  return (
    <div className="glass rounded-md px-3 py-2 relative">
      <div className="display text-jarvis-green text-glow text-[10px] tracking-[0.35em] flex items-center justify-between">
        <span>SYSTEM SETTINGS</span>
        <span className="text-jarvis-green/70">▸</span>
      </div>
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1">VOICE CORE · Windows</div>
    </div>
  );
}

export function UserFooter() {
  return (
    <div className="text-left">
      <div className="display text-jarvis-green text-glow text-sm tracking-widest">Alp</div>
      <div className="text-[11px] text-muted-foreground tracking-widest">Ünlü</div>
    </div>
  );
}
