import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import type { AttendanceDoc } from "@/lib/types";

type Props = {
  attendance: AttendanceDoc[];
};

function toDate(ts: unknown): Date | null {
  if (
    ts &&
    typeof ts === "object" &&
    "toDate" in ts &&
    typeof (ts as { toDate: () => Date }).toDate === "function"
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
}

export function AttendanceCalendar({ attendance }: Props) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long" });
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const presentDays = useMemo(() => {
    const set = new Set<number>();
    for (const a of attendance) {
      const date = toDate(a.timestamp);
      if (!date) continue;
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        set.add(date.getDate());
      }
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance]);

  return (
    <section className="rounded-[2rem] bg-card p-7 shadow-[0_40px_80px_-50px_rgba(60,40,30,0.5)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Attendance
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {monthLabel}
          </h2>
        </div>
        <CalendarDays size={20} className="text-accent" strokeWidth={1.6} />
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <span key={`${day}-${i}`} className="py-1 text-muted-foreground">
            {day}
          </span>
        ))}

        {days.map((day) => (
          <span
            key={day}
            title={presentDays.has(day) ? "Attendance marked" : undefined}
            className={`flex h-9 items-center justify-center rounded-full text-sm ${
              day === today
                ? "bg-accent text-accent-foreground"
                : presentDays.has(day)
                  ? "bg-accent/15 text-accent"
                  : "text-foreground hover:bg-secondary"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </section>
  );
}
