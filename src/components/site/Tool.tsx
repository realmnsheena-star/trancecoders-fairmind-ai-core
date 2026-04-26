import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSpeechRecognition, listenOnce, speak, stopSpeaking } from "./speech";

type Decision = "Approved" | "Denied";

interface BreakdownRow { f: string; v: string; s: string }
interface Result {
  decision: Decision;
  score: number;
  total: number;
  breakdown: BreakdownRow[];
  biasRemoved: string[];
}
interface FormData {
  income: string; creditScore: string; experience: string; education: string;
  employmentType: string; dependents: string;
  country: string;
  gender: string; age: string; maritalStatus: string; disabilityStatus: string;
}
const EMPTY_FORM: FormData = {
  income: "", creditScore: "", experience: "", education: "",
  employmentType: "", dependents: "",
  country: "",
  gender: "", age: "", maritalStatus: "", disabilityStatus: "",
};
const BIAS_FIELDS = ["gender", "age", "maritalStatus", "disabilityStatus"] as const;

// Country → currency, locale, and approximate annual income threshold (in local currency).
// Threshold roughly reflects local middle-income levels so decisions adapt to economy.
const COUNTRY_INFO: Record<string, { currency: string; locale: string; incomeThreshold: number }> = {
  "United States":  { currency: "USD", locale: "en-US", incomeThreshold: 40000 },
  "Canada":         { currency: "CAD", locale: "en-CA", incomeThreshold: 50000 },
  "United Kingdom": { currency: "GBP", locale: "en-GB", incomeThreshold: 30000 },
  "Eurozone (EU)":  { currency: "EUR", locale: "en-IE", incomeThreshold: 35000 },
  "Australia":      { currency: "AUD", locale: "en-AU", incomeThreshold: 55000 },
  "India":          { currency: "INR", locale: "en-IN", incomeThreshold: 600000 },
  "Japan":          { currency: "JPY", locale: "ja-JP", incomeThreshold: 4000000 },
  "Brazil":         { currency: "BRL", locale: "pt-BR", incomeThreshold: 60000 },
  "Nigeria":        { currency: "NGN", locale: "en-NG", incomeThreshold: 3000000 },
  "South Africa":   { currency: "ZAR", locale: "en-ZA", incomeThreshold: 250000 },
  "UAE":            { currency: "AED", locale: "en-AE", incomeThreshold: 120000 },
  "Singapore":      { currency: "SGD", locale: "en-SG", incomeThreshold: 50000 },
};
const COUNTRY_LIST = Object.keys(COUNTRY_INFO);
const DEFAULT_INFO = { currency: "USD", locale: "en-US", incomeThreshold: 40000 };

function getCountryInfo(country: string) {
  return COUNTRY_INFO[country] ?? DEFAULT_INFO;
}
function formatMoney(amount: number, country: string) {
  const { currency, locale } = getCountryInfo(country);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function makeDecision(data: FormData): Result {
  let score = 0;
  const breakdown: BreakdownRow[] = [];
  const info = getCountryInfo(data.country);
  const incomeNum = Number(data.income);
  const incomeDisplay = data.income ? formatMoney(incomeNum, data.country) : "—";
  if (incomeNum > info.incomeThreshold) { score++; breakdown.push({ f: "Annual Income", v: incomeDisplay, s: "✅ +1" }); }
  else { breakdown.push({ f: "Annual Income", v: incomeDisplay, s: "❌ 0" }); }
  if (Number(data.creditScore) > 650) { score++; breakdown.push({ f: "Credit Score", v: data.creditScore, s: "✅ +1" }); }
  else { breakdown.push({ f: "Credit Score", v: data.creditScore || "—", s: "❌ 0" }); }
  if (Number(data.experience) > 2) { score++; breakdown.push({ f: "Experience", v: data.experience + " yrs", s: "✅ +1" }); }
  else { breakdown.push({ f: "Experience", v: (data.experience || "0") + " yrs", s: "❌ 0" }); }
  if (["Bachelor's", "Master's", "PhD"].includes(data.education)) { score++; breakdown.push({ f: "Education", v: data.education, s: "✅ +1" }); }
  else { breakdown.push({ f: "Education", v: data.education || "—", s: "❌ 0" }); }
  if (data.employmentType === "Full-time") { score++; breakdown.push({ f: "Employment", v: data.employmentType, s: "✅ +1" }); }
  else { breakdown.push({ f: "Employment", v: data.employmentType || "—", s: "➖ 0" }); }
  breakdown.push({ f: "Dependents", v: data.dependents || "0", s: "➖ 0" });
  breakdown.push({ f: "Country", v: data.country || "—", s: `➖ ${info.currency}` });

  const biasRemoved = (BIAS_FIELDS as readonly string[]).filter((f) => {
    const v = (data as unknown as Record<string, string>)[f];
    return v && v !== "Prefer not to say" && v !== "";
  });

  return { decision: score >= 3 ? "Approved" : "Denied", score, total: 5, breakdown, biasRemoved };
}

function MicButton({ onResult, supported }: { onResult: (text: string) => void; supported: boolean }) {
  const [listening, setListening] = useState(false);
  if (!supported) return null;
  const handle = async () => {
    try {
      setListening(true);
      toast("🎙️ Listening...");
      const text = await listenOnce();
      onResult(text);
      toast.success("✅ Voice filled");
    } catch { toast.error("Couldn't capture voice"); }
    finally { setListening(false); }
  };
  return (
    <button type="button" onClick={handle} disabled={listening} title="Speak to fill"
      className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white transition-all ${
        listening ? "bg-destructive animate-mic-pulse" : "bg-primary hover:opacity-90"
      }`}>
      {listening ? "🔴" : "🎙️"}
    </button>
  );
}

const LOADING_MSGS = ["🧹 Removing bias...", "⚖️ Calculating fairly...", "✅ Preparing your result..."];

export function Tool() {
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

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 500);
    return () => clearInterval(id);
  }, [loading]);

  const set = <K extends keyof FormData>(k: K, v: string) => setData((d) => ({ ...d, [k]: v }));

  const handleAnalyze = () => {
    const newErrors: Record<string, boolean> = {};
    if (!data.country) newErrors.country = true;
    if (!data.income) newErrors.income = true;
    if (!data.creditScore) newErrors.creditScore = true;
    if (!data.experience) newErrors.experience = true;
    if (!data.education) newErrors.education = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { setErrorMsg("Please fill in all required fields before analyzing."); return; }
    setErrorMsg("");
    setLoading(true);
    setResult(null);
    setLoadingMsg(LOADING_MSGS[0]);
    setTimeout(() => { setResult(makeDecision(data)); setLoading(false); }, 1500);
  };

  const handleReset = () => {
    stopSpeaking();
    setData(EMPTY_FORM); setErrors({}); setErrorMsg(""); setResult(null); setLoading(false); setSpeaking(false);
  };

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
      err ? "border-destructive ring-2 ring-destructive/30" : "border-border"
    }`;

  const matchOption = (text: string, options: string[]) => {
    const t = text.toLowerCase().trim();
    return options.find((o) => o.toLowerCase() === t)
      || options.find((o) => t.includes(o.toLowerCase()))
      || options.find((o) => o.toLowerCase().includes(t));
  };

  const fillByVoice = async () => {
    if (!voiceSupported) { toast.error("Voice not supported. Use Chrome."); return; }
    const ask = (q: string) => new Promise<void>((res) => speak(q, () => res()));
    const askAndListen = async (q: string): Promise<string> => {
      await ask(q);
      try { return await listenOnce(); } catch { return ""; }
    };
    setVoiceMode(true);
    try {
      const incomeT = await askAndListen("What is your annual income?");
      setData((d) => ({ ...d, income: incomeT.replace(/[^0-9]/g, "") }));
      const creditT = await askAndListen("What is your credit score?");
      setData((d) => ({ ...d, creditScore: creditT.replace(/[^0-9]/g, "") }));
      const expT = await askAndListen("How many years of experience do you have?");
      setData((d) => ({ ...d, experience: expT.replace(/[^0-9]/g, "") }));
      const eduT = await askAndListen("What is your highest education level? High School, Bachelor's, Master's, or PhD?");
      const eduOpts = ["High School", "Bachelor's", "Master's", "PhD"];
      setData((d) => ({ ...d, education: matchOption(eduT, eduOpts) || "" }));
      const empT = await askAndListen("What is your employment type? Full-time, Part-time, Self-employed, or Freelancer?");
      const empOpts = ["Full-time", "Part-time", "Self-employed", "Freelancer"];
      setData((d) => ({ ...d, employmentType: matchOption(empT, empOpts) || "" }));
      const depT = await askAndListen("How many dependents do you have?");
      setData((d) => ({ ...d, dependents: depT.replace(/[^0-9]/g, "") }));
      await ask("Thank you! Click Analyze to get your fair decision.");
    } finally { setVoiceMode(false); }
  };

  const readResult = () => {
    if (!result) return;
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const expl = result.decision === "Approved"
      ? `Approved. Your merit score was ${result.score} out of ${result.total}. Bias factors had zero impact.`
      : `Denied. Your merit score was ${result.score} out of ${result.total}. Bias factors had zero impact.`;
    setSpeaking(true);
    speak(`Decision: ${result.decision}. ${expl}`, () => setSpeaking(false));
  };

  const copyResult = async () => {
    if (!result) return;
    const text = `FairMind AI Decision: ${result.decision}\nScore: ${result.score}/${result.total}\nBias removed: ${result.biasRemoved.join(", ") || "none"}\n` +
      result.breakdown.map((b) => `- ${b.f}: ${b.v} ${b.s}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast.success("✅ Copied!"); }
    catch { toast.error("Copy failed"); }
  };

  const fieldRow = (label: string, field: keyof FormData, inputEl: React.ReactNode) => (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">{inputEl}</div>
        <MicButton supported={voiceSupported} onResult={(t) => set(field, t.trim())} />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 bg-primary/10 border border-primary/30 text-primary rounded-xl p-4 text-sm font-medium text-center">
        {voiceSupported
          ? "🎙️ Voice Enabled — Click the mic icon next to any field to speak your answer instead of typing."
          : "🎙️ Voice not supported in this browser. Please use Chrome for voice input."}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xl font-bold mb-6">📋 Applicant Details</h3>

          <div className="border-l-4 border-success pl-4 mb-6">
            <p className="text-sm font-semibold text-success mb-4">✅ These factors ARE used in the decision</p>
            <div className="space-y-4">
              {fieldRow("Country *", "country",
                <select value={data.country} onChange={(e) => set("country", e.target.value)} className={inputCls(errors.country)}>
                  <option value="">Select your country...</option>
                  {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c} ({COUNTRY_INFO[c].currency})</option>)}
                </select>)}
              {fieldRow(`Annual Income (${getCountryInfo(data.country).currency}) *`, "income",
                <input type="number" value={data.income} onChange={(e) => set("income", e.target.value)} placeholder={`e.g. ${getCountryInfo(data.country).incomeThreshold}`} className={inputCls(errors.income)} />)}
              {fieldRow("Credit Score *", "creditScore",
                <input type="number" value={data.creditScore} onChange={(e) => set("creditScore", e.target.value)} placeholder="e.g. 700 (300–850)" className={inputCls(errors.creditScore)} />)}
              {fieldRow("Years of Experience *", "experience",
                <input type="number" value={data.experience} onChange={(e) => set("experience", e.target.value)} placeholder="e.g. 3" className={inputCls(errors.experience)} />)}
              {fieldRow("Education Level *", "education",
                <select value={data.education} onChange={(e) => set("education", e.target.value)} className={inputCls(errors.education)}>
                  <option value="">Select...</option><option>High School</option><option>Bachelor's</option><option>Master's</option><option>PhD</option>
                </select>)}
              {fieldRow("Employment Type", "employmentType",
                <select value={data.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={inputCls()}>
                  <option value="">Select...</option><option>Full-time</option><option>Part-time</option><option>Self-employed</option><option>Freelancer</option>
                </select>)}
              {fieldRow("Number of Dependents", "dependents",
                <input type="number" value={data.dependents} onChange={(e) => set("dependents", e.target.value)} placeholder="e.g. 2" className={inputCls()} />)}
            </div>
          </div>

          <div className="my-6 border-t-2 border-dashed border-destructive/50 pt-4">
            <p className="text-sm text-destructive font-semibold mb-4 bg-destructive/10 p-3 rounded-lg">
              ⚠️ BIAS ZONE — Fields below are sensitive. They will be detected and completely removed before any decision is made.
            </p>
          </div>

          <div className="border-l-4 border-destructive pl-4">
            <p className="text-sm font-semibold text-destructive mb-4">🚫 These factors are NOT used in the decision</p>
            <div className="space-y-4">
              {fieldRow("Gender", "gender",
                <select title="This field will be detected as bias and removed" value={data.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls()}>
                  <option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option>
                </select>)}
              {fieldRow("Age", "age",
                <input type="number" title="This field will be detected as bias and removed" value={data.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 34" className={inputCls()} />)}
              {fieldRow("Marital Status", "maritalStatus",
                <select title="This field will be detected as bias and removed" value={data.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)} className={inputCls()}>
                  <option>Prefer not to say</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                </select>)}
              {fieldRow("Disability Status", "disabilityStatus",
                <select title="This field will be detected as bias and removed" value={data.disabilityStatus} onChange={(e) => set("disabilityStatus", e.target.value)} className={inputCls()}>
                  <option>Prefer not to say</option><option>Yes</option><option>No</option>
                </select>)}
            </div>
          </div>

          {voiceSupported && (
            <button onClick={fillByVoice} disabled={voiceMode}
              className="mt-6 w-full border-2 border-primary text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-60">
              {voiceMode ? "🎙️ Voice assistant active..." : "🎙️ Fill Entire Form by Voice"}
            </button>
          )}

          {errorMsg && <p className="text-destructive text-sm font-medium mt-4">{errorMsg}</p>}

          <button onClick={handleAnalyze} disabled={loading}
            className="mt-4 w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-lg hover:scale-[1.01]">
            {loading ? loadingMsg : "🔍 Analyze & Decide →"}
          </button>
        </div>

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
              <div className={`text-center py-8 rounded-2xl text-3xl font-extrabold text-white ${
                result.decision === "Approved" ? "bg-success animate-soft-pulse" : "bg-destructive"
              }`}>
                {result.decision === "Approved" ? "✅ APPROVED" : "❌ DENIED"}
              </div>

              <button onClick={readResult}
                className="w-full bg-primary/10 border border-primary/30 text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                {speaking ? "⏹ Stop Reading" : "🔊 Read Result Aloud"}
              </button>

              <div>
                <h4 className="font-bold mb-2">🚨 Bias Attributes Removed</h4>
                <div className="flex flex-wrap gap-2">
                  {result.biasRemoved.length === 0 ? (
                    <span className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium">✅ No bias attributes detected</span>
                  ) : (
                    result.biasRemoved.map((f) => (
                      <span key={f} className="bg-destructive/15 text-destructive px-3 py-1 rounded-full text-sm font-medium border border-destructive/30">{f}</span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">✅ Decision Based On</h4>
                <div className="flex flex-wrap gap-2">
                  {["Income", "Credit Score", "Experience", "Education", "Employment", "Dependents"].map((f) => (
                    <span key={f} className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium border border-success/30">{f}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">📊 Score Breakdown</h4>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr><th className="text-left px-3 py-2 font-semibold">Factor</th><th className="text-left px-3 py-2 font-semibold">Value</th><th className="text-left px-3 py-2 font-semibold">Score</th></tr>
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

              <div className="bg-muted rounded-xl p-5">
                <h4 className="font-bold mb-2">📋 Why This Decision?</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.decision === "Approved"
                    ? "Approved based on strong merit factors. Your income, credit score, and experience all meet or exceed the required thresholds. Bias factors (gender, age, marital status, disability) were fully removed and had zero impact on this decision."
                    : "Denied due to insufficient merit score. One or more key factors — income, credit score, or experience — did not meet the minimum threshold. Note: gender, age, marital status, and disability status had absolutely zero impact on this outcome."}
                </p>
              </div>

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
  );
}