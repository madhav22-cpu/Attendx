import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useTeacherDashboardData } from "@/hooks/useTeacherDashboard";

export const Route = createFileRoute("/teacher-profile")({
  head: () => ({
    meta: [
      { title: "Teacher Profile — AttendX" },
      {
        name: "description",
        content: "Your AttendX teaching profile: name, email and classes.",
      },
      { property: "og:title", content: "Teacher Profile — AttendX" },
      {
        property: "og:description",
        content: "Teaching profile details and account actions in AttendX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ProtectedRoute allow="teacher">
      <TeacherProfile />
    </ProtectedRoute>
  ),
});

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/70 py-5">
      <p className="text-[0.65rem] uppercase tracking-[0.26em] text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function TeacherProfile() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const { classes, totalStudents } = useTeacherDashboardData();
  const name = profile?.name ?? "Teacher";

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed -right-40 top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />
      <TeacherHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10 md:pt-10">
        <section className="border-b border-border/70 pb-10">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.35em] text-accent">
            Teacher
          </p>
          <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl">
            Profile.
          </h1>
        </section>

        <section className="mt-12 rounded-[2rem] bg-card p-8 shadow-[0_40px_80px_-50px_rgba(60,40,30,0.5)] md:p-10">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
              {initialsFor(name)}
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="mt-8">
            <Row label="Email" value={profile?.email ?? "—"} />
            <Row label="Classes" value={String(classes.length)} />
            <Row label="Total students" value={String(totalStudents)} />
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-9 inline-flex items-center gap-3 rounded-full border border-border px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <LogOut size={15} strokeWidth={1.7} />
            Logout
          </button>
        </section>
      </main>
    </div>
  );
}
