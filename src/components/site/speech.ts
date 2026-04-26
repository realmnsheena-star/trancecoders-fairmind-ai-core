export function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  // @ts-expect-error vendor prefixes
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = getSpeechRecognition();
    if (!SR) return reject(new Error("Speech recognition not supported"));
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => resolve(e.results[0][0].transcript as string);
    rec.onerror = (e: any) => reject(new Error(e.error || "speech error"));
    rec.onend = () => {};
    rec.start();
  });
}