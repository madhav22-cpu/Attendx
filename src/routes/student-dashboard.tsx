import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Loader2, QrCode, Plus } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { QrScanner } from "@/components/student/QrScanner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useJoinClass, useStudentDashboardData } from "@/hooks/useStudentDashboard";

export const Route = createFileRoute("/student-dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — AttendX" },
      {
        name: "description",
        content:
          "Follow today's classes, mark your attendance and track your attendance history in one calm view.",
      },
      { property: "og:title", content: "Student Dashboard — AttendX" },
      {
        property: "og:description",
        content: "Track today's classes and your attendance history with AttendX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ProtectedRoute allow="student">
      <StudentDashboard />
    </ProtectedRoute>
  ),
});

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="px-6 py-6 md:px-8">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-[2.75rem]">
        {n}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-[1.75rem]">
      {children}
    </h2>
  );
}

function JoinClassForm({ onJoined }: { onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const joinClass = useJoinClass();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter a class join code.");
      return;
    }
    try {
      await joinClass.mutateAsync(code.trim());
      setCode("");
      setOpen(false);
      onJoined();
    } catch (err) {
      console.error("Failed to join class:", err);
      setError(err instanceof Error ? err.message : "Couldn't join that class.");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={14} strokeWidth={1.8} />
        Join a class
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-wrap items-center gap-2">
      <input
        placeholder="Join code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="w-32 rounded-full border border-border bg-background px-4 py-2 text-sm uppercase tracking-[0.1em] text-foreground outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={joinClass.isPending}
        className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-accent-foreground disabled:opacity-60"
      >
        {joinClass.isPending ? "Joining..." : "Join"}
      </button>
      {error && <span className="w-full text-xs text-red-500">{error}</span>}
    </form>
  );
}

function StudentDashboard() {
  const { profile } = useAuth();
  const [scannerOpen, setScannerOpen] = useState(false);
  const {
    loading,
    error,
    classes,
    percent,
    attended,
    missed,
    total,
    history,
    attendance,
    refetch,
  } = useStudentDashboardData();

  const name = profile?.name ?? "Student";

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed -right-40 top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />

      <StudentHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-4 md:px-10 md:pt-8">
        {/* HEADER */}
        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 border-b border-border/70 pb-9">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-medium uppercase tracking-[0.35em] text-accent">
              {classes.length} enrolled {classes.length === 1 ? "class" : "classes"}
            </p>
            <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Welcome back,
              <br />
              {name.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Scan your teacher's QR code to mark attendance for a live session.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5"
            >
              <QrCode size={14} strokeWidth={1.8} />
              Scan attendance
            </button>
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Couldn't load your dashboard data. Please refresh the page.
          </p>
        )}

        {/* PRIMARY ATTENDANCE CARD */}
        <section className="relative mt-10 overflow-hidden rounded-[1.75rem] border border-border/60 bg-[oklch(0.968_0.018_75)] px-7 py-9 md:px-11 md:py-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.32em] text-accent">
                Overall attendance
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.75rem]">
                {percent}% present.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {attended} of {total} sessions attended so far.
              </p>
            </div>
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-accent/25 md:h-28 md:w-28">
              <span className="font-display text-2xl font-semibold text-accent md:text-3xl">
                {percent}%
              </span>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="mt-10 grid grid-cols-2 divide-border/70 rounded-[1.5rem] border border-border/60 sm:grid-cols-4 sm:divide-x">
          <Stat n={String(classes.length)} label="Enrolled classes" />
          <Stat n={String(attended)} label="Sessions attended" />
          <Stat n={String(missed)} label="Sessions missed" />
          <Stat n={`${percent}%`} label="Attendance rate" />
        </section>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <section>
              <div className="flex items-center justify-between gap-4">
                <SectionTitle>Your classes</SectionTitle>
                <JoinClassForm onJoined={refetch} />
              </div>
              <ul className="mt-5 divide-y divide-border/70">
                {classes.length === 0 && (
                  <li className="py-6 text-sm text-muted-foreground">
                    You haven't joined any classes yet. Ask your teacher for a join code.
                  </li>
                )}
                {classes.map((c) => (
                  <li key={c.id} className="flex items-center gap-5 py-5">
                    <div className="min-w-0">
                      <p className="truncate text-[0.95rem] font-semibold text-foreground">
                        {c.subject} · {c.section}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {c.room && (
                          <>
                            <MapPin size={13} strokeWidth={1.5} /> {c.room}
                          </>
                        )}
                        <span>{c.teacherName}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <AttendanceCalendar attendance={attendance} />

              <div className="mt-10">
                <SectionTitle>Recent history</SectionTitle>
                <ul className="mt-5 space-y-4">
                  {history.length === 0 && (
                    <li className="text-sm text-muted-foreground">No attendance recorded yet.</li>
                  )}
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {h.subject}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {h.date} · {h.time}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-accent">
                        <CheckCircle2 size={14} strokeWidth={1.8} /> Present
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>

      <QrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onMarked={refetch} />
    </div>
  );
}
