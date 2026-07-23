import { SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";

export type RosterStudent = {
  id: string;
  name: string;
  email: string;
};

export type PlannedMember = {
  studentId: string;
  name: string;
  email: string;
  roleKey: SeatKey;
};

export type PlannedGroup = {
  id: string;
  members: PlannedMember[];
  /** Seats filled by AI after humans are placed */
  aiSeats: SeatKey[];
};

export type BatchPlan = {
  groups: PlannedGroup[];
  minGroupSize: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Balanced split into groups of size at most maxSize (SEAT_ORDER.length),
 * differing by at most 1, none below minSize when possible.
 */
export function splitRosterIntoGroups(
  students: RosterStudent[],
  opts?: { minSize?: number; maxSize?: number; shuffleFirst?: boolean },
): PlannedGroup[] {
  const maxSize = opts?.maxSize ?? SEAT_ORDER.length;
  const minSize = opts?.minSize ?? 4;
  if (students.length === 0) return [];

  const pool = opts?.shuffleFirst === false ? [...students] : shuffle(students);
  const n = pool.length;
  // Prefer as many full-ish groups as possible without going below minSize
  let groupCount = Math.max(1, Math.ceil(n / maxSize));
  while (groupCount > 1 && Math.floor(n / groupCount) < minSize) {
    groupCount -= 1;
  }
  // If still some groups would be too large, bump count
  while (Math.ceil(n / groupCount) > maxSize) {
    groupCount += 1;
  }

  const base = Math.floor(n / groupCount);
  const rem = n % groupCount;
  const sizes: number[] = Array.from({ length: groupCount }, (_, i) =>
    i < rem ? base + 1 : base,
  );

  const groups: PlannedGroup[] = [];
  let offset = 0;
  for (const size of sizes) {
    const chunk = pool.slice(offset, offset + size);
    offset += size;
    groups.push(assignSeatsInOrder(chunk));
  }
  return groups;
}

/** Assign students to SEAT_ORDER; CEO first; leftover seats → AI. */
export function assignSeatsInOrder(students: RosterStudent[]): PlannedGroup {
  const members: PlannedMember[] = students.map((s, i) => ({
    studentId: s.id,
    name: s.name,
    email: s.email,
    roleKey: SEAT_ORDER[i]!,
  }));
  const filled = new Set(members.map((m) => m.roleKey));
  const aiSeats = SEAT_ORDER.filter((seat) => !filled.has(seat));
  return { id: newId(), members, aiSeats };
}

export function recomputeAiSeats(group: PlannedGroup): PlannedGroup {
  const filled = new Set(group.members.map((m) => m.roleKey));
  return {
    ...group,
    aiSeats: SEAT_ORDER.filter((seat) => !filled.has(seat)),
  };
}

export function validateGroup(group: PlannedGroup): string[] {
  const errors: string[] = [];
  const ceo = group.members.filter((m) => m.roleKey === "ceo");
  if (ceo.length !== 1) {
    errors.push("Each group needs exactly one human CEO");
  }
  const seats = group.members.map((m) => m.roleKey);
  if (new Set(seats).size !== seats.length) {
    errors.push("A seat cannot hold two people");
  }
  for (const m of group.members) {
    if (!SEAT_ORDER.includes(m.roleKey)) {
      errors.push(`Unknown seat ${m.roleKey}`);
    }
  }
  return errors;
}

export function validatePlan(plan: BatchPlan): string[] {
  const errors: string[] = [];
  for (let i = 0; i < plan.groups.length; i++) {
    const g = recomputeAiSeats(plan.groups[i]!);
    for (const e of validateGroup(g)) {
      errors.push(`Group ${i + 1}: ${e}`);
    }
  }
  const emails = plan.groups.flatMap((g) => g.members.map((m) => m.email));
  if (new Set(emails).size !== emails.length) {
    errors.push("Duplicate emails across groups");
  }
  return errors;
}

export function moveMember(
  plan: BatchPlan,
  studentId: string,
  toGroupId: string,
  toRoleKey?: SeatKey,
): BatchPlan {
  let member: PlannedMember | null = null;
  const groups = plan.groups.map((g) => {
    const idx = g.members.findIndex((m) => m.studentId === studentId);
    if (idx < 0) return g;
    member = g.members[idx]!;
    return recomputeAiSeats({
      ...g,
      members: g.members.filter((m) => m.studentId !== studentId),
    });
  });
  if (!member) return plan;

  return {
    ...plan,
    groups: groups.map((g) => {
      if (g.id !== toGroupId) return g;
      const taken = new Set(g.members.map((m) => m.roleKey));
      let roleKey = toRoleKey ?? member!.roleKey;
      if (taken.has(roleKey)) {
        roleKey =
          SEAT_ORDER.find((s) => !taken.has(s)) ??
          (member!.roleKey as SeatKey);
      }
      // If still taken, swap with existing occupant of target seat
      const conflict = g.members.find((m) => m.roleKey === roleKey);
      let members = g.members;
      if (conflict && toRoleKey) {
        // free the seat by moving conflict to first open AI seat or keep and fail later
        const open = SEAT_ORDER.find(
          (s) => s !== roleKey && !members.some((m) => m.roleKey === s),
        );
        if (open) {
          members = members.map((m) =>
            m.studentId === conflict.studentId ? { ...m, roleKey: open } : m,
          );
        } else {
          // swap roles with incoming
          members = members.map((m) =>
            m.studentId === conflict.studentId
              ? { ...m, roleKey: member!.roleKey }
              : m,
          );
        }
      }
      const next = recomputeAiSeats({
        ...g,
        members: [
          ...members.filter((m) => m.studentId !== studentId),
          { ...member!, roleKey },
        ],
      });
      return next;
    }),
  };
}

export function changeSeat(
  plan: BatchPlan,
  studentId: string,
  roleKey: SeatKey,
): BatchPlan {
  return {
    ...plan,
    groups: plan.groups.map((g) => {
      const me = g.members.find((m) => m.studentId === studentId);
      if (!me) return g;
      const other = g.members.find(
        (m) => m.roleKey === roleKey && m.studentId !== studentId,
      );
      const members = g.members.map((m) => {
        if (m.studentId === studentId) return { ...m, roleKey };
        if (other && m.studentId === other.studentId) {
          return { ...m, roleKey: me.roleKey };
        }
        return m;
      });
      return recomputeAiSeats({ ...g, members });
    }),
  };
}

export function seatsMapForGroup(
  group: PlannedGroup,
): Record<SeatKey, "human" | "ai"> {
  const filled = new Set(group.members.map((m) => m.roleKey));
  const seats = {} as Record<SeatKey, "human" | "ai">;
  for (const seat of SEAT_ORDER) {
    seats[seat] = filled.has(seat) ? "human" : "ai";
  }
  seats.ceo = "human";
  return seats;
}
