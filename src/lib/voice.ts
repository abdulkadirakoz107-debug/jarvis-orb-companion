// Tarayıcı tabanlı konuşma sentezi (Web Speech API).
// Türkçe sesi tercih eder, yoksa ilk uygun sese düşer.

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Tercih sırası: tr-TR erkek > tr-TR > en-GB > en-US > ilk ses
  const tr = voices.find((v) => v.lang?.toLowerCase().startsWith("tr"));
  const enGB = voices.find((v) => v.lang === "en-GB");
  const enUS = voices.find((v) => v.lang?.startsWith("en"));
  cachedVoice = tr ?? enGB ?? enUS ?? voices[0];
  return cachedVoice;
}

// Sesler asenkron yüklenir; bir kez tetikleyelim.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

export function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void; muted?: boolean } = {},
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (opts.muted) {
    opts.onEnd?.();
    return;
  }
  // Önceki konuşmayı iptal et.
  window.speechSynthesis.cancel();

  // Markdown/emoji temizle
  const clean = text
    .replace(/[*_`#>]/g, "")
    .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
    .trim();
  if (!clean) {
    opts.onEnd?.();
    return;
  }

  const utter = new SpeechSynthesisUtterance(clean);
  const voice = pickVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = "tr-TR";
  }
  utter.rate = 1.05;
  utter.pitch = 0.85; // biraz daha derin, Jarvis havası
  utter.volume = 1;

  utter.onstart = () => opts.onStart?.();
  utter.onend = () => opts.onEnd?.();
  utter.onerror = () => opts.onEnd?.();

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
