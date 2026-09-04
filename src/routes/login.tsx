import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Mail, Lock } from "lucide-react";
import logoAsset from "@/assets/attendx-logo.png.asset.json";
import doodles from "@/assets/login-doodles.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AttendX" },
      {
        name: "description",
        content: "Sign in to your AttendX account to manage attendance with ease.",
      },
      { property: "og:title", content: "Sign in — AttendX" },
      {
        property: "og:description",
        content: "Sign in to your AttendX account to manage attendance with ease.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}

function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Routes the signed-in user to the right place based on their Firestore
  // profile, or to onboarding if no profile exists yet.
  const routeAfterSignIn = async (uid: string) => {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (!userDoc.exists()) {
      await navigate({ to: "/onboarding" });
      return;
    }

    const role = userDoc.data()["role"];

    if (role === "student") {
      await navigate({ to: "/student-dashboard" });
    } else if (role === "teacher") {
      await navigate({ to: "/teacher-dashboard" });
    } else {
      setError("Your account has an invalid role. Contact your administrator.");
    }
  };

  // Email + Password Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      await routeAfterSignIn(userCredential.user.uid);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      console.error("Login error:", err);
      setError(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      await sendPasswordResetEmail(auth, email);

      setError("Password reset email sent. Check your inbox.");
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      console.error("Password reset error:", err);
      setError(
        code === "auth/user-not-found"
          ? "No account found for that email address."
          : "Could not send password reset email. Check the email address.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // No profile yet -> send to onboarding instead of failing outright;
      // onboarding can only ever create a student profile.
      await routeAfterSignIn(result.user.uid);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      console.error("Google login error:", err);
      setError(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[oklch(0.97_0.02_60)] p-0 md:p-6">
      <div className="grid min-h-screen grid-cols-1 overflow-hidden bg-background md:min-h-[calc(100vh-3rem)] md:grid-cols-[1.05fr_1fr] md:rounded-[2.5rem] md:shadow-[0_30px_80px_-40px_oklch(0.4_0.06_50/0.35)]">
        {/* LEFT — artwork */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[oklch(0.968_0.018_75)] px-8 py-10 md:px-12 md:py-12">
          <div className="pointer-events-none absolute -left-24 top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[var(--glow-warm)] blur-3xl" />

          <div className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-accent/15 blur-3xl" />

          <div className="relative z-10 flex flex-1 items-center justify-center py-6">
            <div className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[oklch(0.93_0.045_55)]" />

            <img
              src={doodles}
              alt="Illustration of graduation caps, diplomas, medals and trophies"
              width={1024}
              height={1280}
              loading="lazy"
              className="relative h-auto w-full max-w-[20rem] md:max-w-[24rem]"
            />
          </div>

          <div className="relative z-10">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.35em] text-accent">
              Attendance, reimagined
            </p>

            <h2 className="mt-3 max-w-sm font-display text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-4xl">
              Presence, without the noise.
            </h2>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeft size={15} strokeWidth={1.5} />
              Back to home
            </Link>
          </div>
        </div>

        {/* RIGHT — form */}
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
              Welcome back
            </h1>

            <p className="mt-2 text-center text-sm text-muted-foreground">
              Sign in to your account
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleLogin}>
              {/* Email */}
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

              {/* Password */}
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
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-11 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.5} />
                    ) : (
                      <Eye size={17} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-[oklch(0.68_0.17_40)]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-accent hover:underline disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error / Success message */}
              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              {/* Sign In */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && <ArrowRight size={16} strokeWidth={1.8} />}
              </button>
            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" />

              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">or</span>

              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
                />

                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.4-4.7 7.1l7.3 5.6c4.3-3.9 6.8-9.8 6.8-17.2z"
                />

                <path
                  fill="#FBBC05"
                  d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z"
                />

                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.6c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.7-13.6-8.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-accent hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
