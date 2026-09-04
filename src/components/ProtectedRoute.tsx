import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
    </div>
  );
}

/**
 * Gates a route on authentication (and optionally role). While auth state is
 * resolving, a loading screen is shown instead of the protected content —
 * the protected UI is never rendered for an unauthenticated/unauthorized
 * visitor, and no rendering ever depends on hiding buttons alone. Once we
 * know the visitor doesn't qualify, we redirect them away immediately.
 */
export function ProtectedRoute({ allow, children }: { allow: Role | Role[]; children: ReactNode }) {
  const { user, role, loading, profileMissing } = useAuth();
  const navigate = useNavigate();
  const allowed = Array.isArray(allow) ? allow : [allow];

  useEffect(() => {
    if (loading) return;

    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (profileMissing) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }

    if (role && !allowed.includes(role)) {
      const redirectTo = role === "teacher" ? "/teacher-dashboard" : "/student-dashboard";
      void navigate({ to: redirectTo, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role, profileMissing]);

  if (loading || !user || profileMissing || (role && !allowed.includes(role))) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
