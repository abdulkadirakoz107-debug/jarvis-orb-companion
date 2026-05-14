// Web Speech API tabanlı sesli komut tanıma (Türkçe)

type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export type Listener = {
  stop: () => void;
};

export function startListening(opts: {
  lang?: string;
  onResult: (text: string) => void;
  onPartial?: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}): Listener | null {
  const rec = getRecognition();
  if (!rec) {
    opts.onError?.("Tarayıcınız sesli komutu desteklemiyor.");
    return null;
  }
  rec.lang = opts.lang ?? "tr-TR";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e: any) => {
    let finalText = "";
    let partial = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else partial += r[0].transcript;
    }
    if (partial) opts.onPartial?.(partial);
    if (finalText) opts.onResult(finalText.trim());
  };
  rec.onerror = (e: any) => opts.onError?.(e.error ?? "Bilinmeyen hata");
  rec.onend = () => opts.onEnd?.();

  try {
    rec.start();
  } catch (e) {
    opts.onError?.(String(e));
    return null;
  }

  return { stop: () => rec.stop() };
}
