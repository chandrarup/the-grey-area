import { ModeSwitcher } from "./mode-switcher";
import { getAppMode } from "@/lib/mode";

export async function ModeSwitcherServer() {
  const mode = await getAppMode();
  return <ModeSwitcher current={mode} />;
}
