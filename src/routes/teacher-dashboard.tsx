import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, ArrowRight, CalendarDays, Users, Loader2 } from "lucide-react";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { QrSessionModal } from "@/components/teacher/QrSessionModal";
import { ClassManager } from "@/components/teacher/ClassManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useTeacherDashboardData } from "@/hooks/useTeacherDashboard";

export const Route = createFileRoute("/teacher-dashboard")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — AttendX" },
      {
        name: "description",
        content:
          "Start attendance sessions, generate class QR codes and follow today's attendance in one calm view.",
      },
      { property: "og:title", content: "Teacher Dashboard — AttendX" },
      {
        property: "og:description",
        content: "Generate attendance QR codes and track today's classes with AttendX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ProtectedRoute allow="teacher">
      <TeacherDashboard />
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

function TeacherDashboard() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>(undefined);

  const {
    loading,
    error,
    classes,
    rosters,
    totalStudents,
    attendanceRate,
    activeSessionsCount,
    recentSessions,
  } = useTeacherDashboardData();

  const openModal = (classId?: string) => {
    setPreselect(classId);
    setOpen(true);
  };

  const quickActions = [
    { label: "Generate QR", icon: QrCode, onClick: () => openModal(undefined) },
    { label: "Manage classes", icon: CalendarDays, to: "/teacher-schedule" as const },
    { label: "View students", icon: Users, to: "/teacher-profile" as const },
  ];

  const firstName = (profile?.name ?? "Teacher").split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed -right-40 top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />

      <TeacherHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-4 md:px-10 md:pt-8">
        {/* HEADER */}
        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 border-b border-border/70 pb-9">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-medium uppercase tracking-[0.35em] text-accent">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Good morning,
              <br />
              {firstName}.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Manage today's attendance with ease.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-foreground">
                {profile?.name ?? "Teacher"}
              </p>
              <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground">
                Faculty
              </p>
            </div>
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            Couldn't load your dashboard data. Please refresh the page.
          </p>
        )}

        {/* PRIMARY CTA */}
        <section className="relative mt-10 overflow-hidden rounded-[1.75rem] border border-border/60 bg-[oklch(0.968_0.018_75)] px-7 py-9 md:px-11 md:py-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.32em] text-accent">
                Generate attendance QR
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.75rem]">
                Start a session.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Start an attendance session for your class.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openModal(undefined)}
              className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5"
            >
              <QrCode size={18} strokeWidth={1.7} />
              Generate QR
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="mt-10 grid grid-cols-2 divide-border/70 rounded-[1.5rem] border border-border/60 sm:grid-cols-4 sm:divide-x">
          <Stat n={String(classes.length)} label="Your classes" />
          <Stat n={String(totalStudents)} label="Total students" />
          <Stat n={`${attendanceRate}%`} label="Today's attendance" />
          <Stat n={String(activeSessionsCount)} label="Active sessions" />
        </section>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
          </div>
        ) : (
          <>
            {/* MAIN GRID */}
            <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <section>
                <ClassManager classes={classes} rosters={rosters} onGenerateQr={openModal} />
              </section>

              <section>
                <SectionTitle>Recent sessions</SectionTitle>
                {recentSessions.length === 0 ? (
                  <p className="mt-5 text-sm text-muted-foreground">
                    No attendance sessions yet. Generate a QR code to start taking attendance.
                  </p>
                ) : (
                  <ul className="mt-6 space-y-6">
                    {recentSessions.slice(0, 6).map((s) => (
                      <li key={s.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {s.subject} {s.section && `· ${s.section}`}
                            {s.active && (
                              <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-accent">
                                Live
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {s.present} / {s.total || "—"} present
                          </p>
                        </div>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{
                              width: `${s.total > 0 ? Math.min(100, (s.present / s.total) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* QUICK ACTIONS */}
            <section className="mt-16 border-t border-border/70 pt-10">
              <SectionTitle>Quick actions</SectionTitle>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {quickActions.map((a) => {
                  const Icon = a.icon;
                  const inner = (
                    <>
                      <Icon size={16} strokeWidth={1.6} className="shrink-0 text-accent" />
                      <span className="truncate text-[0.7rem] font-medium uppercase tracking-[0.14em]">
                        {a.label}
                      </span>
                    </>
                  );
                  const cls =
                    "flex items-center gap-3 rounded-full border border-border px-5 py-3.5 text-foreground transition-colors hover:border-accent hover:text-accent";
                  return "to" in a && a.to ? (
                    <Link key={a.label} to={a.to} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <button
                      key={a.label}
                      type="button"
                      onClick={"onClick" in a ? a.onClick : undefined}
                      className={cls}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <QrSessionModal
        open={open}
        classes={classes}
        initialClassId={preselect}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
