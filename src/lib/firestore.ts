import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  AttendanceDoc,
  AttendanceSessionDoc,
  ClassDoc,
  EnrollmentDoc,
  QrPayload,
  UserProfile,
} from "./types";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

/**
 * Creates a brand-new user profile. Public sign-up (email/password form and
 * Google onboarding) can ONLY ever create "student" profiles — this is
 * enforced here AND in firestore.rules, so a client can never grant itself
 * the teacher role. Teacher accounts must be provisioned directly in
 * Firestore/Firebase console by an administrator (see README).
 */
export async function createStudentProfile(uid: string, name: string, email: string) {
  const profile: Omit<UserProfile, "uid"> = {
    role: "student",
    name,
    email,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile);
  return { uid, ...profile } satisfies UserProfile;
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

function randomJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createClass(
  teacherId: string,
  teacherName: string,
  data: { subject: string; section: string; room: string },
): Promise<ClassDoc> {
  const payload = {
    teacherId,
    teacherName,
    subject: data.subject,
    section: data.section,
    room: data.room,
    joinCode: randomJoinCode(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "classes"), payload);
  return { id: ref.id, ...payload };
}

export async function listTeacherClasses(teacherId: string): Promise<ClassDoc[]> {
  const q = query(collection(db, "classes"), where("teacherId", "==", teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassDoc, "id">) }));
}

export async function getClass(classId: string): Promise<ClassDoc | null> {
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ClassDoc, "id">) };
}

export async function findClassByJoinCode(joinCode: string): Promise<ClassDoc | null> {
  const q = query(
    collection(db, "classes"),
    where("joinCode", "==", joinCode.trim().toUpperCase()),
  );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return { id: first.id, ...(first.data() as Omit<ClassDoc, "id">) };
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function joinClassByCode(
  studentId: string,
  studentName: string,
  joinCode: string,
): Promise<ClassDoc> {
  const klass = await findClassByJoinCode(joinCode);
  if (!klass) throw new Error("No class found for that join code.");

  const existing = await getEnrollment(klass.id, studentId);
  if (existing) return klass; // already enrolled, nothing to do

  await setDoc(doc(db, "classEnrollments", `${klass.id}_${studentId}`), {
    classId: klass.id,
    studentId,
    studentName,
    joinedAt: serverTimestamp(),
  } satisfies Omit<EnrollmentDoc, "id">);

  return klass;
}

export async function getEnrollment(
  classId: string,
  studentId: string,
): Promise<EnrollmentDoc | null> {
  const snap = await getDoc(doc(db, "classEnrollments", `${classId}_${studentId}`));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<EnrollmentDoc, "id">) };
}

export async function listStudentClasses(studentId: string): Promise<ClassDoc[]> {
  const q = query(collection(db, "classEnrollments"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  const classIds = snap.docs.map((d) => (d.data() as EnrollmentDoc).classId);
  const classes = await Promise.all(classIds.map((id) => getClass(id)));
  return classes.filter((c): c is ClassDoc => c !== null);
}

export async function listClassRoster(classId: string): Promise<EnrollmentDoc[]> {
  const q = query(collection(db, "classEnrollments"), where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EnrollmentDoc, "id">) }));
}

// ---------------------------------------------------------------------------
// Attendance sessions (QR)
// ---------------------------------------------------------------------------

function randomToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function startAttendanceSession(
  klass: ClassDoc,
  durationMinutes: number,
): Promise<AttendanceSessionDoc> {
  const now = Date.now();
  const expiresAt = now + durationMinutes * 60_000;
  const token = randomToken();

  const payload = {
    classId: klass.id,
    className: `${klass.subject} · ${klass.section}`,
    teacherId: klass.teacherId,
    token,
    active: true,
    createdAt: serverTimestamp(),
    expiresAt,
    durationMinutes,
  };
  const ref = await addDoc(collection(db, "attendanceSessions"), payload);
  return { id: ref.id, ...payload };
}

export async function endAttendanceSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, "attendanceSessions", sessionId), { active: false });
}

export async function getAttendanceSession(
  sessionId: string,
): Promise<AttendanceSessionDoc | null> {
  const snap = await getDoc(doc(db, "attendanceSessions", sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<AttendanceSessionDoc, "id">) };
}

export function encodeQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload);
}

export function decodeQrPayload(raw: string): QrPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "sessionId" in parsed &&
      "classId" in parsed &&
      "token" in parsed
    ) {
      const p = parsed as QrPayload;
      if (
        typeof p.sessionId === "string" &&
        typeof p.classId === "string" &&
        typeof p.token === "string"
      ) {
        return p;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Attendance records
// ---------------------------------------------------------------------------

export type MarkAttendanceResult = { ok: true } | { ok: false; reason: string };

/**
 * Verifies every rule in the spec and writes a single attendance record.
 * Uses a Firestore transaction keyed on a deterministic document id
 * (`${sessionId}_${studentId}`) so a student can never be marked present
 * twice for the same session, even under concurrent scans.
 */
export async function markAttendanceFromQr(
  studentId: string,
  studentName: string,
  raw: string,
): Promise<MarkAttendanceResult> {
  const payload = decodeQrPayload(raw);
  if (!payload) return { ok: false, reason: "This QR code isn't a valid AttendX attendance code." };

  const session = await getAttendanceSession(payload.sessionId);
  if (!session) return { ok: false, reason: "This attendance session no longer exists." };
  if (session.classId !== payload.classId || session.token !== payload.token) {
    return { ok: false, reason: "This QR code is invalid." };
  }
  if (!session.active) return { ok: false, reason: "This attendance session has ended." };
  if (Date.now() > session.expiresAt) {
    return { ok: false, reason: "This attendance session has expired." };
  }

  const enrollment = await getEnrollment(session.classId, studentId);
  if (!enrollment) {
    return { ok: false, reason: "You aren't enrolled in this class." };
  }

  const attendanceId = `${session.id}_${studentId}`;
  const attendanceRef = doc(db, "attendance", attendanceId);

  try {
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(attendanceRef);
      if (existing.exists()) {
        throw new Error("DUPLICATE");
      }
      tx.set(attendanceRef, {
        studentId,
        studentName,
        teacherId: session.teacherId,
        classId: session.classId,
        sessionId: session.id,
        timestamp: serverTimestamp(),
        status: "present",
      } satisfies Omit<AttendanceDoc, "id">);
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      return { ok: false, reason: "You've already marked attendance for this session." };
    }
    console.error("markAttendanceFromQr error:", err);
    return { ok: false, reason: "Couldn't record attendance. Please try again." };
  }

  return { ok: true };
}

export async function listStudentAttendance(studentId: string): Promise<AttendanceDoc[]> {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
    orderBy("timestamp", "desc"),
    fsLimit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceDoc, "id">) }));
}

export async function listClassAttendanceForSession(sessionId: string): Promise<AttendanceDoc[]> {
  const q = query(collection(db, "attendance"), where("sessionId", "==", sessionId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceDoc, "id">) }));
}

/** Firestore `in` filters top out at 10 values — fine for this app's scale. */
export async function listSessionsForClasses(classIds: string[]): Promise<AttendanceSessionDoc[]> {
  if (classIds.length === 0) return [];
  const q = query(
    collection(db, "attendanceSessions"),
    where("classId", "in", classIds.slice(0, 10)),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSessionDoc, "id">) }));
}

export async function listSessionsForClass(classId: string): Promise<AttendanceSessionDoc[]> {
  const q = query(
    collection(db, "attendanceSessions"),
    where("classId", "==", classId),
    orderBy("createdAt", "desc"),
    fsLimit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSessionDoc, "id">) }));
}

export async function listTeacherSessions(
  teacherId: string,
  max = 10,
): Promise<AttendanceSessionDoc[]> {
  const q = query(
    collection(db, "attendanceSessions"),
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc"),
    fsLimit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSessionDoc, "id">) }));
}

export async function listTeacherAttendance(teacherId: string): Promise<AttendanceDoc[]> {
  const q = query(
    collection(db, "attendance"),
    where("teacherId", "==", teacherId),
    orderBy("timestamp", "desc"),
    fsLimit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceDoc, "id">) }));
}
