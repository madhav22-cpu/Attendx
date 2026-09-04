import { createFileRoute, Link } from "@tanstack/react-router";
import { Menu, ArrowRight } from "lucide-react";
import { HeroCards } from "@/components/HeroCards";
import logoAsset from "@/assets/attendx-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendX — Track presence without the noise" },
      {
        name: "description",
        content:
          "AttendX tracks attendance effortlessly with QR codes, location verification and real-time analytics.",
      },
      { property: "og:title", content: "AttendX — Track presence without the noise" },
      {
        property: "og:description",
        content:
          "Effortless attendance with QR codes, location verification and real-time analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = ["Home", "How It Works", "About"];

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background px-8 pt-6 pb-8 md:px-16 md:pt-8 md:pb-10">
      <div className="pointer-events-none absolute -right-40 top-[-10rem] h-[42rem] w-[42rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />

      {/* top row */}
      <header className="relative z-10 flex items-center justify-between">
        <a href="/" className="-ml-10 flex items-center md:-ml-16">
          <img
            src={logoAsset.url}
            alt="AttendX"
            width={380}
            height={254}
            className="h-auto w-[380px]"
          />
        </a>

        <div className="flex items-center gap-8 md:gap-12">
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-accent">
            Login
          </Link>
          <button aria-label="Open menu" className="text-foreground hover:text-accent">
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 flex flex-1 flex-col justify-center">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-accent">
              Attendance, reimagined
            </p>
            <h1 className="mt-2 font-display text-[3.5rem] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground sm:text-7xl lg:text-[6.5rem]">
              Track presence
              <br />
              without the
              <br />
              noise.
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
              Track attendance effortlessly using QR codes, location verification and real-time
              analytics.
            </p>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <HeroCards />
          </div>
        </div>
      </section>

      {/* bottom row */}
      <footer className="relative z-10 flex items-end justify-start gap-8">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">EN</span> · हिन्दी
        </p>

        <a
          href="#"
          className="group inline-flex translate-x-[50px] translate-y-[5px] items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5"
        >
          Explore
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </footer>
    </main>
  );
}
