import { useEffect, useMemo, useState } from "react";
import { QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useStartSession, useEndSession, useRefreshSessionToken } from "@/hooks/useTeacherDashboard";
import { encodeQrPayload } from "@/lib/firestore";
import type { AttendanceSessionDoc, ClassDoc } from "@/lib/types";

const durationOptions = [15, 30, 45, 60];

type Props = {
  open: boolean;
  classes: ClassDoc[];
  initialClassId?: string | undefined;
  onClose: () => void;
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function QrSessionModal({ open, classes, initialClassId, onClose }: Props) {
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? "");
  const [duration, setDuration] = useState(30);
  const [session, setSession] = useState<AttendanceSessionDoc | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");

  const startSession = useStartSession();
  const endSession = useEndSession();
  const refreshSessionToken = useRefreshSessionToken();

  useEffect(() => {
    if (open) {
      setClassId(initialClassId ?? classes[0]?.id ?? "");
      setSession(null);
      setDuration(30);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialClassId]);

  // Rotate the QR token every five seconds while the session is active.
  // The stored token is updated first, so the scanner only accepts the latest QR.
  useEffect(() => {
    if (!session || !session.active || remaining === 0) return;
    let cancelled = false;
    const rotate = async () => {
      try {
        const token = await refreshSessionToken.mutateAsync(session.id);
        if (!cancelled) setSession((current) => current && current.id === session.id ? { ...current, token } : current);
      } catch (err) {
        console.error("Failed to refresh attendance QR:", err);
        // Keep the currently valid QR visible if a refresh request fails.
      }
    };
    const timer = window.setInterval(() => { void rotate(); }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session?.id, session?.active, remaining === 0]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0) {
        setSession((s) => (s ? { ...s, active: false } : s));
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selected = useMemo(() => classes.find((c) => c.id === classId) ?? null, [classId, classes]);

  if (!open) return null;

  const start = async () => {
    if (!selected) {
      setError("Select a class first.");
      return;
    }
    setError("");
    try {
      const created = await startSession.mutateAsync({
        klass: selected,
        durationMinutes: duration,
      });
      setSession(created);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Couldn't start the session. Please try again.");
    }
  };

  const finish = async () => {
    if (session) {
      try {
        await endSession.mutateAsync(session.id);
      } catch (err) {
        console.error("Failed to end session:", err);
      }
    }
    setSession(null);
    onClose();
  };

  const qrValue = session
    ? encodeQrPayload({ sessionId: session.id, classId: session.classId, token: session.token })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generate attendance QR"
        className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-[2rem] bg-card px-7 py-8 shadow-[0_60px_120px_-50px_rgba(60,40,30,0.65)] md:px-10 md:py-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <X size={15} strokeWidth={1.7} />
        </button>

        {!session || !session.active || remaining === 0 ? (
          <>
            <p className="text-[0.66rem] font-medium uppercase tracking-[0.32em] text-accent">
              Attendance session
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Generate attendance QR
            </h2>

            {classes.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Create a class first (see "Manage classes" below) before starting a session.
              </p>
            ) : (
              <>
                <div className="mt-8">
                  <label
                    htmlFor="qr-class"
                    className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Select class
                  </label>
                  <select
                    id="qr-class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-border bg-background px-5 py-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.subject} · {c.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-7">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Session duration
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {durationOptions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        aria-pressed={duration === d}
                        className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
                          duration === d
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                        }`}
                      >
                        {d} minutes
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={startSession.isPending}
                  className="mt-9 inline-flex w-full items-center justify-center gap-3 rounded-full bg-accent px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] text-accent-foreground shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <QrCode size={18} strokeWidth={1.7} />
                  {startSession.isPending ? "Starting..." : "Generate QR"}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-[0.66rem] font-medium uppercase tracking-[0.32em] text-accent">
              Attendance
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {selected ? `${selected.subject} · ${selected.section}` : session.className}
            </h2>

            <div className="mx-auto mt-8 w-56 rounded-[1.75rem] bg-card p-5 shadow-[0_40px_80px_-45px_rgba(60,40,30,0.55)]">
              <QRCodeSVG value={qrValue} className="h-full w-full" size={256} />
            </div>

            <p className="mt-7 text-sm text-muted-foreground">
              QR refreshes every 5 seconds. Scan the latest code to mark attendance.
            </p>
            <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground">
              {fmt(remaining)}{" "}
              <span className="text-sm font-normal tracking-normal text-muted-foreground">
                remaining
              </span>
            </p>

            <button
              type="button"
              onClick={() => void finish()}
              disabled={endSession.isPending}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-border px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {endSession.isPending ? "Ending..." : "End session"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
