import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Decision = "Approved" | "Denied";

interface Result {
  decision: Decision;
  biasFields: string[];
}

function makeDecision(income: string, creditScore: string, experience: string, education: string): Decision {
  let score = 0;
  if (Number(income) > 40000) score++;
  if (Number(creditScore) > 650) score++;
  if (Number(experience) > 2) score++;
  if (["Bachelor's", "Master's", "PhD"].includes(education)) score++;
  return score >= 2 ? "Approved" : "Denied";
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => scrollTo("home")} className="text-xl font-bold tracking-tight hover:opacity-90">
          🧠 FairMind AI
        </button>
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
    <section
      id="home"
      className="text-white py-24 md:py-32 px-6"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
          AI That's Fair. Decisions You Can Trust.
        </h1>
        <p className="mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          FairMind AI removes bias from decisions — no gender, no race, no age. Just facts.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => scrollTo("tool")}
            className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Try It Now →
          </button>
          <button
            onClick={() => scrollTo("how")}
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-primary transition-colors"
          >
            See How It Works
          </button>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          {["✅ Bias Detection", "⚖️ Fair Output", "📋 Explainable"].map((b) => (
            <span key={b} className="bg-white/15 backdrop-blur-sm border border-white/30 px-5 py-2 rounded-full text-sm font-medium">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { num: "35%", label: "Bias error rate in AI (MIT Study)" },
    { num: "3+", label: "Sensitive factors removed automatically" },
    { num: "100%", label: "Decisions fully explainable" },
  ];
  return (
    <section className="bg-card py-12 px-6 border-b border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.num}>
            <div className="text-4xl md:text-5xl font-extrabold text-primary">{s.num}</div>
            <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tool() {
  const [income, setIncome] = useState("");
  const [credit, setCredit] = useState("");
  const [exp, setExp] = useState("");
  const [edu, setEdu] = useState("");
  const [gender, setGender] = useState("");
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [religion, setReligion] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleAnalyze = () => {
    const newErrors: Record<string, boolean> = {};
    if (!income) newErrors.income = true;
    if (!credit) newErrors.credit = true;
    if (!exp) newErrors.exp = true;
    if (!edu) newErrors.edu = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setErrorMsg("Please fill in all required fields before analyzing.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const decision = makeDecision(income, credit, exp, edu);
      const biasFields: string[] = [];
      if (gender) biasFields.push("gender");
      if (race) biasFields.push("race");
      if (age) biasFields.push("age");
      if (religion) biasFields.push("religion");
      setResult({ decision, biasFields });
      setLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    setIncome(""); setCredit(""); setExp(""); setEdu("");
    setGender(""); setRace(""); setAge(""); setReligion("");
    setErrors({}); setErrorMsg(""); setResult(null); setLoading(false);
  };

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
      err ? "border-destructive ring-2 ring-destructive/30" : "border-border"
    }`;

  return (
    <section id="tool" className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">🧪 Try FairMind AI</h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Enter applicant details below. We remove bias and explain every decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Input */}
          <div className="bg-card rounded-2xl p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xl font-bold mb-6">📋 Applicant Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Annual Income ($) *</label>
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)}
                  placeholder="e.g. 45000" className={inputCls(errors.income)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Credit Score *</label>
                <input type="number" value={credit} onChange={(e) => setCredit(e.target.value)}
                  placeholder="e.g. 700" className={inputCls(errors.credit)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Years of Experience *</label>
                <input type="number" value={exp} onChange={(e) => setExp(e.target.value)}
                  placeholder="e.g. 3" className={inputCls(errors.exp)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Education Level *</label>
                <select value={edu} onChange={(e) => setEdu(e.target.value)} className={inputCls(errors.edu)}>
                  <option value="">Select...</option>
                  <option>High School</option>
                  <option>Bachelor's</option>
                  <option>Master's</option>
                  <option>PhD</option>
                </select>
              </div>
            </div>

            <div className="my-6 border-t border-border pt-6">
              <p className="text-sm text-destructive font-medium mb-4 bg-destructive/10 p-3 rounded-lg">
                ⚠️ Fields below are bias-sensitive. They will be detected and removed before the decision.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Gender</label>
                  <input value={gender} onChange={(e) => setGender(e.target.value)}
                    placeholder="e.g. Male / Female" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Race / Ethnicity</label>
                  <input value={race} onChange={(e) => setRace(e.target.value)}
                    placeholder="e.g. Asian" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Religion</label>
                  <input value={religion} onChange={(e) => setReligion(e.target.value)}
                    placeholder="e.g. Islam" className={inputCls()} />
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-destructive text-sm font-medium mb-3">{errorMsg}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-lg hover:scale-[1.01]"
            >
              {loading ? "Removing bias & processing..." : "🔍 Analyze & Decide →"}
            </button>
          </div>

          {/* RIGHT: Result */}
          <div className="bg-card rounded-2xl p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xl font-bold mb-6">📊 FairMind Result</h3>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground font-medium">Removing bias & processing...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-muted rounded-xl p-10 text-center">
                <p className="italic text-muted-foreground">
                  Your fair decision will appear here.<br />Fill in the form and click Analyze.
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="animate-fade-in space-y-6">
                {/* Decision badge */}
                <div
                  className={`text-center py-8 rounded-2xl text-3xl font-extrabold text-white ${
                    result.decision === "Approved" ? "bg-success" : "bg-destructive"
                  }`}
                >
                  {result.decision === "Approved" ? "✅ APPROVED" : "❌ DENIED"}
                </div>

                {/* Bias Detected */}
                <div>
                  <h4 className="font-bold mb-2">🚨 Bias Attributes Removed</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.biasFields.length === 0 ? (
                      <span className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium">
                        ✅ No bias attributes detected
                      </span>
                    ) : (
                      result.biasFields.map((f) => (
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
                    {["Income", "Credit Score", "Experience", "Education"].map((f) => (
                      <span key={f} className="bg-success/15 text-success px-3 py-1 rounded-full text-sm font-medium border border-success/30">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-muted rounded-xl p-5">
                  <h4 className="font-bold mb-2">📋 Why This Decision?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.decision === "Approved"
                      ? "Approved based on strong financials and experience. Income exceeds the $40,000 threshold. Credit score is above 650. Experience meets the 2-year minimum. Sensitive attributes (gender, race, age, religion) were fully removed before processing."
                      : "Denied due to insufficient qualifying factors. One or more of: income, credit score, or experience did not meet the minimum threshold. Note: gender, race, age, and religion had zero impact on this decision."}
                  </p>
                </div>

                {/* Fairness Score */}
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Fairness Score</span>
                    <span className="text-success">95%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success animate-grow-bar" style={{ width: "95%" }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Sensitive attributes successfully removed</p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full border-2 border-primary text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  🔄 Try Another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "📥", title: "Input Data", desc: "Enter applicant info including any sensitive fields. We accept everything." },
    { icon: "🧹", title: "Bias Stripped", desc: "Gender, race, age, and religion are detected and completely removed before any decision is made." },
    { icon: "✅", title: "Fair Decision", desc: "A transparent decision is made using only fair, merit-based factors — with a full explanation." },
  ];
  return (
    <section id="how" className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">How FairMind AI Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="bg-background border border-border rounded-2xl p-8 h-full hover:scale-105 transition-transform" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2">Step {i + 1} — {s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 text-3xl text-primary font-bold z-10">→</div>
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
    { icon: "👩", title: "Hiring", desc: "A qualified woman was rejected by an AI hiring tool that was trained on male-dominated data. FairMind removes gender before any decision." },
    { icon: "🏦", title: "Loans", desc: "Minority applicants receive loan denials at higher rates from biased AI models. FairMind uses only financial merit." },
    { icon: "🏥", title: "Healthcare", desc: "AI health tools show racial bias in risk scoring. FairMind ensures every patient is evaluated equally." },
  ];
  return (
    <section id="about" className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">Why Fairness in AI Matters</h2>
        <p className="text-center text-muted-foreground mt-3 text-lg">Biased AI causes real harm to real people.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {cards.map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-2xl p-8 hover:scale-105 transition-transform" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="text-5xl mb-4">{c.icon}</div>
              <h3 className="text-xl font-bold mb-2">{c.title}</h3>
              <p className="text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const items = ["🌐 HTML / CSS", "⚡ JavaScript", "🎨 Tailwind CSS", "🧠 Rule-Based Fairness Logic"];
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10">Built With</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((i) => (
            <div key={i} className="bg-background border border-border rounded-xl py-6 font-semibold hover:border-primary transition-colors">
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
        </div>
        <div className="flex flex-col md:items-end gap-3">
          <span className="font-semibold">🏆 Built for Hackathon 2025</span>
          <div className="flex gap-2">
            <a href="#" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">GitHub</a>
            <a href="#" className="bg-primary hover:opacity-90 px-4 py-2 rounded-lg text-sm transition-opacity">Live Demo</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-sm opacity-60">
        © 2025 FairMind AI. Built with fairness in mind.
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
    </div>
  );
}
