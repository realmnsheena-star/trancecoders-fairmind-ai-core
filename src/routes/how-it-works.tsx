import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — FairMind AI · TranceCoders" },
      { name: "description", content: "See how FairMind AI detects and removes bias before making merit-based, explainable decisions." },
      { property: "og:title", content: "How FairMind AI Works · TranceCoders" },
      { property: "og:description", content: "Speak or type, bias detected, bias stripped, fair decision delivered." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const steps = [
    { icon: "🎙️", title: "Speak or Type", desc: "Use voice input or type your applicant details. Both work perfectly." },
    { icon: "🔍", title: "Bias Detected", desc: "Gender, age, marital status, and disability are flagged as sensitive attributes." },
    { icon: "🧹", title: "Bias Stripped", desc: "Flagged attributes are completely removed. They have zero impact on the outcome." },
    { icon: "✅", title: "Fair Decision", desc: "A transparent, merit-based decision with a full score breakdown and explanation." },
  ];
  const cards = [
    { icon: "👩", title: "Gender Bias in Hiring", desc: "Studies show women are called back 30% less than equally qualified men by AI hiring tools. FairMind removes gender entirely." },
    { icon: "🏦", title: "Age Bias in Loans", desc: "Applicants over 50 face higher loan denial rates from AI systems despite strong finances. FairMind ignores age completely." },
    { icon: "💍", title: "Marital Status Bias", desc: "Divorced or single applicants face hidden bias in financial AI tools. FairMind treats all marital statuses equally — by ignoring them." },
    { icon: "♿", title: "Disability Bias", desc: "People with disabilities face automated screening bias. FairMind removes disability status before any decision is made." },
  ];
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto text-white">
        <h1 className="text-3xl md:text-5xl font-extrabold text-center">How FairMind AI Works</h1>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-4xl">{s.icon}</div>
              <div className="mt-3 font-bold text-lg">Step {i + 1} — {s.title}</div>
              <p className="mt-2 text-sm text-white/80">{s.desc}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-20 text-2xl md:text-4xl font-extrabold text-center">Why Fairness in AI Matters</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-3 font-bold text-lg">{c.title}</div>
              <p className="mt-2 text-sm text-white/80">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/try" className="inline-block bg-primary hover:opacity-90 text-primary-foreground px-8 py-4 rounded-xl font-bold shadow-lg transition-opacity">
            🎯 Try It Now
          </Link>
        </div>
      </div>
    </section>
  );
}