import { Link } from "@tanstack/react-router";

export function Navbar() {
  const links: { to: "/" | "/how-it-works" | "/try" | "/about"; label: string }[] = [
    { to: "/", label: "Home" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/try", label: "Try It" },
    { to: "/about", label: "About" },
  ];
  return (
    <nav className="sticky top-0 z-50 bg-primary/80 backdrop-blur-md text-primary-foreground shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-90">
            🧠 TranceCoders
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
            </span>
            AI Assistant Online
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "opacity-100 underline underline-offset-4" }}
              inactiveProps={{ className: "opacity-80" }}
              className="hover:opacity-100 transition-opacity"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}