import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QrCode, MapPin, Users, Loader2 } from "lucide-react";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { QrSessionModal } from "@/components/teacher/QrSessionModal";
import { ClassManager } from "@/components/teacher/ClassManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTeacherDashboardData } from "@/hooks/useTeacherDashboard";

export const Route = createFileRoute("/teacher-schedule")({
  head: () => ({
    meta: [
      { title: "Your Classes — AttendX" },
      {
        name: "description",
        content: "Your classes, rosters and session history with instant QR attendance generation.",
      },
      { property: "og:title", content: "Your Classes — AttendX" },
      {
        property: "og:description",
        content: "Classes, rosters and instant QR attendance sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ProtectedRoute allow="teacher">
      <TeacherSchedule />
    </ProtectedRoute>
  ),
});

function TeacherSchedule() {
  const [open, setOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>(undefined);
  const { loading, classes, rosters, recentSessions } = useTeacherDashboardData();

  const openModal = (classId?: string) => {
    setPreselect(classId);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed -right-40 top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />
      <TeacherHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-6 md:px-10 md:pt-10">
        <section className="border-b border-border/70 pb-10">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.35em] text-accent">
            Your classes
          </p>
          <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl">
            Classes.
          </h1>
        </section>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
          </div>
        ) : (
          <div className="space-y-12 py-12">
            <ClassManager classes={classes} rosters={rosters} onGenerateQr={openModal} />

            <section>
              <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Roster
              </h2>
              {classes.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  Create a class above to see its roster here. Share the class join code with
                  students so they can enroll.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-border/70">
                  {classes.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-5"
                    >
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {c.subject} · {c.section}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          {c.room && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} strokeWidth={1.5} /> Room {c.room}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={14} strokeWidth={1.5} /> {(rosters[c.id] ?? []).length}{" "}
                            enrolled
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModal(c.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent hover:text-accent"
                      >
                        <QrCode size={14} strokeWidth={1.7} />
                        Generate QR
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Session history
              </h2>
              {recentSessions.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                <ul className="mt-5 divide-y divide-border/70">
                  {recentSessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 py-4">
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
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
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
