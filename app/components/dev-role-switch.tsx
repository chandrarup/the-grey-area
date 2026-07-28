import { isDevIdentityEnabled } from "@/lib/auth/role-guard";
import { ModeSwitcherServer } from "@/app/components/mode-switcher-server";

/**
 * Dev-only role switcher. Hidden when DEV_IDENTITY is not true.
 * Production headers must never show this.
 */
export async function DevRoleSwitch() {
  if (!isDevIdentityEnabled()) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground md:inline">
        Switch role
      </span>
      <ModeSwitcherServer />
    </div>
  );
}
