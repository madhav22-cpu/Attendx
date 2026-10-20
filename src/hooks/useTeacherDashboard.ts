import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  createClass,
  endAttendanceSession,
  listClassRoster,
  listTeacherAttendance,
  listTeacherClasses,
  listTeacherSessions,
  startAttendanceSession,
  refreshAttendanceSessionToken,
} from "@/lib/firestore";
import type { ClassDoc } from "@/lib/types";

function isToday(ts: unknown): boolean {
  if (!ts || typeof ts !== "object" || !("toDate" in ts)) return false;
  const date = (ts as { toDate: () => Date }).toDate();
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function useTeacherDashboardData() {
  const { user } = useAuth();
  const uid = user?.uid;

  const classesQuery = useQuery({
    queryKey: ["teacher-classes", uid],
    queryFn: () => listTeacherClasses(uid!),
    enabled: !!uid,
  });
  const classes = classesQuery.data ?? [];
  const classIds = classes.map((c) => c.id);

  const rosterQuery = useQuery({
    queryKey: ["teacher-rosters", classIds.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        classIds.map(async (id) => [id, await listClassRoster(id)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: classIds.length > 0,
  });
  const rosters = rosterQuery.data ?? {};

  const sessionsQuery = useQuery({
    queryKey: ["teacher-sessions", uid],
    queryFn: () => listTeacherSessions(uid!, 10),
    enabled: !!uid,
  });
  const sessions = sessionsQuery.data ?? [];

  const attendanceQuery = useQuery({
    queryKey: ["teacher-attendance", uid],
    queryFn: () => listTeacherAttendance(uid!),
    enabled: !!uid,
  });
  const attendance = attendanceQuery.data ?? [];

  const uniqueStudentIds = new Set<string>();
  for (const roster of Object.values(rosters)) {
    for (const enrollment of roster) uniqueStudentIds.add(enrollment.studentId);
  }

  const todaysAttendance = attendance.filter((a) => isToday(a.timestamp));
  const totalRosterSeats = Object.values(rosters).reduce((sum, r) => sum + r.length, 0);
  const attendanceRate =
    totalRosterSeats > 0 ? Math.round((todaysAttendance.length / totalRosterSeats) * 100) : 0;

  const attendanceCountBySession = new Map<string, number>();
  for (const a of attendance) {
    attendanceCountBySession.set(a.sessionId, (attendanceCountBySession.get(a.sessionId) ?? 0) + 1);
  }

  const classById = new Map(classes.map((c) => [c.id, c]));
  const recentSessions = sessions.map((s) => {
    const klass = classById.get(s.classId);
    const roster = rosters[s.classId] ?? [];
    return {
      id: s.id,
      subject: klass?.subject ?? "Class",
      section: klass?.section ?? "",
      present: attendanceCountBySession.get(s.id) ?? 0,
      total: roster.length,
      active: s.active && Date.now() < s.expiresAt,
    };
  });

  const activeSessionsCount = sessions.filter((s) => s.active && Date.now() < s.expiresAt).length;

  return {
    loading: classesQuery.isLoading,
    error: classesQuery.error ?? sessionsQuery.error ?? attendanceQuery.error ?? null,
    classes,
    rosters,
    totalStudents: uniqueStudentIds.size,
    attendanceRate,
    activeSessionsCount,
    recentSessions,
    refetch: () => {
      void classesQuery.refetch();
      void rosterQuery.refetch();
      void sessionsQuery.refetch();
      void attendanceQuery.refetch();
    },
  };
}

export function useCreateClass() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { subject: string; section: string; room: string }) => {
      if (!user) throw new Error("You must be signed in.");
      return createClass(user.uid, profile?.name ?? user.email ?? "Teacher", data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-classes", user?.uid] });
    },
  });
}

export function useClassRoster(classId: string | null) {
  return useQuery({
    queryKey: ["class-roster", classId],
    queryFn: () => listClassRoster(classId!),
    enabled: !!classId,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ klass, durationMinutes }: { klass: ClassDoc; durationMinutes: number }) =>
      startAttendanceSession(klass, durationMinutes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-sessions", user?.uid] });
    },
  });
}

export function useRefreshSessionToken() {
  return useMutation({
    mutationFn: (sessionId: string) => refreshAttendanceSessionToken(sessionId),
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (sessionId: string) => endAttendanceSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-sessions", user?.uid] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-attendance", user?.uid] });
    },
  });
}
