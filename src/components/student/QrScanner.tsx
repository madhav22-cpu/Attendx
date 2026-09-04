import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";
import { markAttendanceFromQr } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";

type Props = {
  open: boolean;
  onClose: () => void;
  onMarked?: () => void;
};

type ScanState =
  | { status: "scanning" }
  | { status: "checking" }
  | { status: "success" }
  | { status: "error"; reason: string };

/**
 * Real camera-based QR scanner for students marking attendance.
 * Uses html5-qrcode (already a project dependency) to access the device
 * camera, decode the QR payload the teacher's session generates, and then
 * validates + records the attendance through markAttendanceFromQr, which
 * checks session existence/expiry/enrollment/duplicates against Firestore.
 */
export function QrScanner({ open, onClose, onMarked }: Props) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerId = "qr-scanner-viewport";
  const processingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setState({ status: "scanning" });
    setCameraError(null);
    processingRef.current = false;

    let cancelled = false;

    const start = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (processingRef.current) return;
            processingRef.current = true;
            void handleDecoded(decodedText);
          },
          () => {
            // per-frame decode failures are expected while aiming — ignore
          },
        );
      } catch (err) {
        console.error("Camera start error:", err);
        if (!cancelled) {
          const message =
            err instanceof Error && /permission/i.test(err.message)
              ? "Camera permission was denied. Allow camera access to scan attendance."
              : "Couldn't access the camera. Make sure your device has one and try again.";
          setCameraError(message);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            /* already stopped */
          });
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        /* already stopped */
      }
    }
  };

  const handleDecoded = async (raw: string) => {
    if (!user) {
      setState({ status: "error", reason: "You must be signed in to mark attendance." });
      return;
    }
    setState({ status: "checking" });
    await stopCamera();

    try {
      const result = await markAttendanceFromQr(
        user.uid,
        profile?.name ?? user.email ?? "Student",
        raw,
      );
      if (result.ok) {
        setState({ status: "success" });
        onMarked?.();
      } else {
        setState({ status: "error", reason: result.reason });
      }
    } catch (err) {
      console.error("markAttendanceFromQr failed:", err);
      setState({
        status: "error",
        reason: "Network error while recording attendance. Please try again.",
      });
    }
  };

  const retry = () => {
    processingRef.current = false;
    setState({ status: "scanning" });
    setCameraError(null);
  };

  if (!open) return null;

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
        aria-label="Scan attendance QR"
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-[2rem] bg-card px-7 py-8 shadow-[0_60px_120px_-50px_rgba(60,40,30,0.65)] md:px-8 md:py-9"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <X size={15} strokeWidth={1.7} />
        </button>

        <p className="text-[0.66rem] font-medium uppercase tracking-[0.32em] text-accent">
          Scan attendance
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Point your camera at the QR code
        </h2>

        {state.status === "success" ? (
          <div className="mt-8 flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 size={48} strokeWidth={1.5} className="text-accent" />
            <p className="text-base font-semibold text-foreground">Attendance marked!</p>
            <p className="text-sm text-muted-foreground">You're all set for this session.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-accent-foreground"
            >
              Done
            </button>
          </div>
        ) : state.status === "error" ? (
          <div className="mt-8 flex flex-col items-center gap-4 py-6 text-center">
            <XCircle size={48} strokeWidth={1.5} className="text-destructive" />
            <p className="text-base font-semibold text-foreground">Couldn't mark attendance</p>
            <p className="text-sm text-muted-foreground">{state.reason}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-border px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Try again
            </button>
          </div>
        ) : cameraError ? (
          <div className="mt-8 flex flex-col items-center gap-4 py-6 text-center">
            <XCircle size={48} strokeWidth={1.5} className="text-destructive" />
            <p className="text-sm text-muted-foreground">{cameraError}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-border px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="relative mt-7 overflow-hidden rounded-[1.5rem] border border-border bg-black/5">
              <div
                id={containerId}
                className="w-full [&>video]:!w-full [&>video]:!rounded-[1.5rem]"
              />
              {state.status === "checking" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
                </div>
              )}
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <QrCode size={14} strokeWidth={1.6} />
              Ask your teacher to display the attendance QR code.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
