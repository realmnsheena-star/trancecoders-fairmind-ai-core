import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="text-white py-12 px-6 mt-auto" style={{ backgroundColor: "oklch(0.12 0.04 270 / 0.85)" }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-xl font-bold">🧠 TranceCoders · FairMind AI</div>
          <p className="mt-2 text-sm opacity-75">Removing Bias. Ensuring Fairness. Explaining Decisions.</p>
        </div>
        <div className="flex flex-col md:items-center gap-2 text-sm">
          <Link to="/" className="hover:opacity-80">Home</Link>
          <Link to="/try" className="hover:opacity-80">Try It</Link>
          <Link to="/how-it-works" className="hover:opacity-80">How It Works</Link>
          <Link to="/about" className="hover:opacity-80">About</Link>
        </div>
        <div className="flex flex-col md:items-end gap-3">
          <span className="font-semibold">🏆 Solution Challenge 2026 · TranceCoders</span>
          <div className="flex gap-2 flex-wrap md:justify-end">
            <a href="#" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">GitHub</a>
            <a href="#" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">Demo Video</a>
            <a href="#" className="bg-primary hover:opacity-90 px-4 py-2 rounded-lg text-sm transition-opacity">Live App</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-sm opacity-70">
        © 2026 TranceCoders · FairMind AI. Built with fairness in mind. 🎙️ Voice-enabled for accessibility.
      </div>
    </footer>
  );
}