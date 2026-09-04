import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { createStudentProfile } from "../lib/firestore";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Lock, User } from "lucide-react";
import logoAsset from "@/assets/attendx-logo.png.asset.json";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — AttendX" },
      {
        name: "description",
        content: "Create your AttendX student account.",
      },
    ],
  }),
  component: RegisterPage,
});

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Please choose a password with at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Couldn't create your account. Please try again.";
  }
}

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
      // Every account created through this public form is a student account.
      // Teacher accounts are provisioned separately by an administrator —
      // this form has no way to grant the teacher role.
      await createStudentProfile(credential.user.uid, name.trim(), email);
      await navigate({ to: "/student-dashboard" });
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      console.error("Registration error:", err);
      setError(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[oklch(0.97_0.02_60)] p-0 md:p-6">
      <div className="grid min-h-screen grid-cols-1 overflow-hidden bg-background md:min-h-[calc(100vh-3rem)] md:grid-cols-[1fr] md:rounded-[2.5rem] md:shadow-[0_30px_80px_-40px_oklch(0.4_0.06_50/0.35)]">
        <div className="relative flex items-center justify-center bg-card px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <img
              src={logoAsset.url}
              alt="AttendX"
              width={150}
              height={100}
              className="mx-auto h-auto w-[150px]"
            />

            <h1 className="mt-6 text-center font-display text-4xl font-semibold tracking-[-0.03em] text-foreground">
              Create account
            </h1>

            <p className="mt-2 text-center text-sm text-muted-foreground">
              Student sign-up for AttendX
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowRight size={16} strokeWidth={1.8} />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Teacher accounts are set up by your administrator and can't be created here.
            </p>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </p>

            <Link
              to="/"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeft size={15} strokeWidth={1.5} />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
