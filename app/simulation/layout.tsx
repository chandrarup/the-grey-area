import { requireStudentArea } from "@/lib/auth/role-guard";
import { AreaHeader } from "@/app/components/area-header";
import { SimulationShell } from "./simulation-shell";

export default async function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudentArea();
  const showReset = true;

  return (
    <>
      <AreaHeader
        area="student"
        links={[
          { href: "/professor/simulations", label: "← Simulations" },
          { href: "/simulation/leadership-team", label: "Student preview" },
        ]}
      />
      <SimulationShell showReset={showReset}>{children}</SimulationShell>
    </>
  );
}
