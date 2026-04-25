import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

// ---------- Types ----------
type Decision = "Approved" | "Denied";

interface BreakdownRow {
  f: string;
  v: string;
  s: string; // "✅ +1" | "❌ 0" | "➖ 0"
}

interface Result {
  decision: Decision;
  score: number;
  total: number;
  breakdown: BreakdownRow[];
  biasRemoved: string[];
}

interface FormData {
  income: string;
  creditScore: string;
  experience: string;
  education: string;
  employmentType: string;
  dependents: string;
  gender: string;
  age: string;
  maritalStatus: string;
  disabilityStatus: string;
}

const EMPTY_FORM: FormData = {
  income: "", creditScore: "", experience: "", education: "",
  employmentType: "", dependents: "",
  gender: "", age: "", maritalStatus: "", disabilityStatus: "",
};

const BIAS_FIELDS = ["gender", "age", "maritalStatus", "disabilityStatus"] as const;

// ---------- Decision logic ----------
function makeDecision(data: FormData): Result {
  let score = 0;
  const breakdown: BreakdownRow[] = [];

  if (Number(data.income) > 40000) {
    score++; breakdown.push({ f: "Annual Income", v: "$" + data.income, s: "✅ +1" });
  } else {
    breakdown.push({ f: "Annual Income", v: data.income ? "$" + data.income : "—", s: "❌ 0" });
  }
  if (Number(data.creditScore) > 650) {
    score++; breakdown.push({ f: "Credit Score", v: data.creditScore, s: "✅ +1" });
  } else {
    breakdown.push({ f: "Credit Score", v: data.creditScore || "—", s: "❌ 0" });
  }
  if (Number(data.experience) > 2) {
    score++; breakdown.push({ f: "Experience", v: data.experience + " yrs", s: "✅ +1" });
  } else {
    breakdown.push({ f: "Experience", v: (data.experience || "0") + " yrs", s: "❌ 0" });
  }
  if (["Bachelor's", "Master's", "PhD"].includes(data.education)) {
    score++; breakdown.push({ f: "Education", v: data.education, s: "✅ +1" });
  } else {
    breakdown.push({ f: "Education", v: data.education || "—", s: "❌ 0" });
  }
  if (data.employmentType === "Full-time") {
    score++; breakdown.push({ f: "Employment", v: data.employmentType, s: "✅ +1" });
  } else {
    breakdown.push({ f: "Employment", v: data.employmentType || "—", s: "➖ 0" });
  }
  breakdown.push({ f: "Dependents", v: data.dependents || "0", s: "➖ 0" });

  const biasRemoved = (BIAS_FIELDS as readonly string[]).filter((f) => {
    const v = (data as unknown as Record<string, string>)[f];
    return v && v !== "Prefer not to say" && v !== "";
  });

  return {
    decision: score >= 3 ? "Approved" : "Denied",
    score,
    total: 5,
    breakdown,
    biasRemoved,
  };
}

// ---------- Speech helpers (browser-only) ----------
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  // @ts-expect-error vendor prefixes
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function listenOnce(): Promise<string> {
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

// ---------- Small UI helpers ----------
function scrollTo(id: string) {
  if (typeof document !== "undefined") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}

function MicButton({
  onResult,
  disabled,
  supported,
  className = "",
}: {
  onResult: (text: string) => void;
  disabled?: boolean;
  supported: boolean;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  if (!supported) return null;
  const handle = async () => {
    try {
      setListening(true);
      toast("🎙️ Listening...");
      const text = await listenOnce();
      onResult(text);
      toast.success("✅ Voice filled");
    } catch {
      toast.error("Couldn't capture voice");
    } finally {
      setListening(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || listening}
      title="Speak to fill"
      className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white transition-all ${
        listening ? "bg-destructive animate-mic-pulse" : "bg-primary hover:opacity-90"
      } ${className}`}
    >
      {listening ? "🔴" : "🎙️"}
    </button>
  );
}

// ---------- Sections ----------
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => scrollTo("home")} className="text-xl font-bold tracking-tight hover:opacity-90">
            🧠 FairMind AI
          </button>
          <span className="hidden sm:inline-flex items-center gap-2 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
            </span>
            AI Assistant Online
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[
            ["Home", "home"],
            ["How It Works", "how"],
            ["Try It", "tool"],
            ["About", "about"],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="hover:opacity-80 transition-opacity">
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="home" className="text-white py-24 md:py-32 px-6" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
          AI That's Fair. Decisions You Can Trust.
        </h1>
        <p className="mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          FairMind AI removes bias from decisions — no gender, no age, no marital status. Just facts.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => scrollTo("tool")}
            className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            🎯 Try It Now
          </button>
          <button
            onClick={() => scrollTo("how")}
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-primary transition-colors"
          >
            ▶ See How It Works
          </button>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          {["✅ Bias Detection", "⚖️ Fair Output", "📋 Explainable", "🎙️ Voice Enabled"].map((b) => (
            <span key={b} className="bg-white/15 backdrop-blur-sm border border-white/30 px-5 py-2 rounded-full text-sm font-medium">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountUp({ target, suffix = "", duration = 1200 }: { target: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            setN(Math.round(target * p));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);
  return <div ref={ref} className="text-4xl md:text-5xl font-extrabold text-primary">{n}{suffix}</div>;
}

function StatsBar() {
  return (
    <section className="bg-card py-12 px-6 border-b border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <CountUp target={35} suffix="%" />
          <div className="mt-2 text-sm text-muted-foreground">AI bias error rate (MIT Study)</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-extrabold text-primary">4 Factors</div>
          <div className="mt-2 text-sm text-muted-foreground">Bias attributes removed</div>
        </div>
        <div>
          <CountUp target={100} suffix="%" />
          <div className="mt-2 text-sm text-muted-foreground">Decisions fully explainable</div>
        </div>
      </div>
    </section>
  );
}

// ---------- Tool ----------
const LOADING_MSGS = [
  "🧹 Removing bias...",
  "⚖️ Calculating fairly...",
  "✅ Preparing your result...",
];

function Tool() {
  const [data, setData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [result, setResult] = useState<Result | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    setVoiceSupported(!!getSpeechRecognition() && typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // cycle loading message
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 500);
    return () => clearInterval(id);
  }, [loading]);

  const set = <K extends keyof FormData>(k: K, v: string) => setData((d) => ({ ...d, [k]: v }));

  const handleAnalyze = () => {
    const newErrors: Record<string, boolean> = {};
    if (!data.income) newErrors.income = true;
    if (!data.creditScore) newErrors.creditScore = true;
    if (!data.experience) newErrors.experience = true;
    if (!data.education) newErrors.education = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setErrorMsg("Please fill in all required fields before analyzing.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setResult(null);
    setLoadingMsg(LOADING_MSGS[0]);
    setTimeout(() => {
      setResult(makeDecision(data));
      setLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    stopSpeaking();
    setData(EMPTY_FORM);
    setErrors({});
    setErrorMsg("");
    setResult(null);
    setLoading(false);
    setSpeaking(false);
  };

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
      err ? "border-destructive ring-2 ring-destructive/30" : "border-border"
    }`;

  // map voice text to dropdown values
  const matchOption = (text: string, options: string[]) => {
    const t = text.toLowerCase().trim();
    return options.find((o) => o.toLowerCase() === t)
      || options.find((o) => t.includes(o.toLowerCase()))
      || options.find((o) => o.toLowerCase().includes(t));
  };

  // voice form-fill flow
  const fillByVoice = async () => {
    if (!voiceSupported) {
      toast.error("Voice not supported. Use Chrome.");
      return;
    }
    const ask = (q: string) => new Promise<void>((res) => speak(q, () => res()));
    const askAndListen = async (q: string): Promise<string> => {
      await ask(q);
      try {
        return await listenOnce();
      } catch {
        return "";
      }
    };
    setVoiceMode(true);
    try {
      const incomeT = await askAndListen("What is your annual income?");
      const income = incomeT.replace(/[^0-9]/g, "");
      setData((d) => ({ ...d, income }));

      const creditT = await askAndListen("What is your credit score?");
      const creditScore = creditT.replace(/[^0-9]/g, "");
      setData((d) => ({ ...d, creditScore }));

      const expT = await askAndListen("How many years of experience do you have?");
      const experience = expT.replace(/[^0-9]/g, "");
      setData((d) => ({ ...d, experience }));

      const eduT = await askAndListen("What is your highest education level? High School, Bachelor's, Master's, or PhD?");
      const eduOpts = ["High School", "Bachelor's", "Master's", "PhD"];
      const education = matchOption(eduT, eduOpts) || "";
      setData((d) => ({ ...d, education }));

      const empT = await askAndListen("What is your employment type? Full-time, Part-time, Self-employed, or Freelancer?");
      const empOpts = ["Full-time", "Part-time", "Self-employed", "Freelancer"];
      const employmentType = matchOption(empT, empOpts) || "";
      setData((d) => ({ ...d, employmentType }));

      const depT = await askAndListen("How many dependents do you have?");
      const dependents = depT.replace(/[^0-9]/g, "");
      setData((d) => ({ ...d, dependents }));

      await ask("Thank you! Click Analyze to get your fair decision.");
    } finally {
      setVoiceMode(false);
    }
  };

  const readResult = () => {
    if (!result) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const expl = result.decision === "Approved"
      ? `Approved. Your merit score was ${result.score} out of ${result.total}. Bias factors had zero impact.`
      : `Denied. Your merit score was ${result.score} out of ${result.total}. Bias factors had zero impact.`;
    setSpeaking(true);
    speak(`Decision: ${result.decision}. ${expl}`, () => setSpeaking(false));
  };

  const copyResult = async () => {
    if (!result) return;
    const text =
      `FairMind AI Decision: ${result.decision}\n` +
      `Score: ${result.score}/${result.total}\n` +
      `Bias removed: ${result.biasRemoved.join(", ") || "none"}\n` +
      result.breakdown.map((b) => `- ${b.f}: ${b.v} ${b.s}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("✅ Copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const fieldRow = (
    label: string,
    field: keyof FormData,
    inputEl: React.ReactNode,
  ) => (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">{inputEl}</div>
        <MicButton
          supported={voiceSupported}
          onResult={(t) => set(field, t.trim())}
        />
      </div>
    </div>
  );

  return (
    <section id="tool" className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold">🧪 Try FairMind AI</h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Speak or type your details. We remove bias and explain every decision.
          </p>
        </div>

        <div className="mb-6 bg-primary/10 border border-primary/30 text-primary rounded-xl p-4 text-sm font-medium text-center">
          {voiceSupported
            ? "🎙️ Voice Enabled — Click the mic icon next to any field to speak your answer instead of typing."
            : "🎙️ Voice not supported in this browser. Please use Chrome for voice input."}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="bg-card rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xl font-bold mb-6">📋 Applicant Details</h3>

            {/* Section A — Fair */}
            <div className="border-l-4 border-success pl-4 mb-6">
              <p className="text-sm font-semibold text-success mb-4">✅ These factors ARE used in the decision</p>
              <div className="space-y-4">
                {fieldRow("Annual Income ($) *", "income",
                  <input type="number" value={data.income} onChange={(e) => set("income", e.target.value)}
                    placeholder="e.g. 45000" className={inputCls(errors.income)} />)}
                {fieldRow("Credit Score *", "creditScore",
                  <input type="number" value={data.creditScore} onChange={(e) => set("creditScore", e.target.value)}
                    placeholder="e.g. 700 (300–850)" className={inputCls(errors.creditScore)} />)}
                {fieldRow("Years of Experience *", "experience",
                  <input type="number" value={data.experience} onChange={(e) => set("experience", e.target.value)}
                    placeholder="e.g. 3" className={inputCls(errors.experience)} />)}
                {fieldRow("Education Level *", "education",
                  <select value={data.education} onChange={(e) => set("education", e.target.value)} className={inputCls(errors.education)}>
                    <option value="">Select...</option>
                    <option>High School</option>
                    <option>Bachelor's</option>
                    <option>Master's</option>
                    <option>PhD</option>
                  </select>)}
                {fieldRow("Employment Type", "employmentType",
                  <select value={data.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={inputCls()}>
                    <option value="">Select...</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Self-employed</option>
                    <option>Freelancer</option>
                  </select>)}
                {fieldRow("Number of Dependents", "dependents",
                  <input type="number" value={data.dependents} onChange={(e) => set("dependents", e.target.value)}
                    placeholder="e.g. 2" className={inputCls()} />)}
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 border-t-2 border-dashed border-destructive/50 pt-4">
              <p className="text-sm text-destructive font-semibold mb-4 bg-destructive/10 p-3 rounded-lg">
                ⚠️ BIAS ZONE — Fields below are sensitive. They will be detected and completely removed before any decision is made.
              </p>
            </div>

            {/* Section B — Bias */}
            <div className="border-l-4 border-destructive pl-4">
              <p className="text-sm font-semibold text-destructive mb-4">🚫 These factors are NOT used in the decision</p>
              <div className="space-y-4">
                {fieldRow("Gender", "gender",
                  <select title="This field will be detected as bias and removed" value={data.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls()}>
                    <option>Prefer not to say</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>)}
                {fieldRow("Age", "age",
                  <input type="number" title="This field will be detected as bias and removed" value={data.age} onChange={(e) => set("age", e.target.value)}
                    placeholder="e.g. 34" className={inputCls()} />)}
                {fieldRow("Marital Status", "maritalStatus",
                  <select title="This field will be detected as bias and removed" value={data.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)} className={inputCls()}>
                    <option>Prefer not to say</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>)}
                {fieldRow("Disability Status", "disabilityStatus",
                  <select title="This field will be detected as bias and removed" value={data.disabilityStatus} onChange={(e) => set("disabilityStatus", e.target.value)} className={inputCls()}>
                    <option>Prefer not to say</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>)}
              </div>
            </div>

            {voiceSupported && (
              <button
                onClick={fillByVoice}
                disabled={voiceMode}
                className="mt-6 w-full border-2 border-primary text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-60"
              >
                {voiceMode ? "🎙️ Voice assistant active..." : "🎙️ Fill Entire Form by Voice"}
              </button>
            )}

            {errorMsg && <p className="text-destructive text-sm font-medium mt-4">{errorMsg}</p>}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-lg hover:scale-[1.01]"
            >
              {loading ? loadingMsg : "🔍 Analyze & Decide →"}
            </button>
          </div>

          {/* RIGHT */}
          <div className="bg-card rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xl font-bold mb-6">📊 FairMind Result</h3>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground font-medium">{loadingMsg}</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-muted rounded-xl p-10 text-center animate-soft-pulse">
                <p className="italic text-muted-foreground">
                  🤔 Your fair decision will appear here.<br />
                  Fill the form or use voice input, then click Analyze.
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="animate-fade-in space-y-6">
                {/* Decision badge */}
                <div
                  className={`text-center py-8 rounded-2xl text-3xl font-extrabold text-white ${
                    result.decision === "Approved" ? "bg-success animate-soft-pulse" : "bg-destructive"
                  }`}
                >
                  {result.decision === "Approved" ? "✅ APPROVED" : "❌ DENIED"}
                </div>

                {/* Speak result */}
                <button
                  onClick={readResult}
                  className="w-full bg-primary/10 border border-primary/30 text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {speaking ? "⏹ Stop Reading" : "🔊 Read Result Aloud"}
                </button>

                {/* Bias detected */}
                <div>
                  <h4 className="font-bold mb-2">🚨 Bias Attributes Removed</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.biasRemoved.length === 0 ? (
                      <span className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium">
                        ✅ No bias attributes detected
                      </span>
                    ) : (
                      result.biasRemoved.map((f) => (
                        <span key={f} className="bg-destructive/15 text-destructive px-3 py-1 rounded-full text-sm font-medium border border-destructive/30">
                          {f}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Fair factors */}
                <div>
                  <h4 className="font-bold mb-2">✅ Decision Based On</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Income", "Credit Score", "Experience", "Education", "Employment", "Dependents"].map((f) => (
                      <span key={f} className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium border border-success/30">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score breakdown */}
                <div>
                  <h4 className="font-bold mb-2">📊 Score Breakdown</h4>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Factor</th>
                          <th className="text-left px-3 py-2 font-semibold">Value</th>
                          <th className="text-left px-3 py-2 font-semibold">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.breakdown.map((row) => (
                          <tr key={row.f} className="border-t border-border">
                            <td className="px-3 py-2">{row.f}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.v}</td>
                            <td className="px-3 py-2 font-semibold">{row.s}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    Total Score: <span className="text-primary">{result.score} / {result.total}</span>
                    <span className="text-muted-foreground font-normal"> · Required to pass: 3 / 5</span>
                  </p>
                </div>

                {/* Explanation */}
                <div className="bg-muted rounded-xl p-5">
                  <h4 className="font-bold mb-2">📋 Why This Decision?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.decision === "Approved"
                      ? "Approved based on strong merit factors. Your income, credit score, and experience all meet or exceed the required thresholds. Bias factors (gender, age, marital status, disability) were fully removed and had zero impact on this decision."
                      : "Denied due to insufficient merit score. One or more key factors — income, credit score, or experience — did not meet the minimum threshold. Note: gender, age, marital status, and disability status had absolutely zero impact on this outcome."}
                  </p>
                </div>

                {/* Fairness bar */}
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Fairness Score: 95%</span>
                    <span className="text-success">95%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success animate-grow-bar" style={{ width: "95%" }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All sensitive attributes removed before processing</p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={readResult} className="border-2 border-primary text-primary font-bold py-2 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                    {speaking ? "⏹ Stop" : "🔊 Read Aloud"}
                  </button>
                  <button onClick={handleReset} className="border-2 border-primary text-primary font-bold py-2 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                    🔄 Try Another
                  </button>
                  <button onClick={copyResult} className="border-2 border-primary text-primary font-bold py-2 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                    📋 Copy Result
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Chatbot ----------
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

function Chatbot() {
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

// ---------- Other sections ----------
function HowItWorks() {
  const steps = [
    { icon: "🎙️", title: "Speak or Type", desc: "Use voice input or type your applicant details. Both work perfectly." },
    { icon: "🔍", title: "Bias Detected", desc: "Gender, age, marital status, and disability are flagged as sensitive attributes." },
    { icon: "🧹", title: "Bias Stripped", desc: "Flagged attributes are completely removed. They have zero impact on the outcome." },
    { icon: "✅", title: "Fair Decision", desc: "A transparent, merit-based decision with a full score breakdown and explanation." },
  ];
  return (
    <section id="how" className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">How FairMind AI Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="bg-background border border-border rounded-2xl p-8 h-full hover:scale-105 transition-transform" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2">Step {i + 1} — {s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 text-3xl text-primary font-bold z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMatters() {
  const cards = [
    { icon: "👩", title: "Gender Bias in Hiring", desc: "Studies show women are called back 30% less than equally qualified men by AI hiring tools. FairMind removes gender entirely." },
    { icon: "🏦", title: "Age Bias in Loans", desc: "Applicants over 50 face higher loan denial rates from AI systems despite strong finances. FairMind ignores age completely." },
    { icon: "💍", title: "Marital Status Bias", desc: "Divorced or single applicants face hidden bias in financial AI tools. FairMind treats all marital statuses equally — by ignoring them." },
    { icon: "♿", title: "Disability Bias", desc: "People with disabilities face automated screening bias. FairMind removes disability status before any decision is made." },
  ];
  return (
    <section id="about" className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">Why Fairness in AI Matters</h2>
        <p className="text-center text-muted-foreground mt-3 text-lg">Biased AI causes real harm to real people.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {cards.map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-2xl p-8 hover:scale-105 transition-transform" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="text-5xl mb-4">{c.icon}</div>
              <h3 className="text-xl font-bold mb-2">{c.title}</h3>
              <p className="text-muted-foreground text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const items = [
    "🌐 HTML5 / CSS3 / JavaScript",
    "🎨 Tailwind CSS",
    "🎙️ Web Speech API (Voice Input + Output)",
    "🤖 Rule-Based Fairness Engine",
    "☁️ Cloud Deployed",
  ];
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10">Built With</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {items.map((i) => (
            <div key={i} className="bg-background border border-border rounded-xl py-6 px-3 font-semibold text-sm hover:border-primary transition-colors">
              {i}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm mt-6">No external AI API used. Logic is transparent and fully explainable.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="text-white py-12 px-6" style={{ backgroundColor: "oklch(0.18 0.04 270)" }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-xl font-bold">🧠 FairMind AI</div>
          <p className="mt-2 text-sm opacity-75">Removing Bias. Ensuring Fairness. Explaining Decisions.</p>
        </div>
        <div className="flex flex-col md:items-center gap-2 text-sm">
          <button onClick={() => scrollTo("home")} className="hover:opacity-80">Home</button>
          <button onClick={() => scrollTo("tool")} className="hover:opacity-80">Try It</button>
          <button onClick={() => scrollTo("how")} className="hover:opacity-80">How It Works</button>
          <span className="opacity-80">Chat (bottom-right)</span>
        </div>
        <div className="flex flex-col md:items-end gap-3">
          <span className="font-semibold">🏆 Solution Challenge 2026</span>
          <div className="flex gap-2 flex-wrap md:justify-end">
            <a href="#" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">GitHub</a>
            <a href="#" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">Demo Video</a>
            <a href="#" className="bg-primary hover:opacity-90 px-4 py-2 rounded-lg text-sm transition-opacity">Live App</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-sm opacity-60">
        © 2026 FairMind AI. Built with fairness in mind. 🎙️ Voice-enabled for accessibility.
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <StatsBar />
      <Tool />
      <HowItWorks />
      <WhyMatters />
      <TechStack />
      <Footer />
      <Chatbot />
    </div>
  );
}
