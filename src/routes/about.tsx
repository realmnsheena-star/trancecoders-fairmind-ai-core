import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FairMind AI · TranceCoders" },
      { name: "description", content: "FairMind AI by TranceCoders — built for the Solution Challenge 2026 to make AI decisions transparent and bias-free." },
      { property: "og:title", content: "About FairMind AI · TranceCoders" },
      { property: "og:description", content: "Our mission: remove bias, ensure fairness, explain every decision." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto text-white">
        <h1 className="text-3xl md:text-5xl font-extrabold text-center">About TranceCoders</h1>
        <p className="mt-6 text-lg text-white/80 text-center">
          We're building AI tools that put fairness, transparency, and accountability first.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-3xl">🎯</div>
            <div className="mt-3 font-bold text-xl">Our Mission</div>
            <p className="mt-2 text-sm text-white/80">
              Remove hidden bias from automated decisions. Every applicant deserves a fair, merit-based evaluation — regardless of gender, age, marital status, or disability.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-3xl">⚖️</div>
            <div className="mt-3 font-bold text-xl">How We Do It</div>
            <p className="mt-2 text-sm text-white/80">
              FairMind AI uses a transparent, rule-based fairness engine that strips sensitive attributes before scoring — and explains every decision in plain English.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-3xl">🏆</div>
            <div className="mt-3 font-bold text-xl">Solution Challenge 2026</div>
            <p className="mt-2 text-sm text-white/80">
              FairMind AI is TranceCoders' submission to the Solution Challenge 2026 — focused on building accessible, ethical AI for everyone.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-3xl">🎙️</div>
            <div className="mt-3 font-bold text-xl">Built for Accessibility</div>
            <p className="mt-2 text-sm text-white/80">
              Voice input and text-to-speech are built into every interaction so the tool works for everyone, regardless of ability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}