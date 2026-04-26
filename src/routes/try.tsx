import { createFileRoute } from "@tanstack/react-router";
import { Tool } from "@/components/site/Tool";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try FairMind AI — Fair Decision Tool · TranceCoders" },
      { name: "description", content: "Enter your details, watch bias get stripped, and get an explainable, merit-based decision in seconds." },
      { property: "og:title", content: "Try FairMind AI · TranceCoders" },
      { property: "og:description", content: "Speak or type your details — FairMind removes bias and explains every decision." },
    ],
  }),
  component: TryPage,
});

function TryPage() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold">🧪 Try FairMind AI</h1>
          <p className="mt-3 text-white/80 text-lg max-w-2xl mx-auto">
            Speak or type your details. We remove bias and explain every decision.
          </p>
        </div>
        <Tool />
      </div>
    </section>
  );
}