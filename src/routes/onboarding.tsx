import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createStudentProfile } from "@/lib/firestore";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Finish setting up — AttendX" }],
  }),
  component: OnboardingPage,
});

/**
 * Shown when a Firebase-authenticated user (typically via Google sign-in)
 * has no users/{uid} document yet. Rather than crashing the dashboard, we
 * land them here to finish setting up a student profile. Like registration,
 * this can only ever create a "student" profile.
 */
function OnboardingPage() {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (profile) {
      // Profile already exists (e.g. user navigated here manually) — send
      // them to the right dashboard instead of letting them re-onboard.
      void navigate({
        to: profile.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard",
        replace: true,
      });
      return;
    }
    setName(user.displayName ?? "");
  }, [loading, user, profile, navigate]);

  if (loading || !user || profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await createStudentProfile(user.uid, name.trim(), user.email ?? "");
      await navigate({ to: "/student-dashboard" });
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Couldn't create your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[oklch(0.97_0.02_60)] px-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-card p-8 shadow-[0_40px_80px_-50px_rgba(60,40,30,0.5)]">
        <p className="text-[0.66rem] font-medium uppercase tracking-[0.32em] text-accent">
          Almost there
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground">
          Finish setting up
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find an AttendX profile for {user.email}. Let's create your student profile.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <UserIcon
              size={16}
              strokeWidth={1.6}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Setting up..." : "Continue"}
            {!submitting && <ArrowRight size={16} strokeWidth={1.8} />}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void logout().then(() => navigate({ to: "/login" }))}
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-accent"
        >
          Not you? Sign out
        </button>
      </div>
    </main>
  );
}
