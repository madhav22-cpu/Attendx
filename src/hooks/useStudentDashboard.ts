import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  joinClassByCode,
  listSessionsForClasses,
  listStudentAttendance,
  listStudentClasses,
} from "@/lib/firestore";

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

export function useStudentDashboardData() {
  const { user, profile } = useAuth();
  const uid = user?.uid;

  const classesQuery = useQuery({
    queryKey: ["student-classes", uid],
    queryFn: () => listStudentClasses(uid!),
    enabled: !!uid,
  });

  const attendanceQuery = useQuery({
    queryKey: ["student-attendance", uid],
    queryFn: () => listStudentAttendance(uid!),
    enabled: !!uid,
  });

  const classes = classesQuery.data ?? [];
  const classIds = classes.map((c) => c.id);

  const sessionsQuery = useQuery({
    queryKey: ["student-class-sessions", classIds.join(",")],
    queryFn: () => listSessionsForClasses(classIds),
    enabled: classIds.length > 0,
  });

  const attendance = attendanceQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const classById = new Map(classes.map((c) => [c.id, c]));

  const totalHeld = sessions.length;
  const attendedCount = attendance.length;
  const missed = Math.max(totalHeld - attendedCount, 0);
  const percent = totalHeld > 0 ? Math.round((attendedCount / totalHeld) * 100) : 0;

  const history = attendance.slice(0, 12).map((a) => {
    const klass = classById.get(a.classId);
    const date = toDate(a.timestamp);
    return {
      id: a.id,
      subject: klass ? `${klass.subject} · ${klass.section}` : "Class",
      date: date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—",
      time: date ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "",
      present: true,
    };
  });

  return {
    loading: classesQuery.isLoading || attendanceQuery.isLoading,
    error: classesQuery.error ?? attendanceQuery.error ?? sessionsQuery.error ?? null,
    profile,
    classes,
    percent,
    attended: attendedCount,
    missed,
    total: totalHeld,
    history,
    attendance,
    refetch: () => {
      void classesQuery.refetch();
      void attendanceQuery.refetch();
      void sessionsQuery.refetch();
    },
  };
}

export function useJoinClass() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (joinCode: string) => {
      if (!user) throw new Error("You must be signed in.");
      return joinClassByCode(user.uid, profile?.name ?? user.email ?? "Student", joinCode);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-classes", user?.uid] });
    },
  });
}
