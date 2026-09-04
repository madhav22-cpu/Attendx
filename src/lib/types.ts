// Shared domain/Firestore types for AttendX.
// Collections used (see AGENTS/README report for the full schema description):
//   users/{uid}                — profile + role
//   classes/{classId}          — a class/section a teacher owns
//   classEnrollments/{id}      — join table: which students belong to which class
//   attendanceSessions/{id}    — a live/expired QR attendance window for a class
//   attendance/{id}            — one attendance record (id = `${sessionId}_${studentId}`)

export type Role = "student" | "teacher";

export type UserProfile = {
  uid: string;
  role: Role;
  name: string;
  email: string;
  createdAt?: unknown;
};

export type ClassDoc = {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  section: string;
  room: string;
  joinCode: string;
  createdAt?: unknown;
};

export type EnrollmentDoc = {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  joinedAt?: unknown;
};

export type AttendanceSessionDoc = {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  token: string;
  active: boolean;
  createdAt?: unknown;
  expiresAt: number; // epoch millis
  durationMinutes: number;
};

export type AttendanceStatus = "present";

export type AttendanceDoc = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  classId: string;
  sessionId: string;
  timestamp?: unknown;
  status: AttendanceStatus;
};

// Payload encoded into the QR code students scan.
export type QrPayload = {
  sessionId: string;
  classId: string;
  token: string;
};
