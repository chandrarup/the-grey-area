import { GROUP_ROLES, SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { getCase } from "@/lib/case/registry";

export type PublicParticipant = {
  id: string;
  roleKey: string;
  name: string;
  title: string;
  isAi: boolean;
  isReady: boolean;
  joined: boolean;
  isYou?: boolean;
};

/**
 * Public roster — NAMES AND TITLES ONLY.
 * Never emits confidential brief fields for any role (including the viewer).
 */
export function toPublicRoster(
  participants: {
    id: string;
    roleKey: string;
    displayName: string | null;
    isAi: boolean;
    isReady: boolean;
    joinedAt: Date | null;
  }[],
  viewerRoleKey: string,
): PublicParticipant[] {
  return participants.map((p) => {
    const brief = GROUP_ROLES[p.roleKey as SeatKey];
    const name =
      p.isAi
        ? brief?.name ?? p.roleKey
        : p.displayName?.trim() && !/^you\b/i.test(p.displayName)
          ? p.displayName.trim()
          : brief?.name ?? p.roleKey;
    return {
      id: p.id,
      roleKey: p.roleKey,
      name,
      title: brief?.title ?? p.roleKey,
      isAi: p.isAi,
      isReady: Boolean(p.isReady),
      joined: Boolean(p.displayName) || p.isAi,
      isYou: p.roleKey === viewerRoleKey,
    };
  });
}

/** Character name for transcript labels (never another role's confidential brief). */
export function characterName(roleKey: string, caseSlug = "cost-of-winning"): string {
  if (roleKey === "narrator") return "Narrator";
  const brief = GROUP_ROLES[roleKey as SeatKey];
  if (brief) return brief.name;
  const cast = getCase(caseSlug).cast.find((c) => c.id === roleKey);
  return cast?.name ?? roleKey;
}

export function seatTitle(roleKey: string): string {
  return GROUP_ROLES[roleKey as SeatKey]?.title ?? roleKey;
}

/** Detect which AI roles (including eleanor) a message mentions. */
export function detectMentionedAiRoles(
  text: string,
  caseSlug: string,
  aiRoleKeys: string[],
): string[] {
  const lower = text.toLowerCase();
  const caseConfig = getCase(caseSlug);
  const hit: string[] = [];

  for (const roleKey of aiRoleKeys) {
    const member = caseConfig.cast.find((c) => c.id === roleKey);
    const brief = GROUP_ROLES[roleKey as SeatKey];
    const names = [
      roleKey,
      `@${roleKey}`,
      member?.name,
      brief?.name,
      ...(member?.name?.split(/\s+/) ?? []),
      ...(brief?.name?.split(/\s+/) ?? []),
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());

    if (names.some((n) => n.length >= 3 && lower.includes(n))) {
      hit.push(roleKey);
    }
  }
  return [...new Set(hit)];
}

export function groupCastForScene(
  caseSlug: string,
  sceneId: string,
): { id: string; name: string; title: string }[] {
  const caseConfig = getCase(caseSlug);
  const scene = caseConfig.scenes[sceneId];
  if (!scene) return [];

  // CEO always appears in the meeting strip even when not in scene.cast
  const ids = scene.cast.includes("ceo")
    ? scene.cast
    : ["ceo", ...scene.cast];

  return ids.map((id) => {
    const member = caseConfig.cast.find((c) => c.id === id);
    const brief = GROUP_ROLES[id as SeatKey];
    return {
      id,
      name: member?.name ?? brief?.name ?? (id === "ceo" ? "Chief Executive Officer" : id),
      title:
        brief?.title ??
        member?.role ??
        (id === "ceo" ? "Chief Executive Officer" : id),
    };
  });
}

export { SEAT_ORDER };
