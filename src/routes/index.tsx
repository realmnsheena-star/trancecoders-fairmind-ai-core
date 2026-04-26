import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FairMind AI — Fair, Explainable Decisions · TranceCoders" },
      { name: "description", content: "FairMind AI by TranceCoders removes bias from decisions — no gender, no age, no marital status. Just facts." },
      { property: "og:title", content: "FairMind AI — by TranceCoders" },
      { property: "og:description", content: "AI that's fair. Decisions you can trust. Bias removed, every decision explained." },
    ],
  }),
  component: HomePage,
});

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
  return <div ref={ref} className="text-4xl md:text-5xl font-extrabold text-white">{n}{suffix}</div>;
}

function HomePage() {
  return (
    <>
      <section className="text-white py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-6">
            By TranceCoders
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            AI That's Fair. Decisions You Can Trust.
          </h1>
          <p className="mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            FairMind AI removes bias from decisions — no gender, no age, no marital status. Just facts.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/try"
              className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg">
              🎯 Try It Now
            </Link>
            <Link to="/how-it-works"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-primary transition-colors">
              ▶ See How It Works
            </Link>
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

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-10">
          <div>
            <CountUp target={35} suffix="%" />
            <div className="mt-2 text-sm text-white/70">AI bias error rate (MIT Study)</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-extrabold text-white">4 Factors</div>
            <div className="mt-2 text-sm text-white/70">Bias attributes removed</div>
          </div>
          <div>
            <CountUp target={100} suffix="%" />
            <div className="mt-2 text-sm text-white/70">Decisions fully explainable</div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready for a fair decision?</h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Try the FairMind AI tool now or learn how the bias-removal pipeline works under the hood.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/try" className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg">
              🧪 Open the Tool
            </Link>
            <Link to="/about" className="border-2 border-white/50 text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-primary transition">
              Why It Matters
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}