import { useState } from "react";
import { Plus, Users, Copy, Check } from "lucide-react";
import { useCreateClass } from "@/hooks/useTeacherDashboard";
import type { ClassDoc, EnrollmentDoc } from "@/lib/types";

type Props = {
  classes: ClassDoc[];
  rosters: Record<string, EnrollmentDoc[]>;
  onGenerateQr: (classId: string) => void;
};

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-mono text-xs tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {code}
      {copied ? (
        <Check size={12} strokeWidth={2} className="text-accent" />
      ) : (
        <Copy size={12} strokeWidth={1.8} />
      )}
    </button>
  );
}

export function ClassManager({ classes, rosters, onGenerateQr }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  const createClass = useCreateClass();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !section.trim()) {
      setError("Subject and section are required.");
      return;
    }
    try {
      await createClass.mutateAsync({
        subject: subject.trim(),
        section: section.trim(),
        room: room.trim(),
      });
      setSubject("");
      setSection("");
      setRoom("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to create class:", err);
      setError("Couldn't create the class. Please try again.");
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-border/60 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
          Your classes
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={14} strokeWidth={1.8} />
          New class
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4"
        >
          <input
            placeholder="Subject (e.g. Computer Science)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent sm:col-span-2"
          />
          <input
            placeholder="Section (e.g. 10-A)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <input
            placeholder="Room (optional)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red-500 sm:col-span-4">{error}</p>}
          <button
            type="submit"
            disabled={createClass.isPending}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-4"
          >
            {createClass.isPending ? "Creating..." : "Create class"}
          </button>
        </form>
      )}

      <ul className="mt-6 divide-y divide-border/70">
        {classes.length === 0 && (
          <li className="py-6 text-sm text-muted-foreground">
            No classes yet. Create one to start generating attendance QR codes.
          </li>
        )}
        {classes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {c.subject} · {c.section}
              </p>
              <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                {c.room && <span>Room {c.room}</span>}
                <span className="inline-flex items-center gap-1">
                  <Users size={12} strokeWidth={1.6} />
                  {(rosters[c.id] ?? []).length} students
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CopyCode code={c.joinCode} />
              <button
                type="button"
                onClick={() => onGenerateQr(c.id)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Generate QR
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
