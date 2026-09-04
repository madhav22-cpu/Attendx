import { Check, Clock, MapPin, Users, Monitor, ArrowRight } from "lucide-react";

const bars = [0.55, 0.8, 0.45, 1, 0.6, 0.35, 0.85, 0.5, 0.7, 0.4, 0.9, 0.6, 0.45, 0.75];

function Qr() {
  const cells = [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1];
  return (
    <div className="grid grid-cols-5 gap-[3px]">
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-[7px] w-[7px] rounded-[1px] ${c ? "bg-foreground" : "bg-foreground/10"}`}
        />
      ))}
    </div>
  );
}

export function HeroCards() {
  return (
    <div className="relative h-[26rem] w-full max-w-[34rem] sm:h-[30rem]">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-8 rounded-full bg-[var(--glow-warm)] blur-3xl" />

      {/* Location verified */}
      <div className="absolute right-0 top-0 z-30 flex animate-float items-center gap-3 rounded-2xl bg-card px-5 py-3.5 shadow-[0_24px_50px_-20px_rgba(60,40,30,0.35)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check size={16} strokeWidth={3} />
        </span>
        <span className="text-sm text-muted-foreground">Location verified</span>
      </div>

      {/* Classroom card — back left */}
      <div
        style={{ left: "0%", top: "2%" }}
        className="absolute z-10 w-[11.5rem] -rotate-[8deg] rounded-2xl bg-card p-5 shadow-[0_30px_60px_-25px_rgba(60,40,30,0.35)]"
      >
        <div className="flex items-center gap-2.5">
          <Monitor size={18} className="text-accent" strokeWidth={1.6} />
          <p className="text-sm font-semibold text-foreground">Computer Networks</p>
        </div>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2.5">
            <Clock size={15} strokeWidth={1.5} /> 09:00 AM
          </p>
          <p className="flex items-center gap-2.5">
            <MapPin size={15} strokeWidth={1.5} /> Room - 302
          </p>
          <p className="flex items-center gap-2.5">
            <Users size={15} strokeWidth={1.5} /> 45 Students
          </p>
        </div>
        <div className="mt-4 border-t border-border/60 pt-3">
          <span className="flex items-center justify-between text-sm text-accent">
            Mark Attendance <ArrowRight size={15} />
          </span>
        </div>
      </div>

      {/* Student ID — main */}
      <div
        style={{ left: "22%", top: "16%" }}
        className="absolute z-20 w-[20rem] -rotate-[5deg] rounded-[1.75rem] bg-card/95 p-7 shadow-[0_50px_90px_-30px_rgba(60,40,30,0.45)] backdrop-blur-sm sm:w-[21rem]"
      >
        <div className="flex items-start justify-between">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Student ID
          </p>
          <p className="text-xs font-semibold tracking-tight text-foreground">
            Attend<span className="text-accent">X</span>
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
            AR
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">Aarav Rathore</p>
            <p className="text-sm text-muted-foreground">CS · 2026 · B-14</p>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-border/60 pt-5">
          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              Checked in
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-foreground">
              09:42 <span className="text-sm text-muted-foreground">AM</span>
            </p>
          </div>
          <Qr />
        </div>
      </div>

      {/* Stats card */}
      <div
        style={{ bottom: "2%", right: "-4%" }}
        className="absolute z-30 w-[12.5rem] rotate-[4deg] rounded-3xl bg-card p-6 shadow-[0_40px_70px_-30px_rgba(60,40,30,0.4)]"
      >
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Today
        </p>
        <p className="mt-1 font-display text-4xl font-semibold text-foreground">
          96<span className="text-accent">%</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">142 of 148 present</p>
        <div className="mt-4 flex h-8 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h * 100}%` }}
              className={`w-2 rounded-full ${i % 3 === 2 ? "bg-muted" : "bg-accent/80"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
