import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getSpeechRecognition, listenOnce, speak, stopSpeaking } from "./speech";

const PRESETS: { q: string; a: string }[] = [
  { q: "What is AI bias?", a: "AI bias happens when a system makes unfair decisions based on personal traits like gender or age instead of actual qualifications. FairMind removes these before deciding! ⚖️" },
  { q: "How does this tool work?", a: "Simple! You enter your details → we detect any sensitive fields (gender, age, etc.) → remove them completely → then decide based ONLY on income, credit, experience & education. Fair and square! ✅" },
  { q: "What factors affect my decision?", a: "Only these 5 fair factors matter:\n1. Annual Income (need $40,000+)\n2. Credit Score (need 650+)\n3. Experience (need 2+ years)\n4. Education Level\n5. Employment Type\n\nGender, age, marital status & disability are completely ignored. 🚫" },
  { q: "Why was I denied?", a: "You were denied because your merit score was below 3/5. Try improving your income, credit score, or gaining more experience. Your personal traits had ZERO impact. 💪" },
  { q: "What is a good credit score?", a: "Credit scores range from 300 to 850:\n⭐ 300–579: Poor\n⭐ 580–669: Fair\n⭐ 670–739: Good ← We need this minimum\n⭐ 740–799: Very Good\n⭐ 800–850: Excellent 🏆" },
  { q: "How can I improve my score?", a: "Here are quick tips to get approved:\n✅ Increase income above $40,000/year\n✅ Improve credit score above 650\n✅ Gain 2+ years of experience\n✅ Complete a Bachelor's degree or higher\n✅ Move to full-time employment\n\nYou've got this! 💪" },
];

const FALLBACK = "Great question! FairMind AI focuses on removing bias from decisions. For specific questions about your result, try the preset questions above or retake the analysis with updated details. 🧠";

interface ChatMsg { role: "user" | "bot"; text: string }

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "bot", text: "Hi! I'm the FairMind Assistant. Ask me anything about bias & fairness — or pick a quick question below. 🧠" },
  ]);
  const [input, setInput] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVoiceSupported(!!getSpeechRecognition() && typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const answer = (q: string) => {
    const found = PRESETS.find((p) => p.q.toLowerCase() === q.toLowerCase());
    return found ? found.a : FALLBACK;
  };

  const send = (text: string, viaVoice = false) => {
    const t = text.trim();
    if (!t) return;
    const reply = answer(t);
    setMsgs((m) => [...m, { role: "user", text: t }, { role: "bot", text: reply }]);
    setInput("");
    if (viaVoice) speak(reply);
  };

  const handleMic = async () => {
    if (!voiceSupported) {
      toast.error("Voice not supported. Use Chrome.");
      return;
    }
    try {
      setListening(true);
      toast("🎙️ Listening...");
      const text = await listenOnce();
      send(text, true);
    } catch {
      toast.error("Couldn't capture voice");
    } finally {
      setListening(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full px-5 py-4 font-bold shadow-2xl animate-soft-pulse hover:scale-105 transition-transform"
          aria-label="Open FairMind Assistant"
        >
          🤖 Ask FairMind
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[350px] h-[500px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-start justify-between">
            <div>
              <div className="font-bold">🧠 FairMind Assistant</div>
              <div className="text-xs opacity-80">Ask me anything about bias & fairness</div>
            </div>
            <button onClick={() => { stopSpeaking(); setOpen(false); }} className="text-xl leading-none hover:opacity-80" aria-label="Close">×</button>
          </div>

          <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {PRESETS.map((p) => (
              <button
                key={p.q}
                onClick={() => send(p.q)}
                className="text-xs bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary px-2.5 py-1 rounded-full border border-primary/30 transition-colors"
              >
                {p.q}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/40">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-2 border-t border-border flex gap-2 items-center"
          >
            {voiceSupported && (
              <button
                type="button"
                onClick={handleMic}
                className={`shrink-0 w-9 h-9 rounded-full text-white inline-flex items-center justify-center ${
                  listening ? "bg-destructive animate-mic-pulse" : "bg-primary hover:opacity-90"
                }`}
                aria-label="Voice input"
              >
                🎙️
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}