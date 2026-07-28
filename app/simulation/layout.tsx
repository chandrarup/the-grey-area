import { requireStudentArea, isDevIdentityEnabled } from "@/lib/auth/role-guard";
import { AreaHeader } from "@/app/components/area-header";
import { SimulationShell } from "./simulation-shell";

export default async function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudentArea();
  const showReset = isDevIdentityEnabled();

  return (
    <>
      <AreaHeader
        area="student"
        links={[
          { href: "/student", label: "Home" },
          { href: "/simulation/leadership-team", label: "Solo play" },
        ]}
      />
      <SimulationShell showReset={showReset}>{children}</SimulationShell>
    </>
  );
}
