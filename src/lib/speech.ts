// Web Speech API tabanlı sesli komut tanıma (Türkçe).
// Sürekli mod: kullanıcı durdurana kadar dinler, her tamamlanan cümleyi onResult ile bildirir.

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
  continuous?: boolean;
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
  const continuous = opts.continuous ?? true;
  rec.lang = opts.lang ?? "tr-TR";
  rec.interimResults = true;
  rec.continuous = continuous;
  rec.maxAlternatives = 1;

  let stopped = false;

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
  rec.onerror = (e: any) => {
    const err = e.error ?? "Bilinmeyen hata";
    // 'no-speech' / 'aborted' gibi yumuşak hatalarda sessizce devam et
    if (err === "no-speech" || err === "aborted") return;
    opts.onError?.(err);
  };
  rec.onend = () => {
    if (continuous && !stopped) {
      // Tarayıcılar continuous modda bile zaman zaman bitirir; otomatik yeniden başlat.
      try {
        rec.start();
        return;
      } catch {
        /* fallthrough */
      }
    }
    opts.onEnd?.();
  };

  try {
    rec.start();
  } catch (e) {
    opts.onError?.(String(e));
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    },
  };
}
