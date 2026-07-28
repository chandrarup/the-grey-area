/** Shared email invite types (safe for client + server). */

export type InviteEnvCheck = {
  ok: boolean;
  missing: string[];
  warnings: string[];
  message: string | null;
};
