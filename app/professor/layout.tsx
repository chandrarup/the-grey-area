import { requireInstructorArea } from "@/lib/auth/role-guard";
import { AreaHeader } from "@/app/components/area-header";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInstructorArea();

  return (
    <>
      <AreaHeader
        area="instructor"
        links={[
          { href: "/professor/simulations", label: "Simulations" },
          { href: "/professor", label: "Sessions" },
          { href: "/professor/groups/new-batch", label: "Roster batch" },
          { href: "/professor/runs", label: "Preview runs" },
          { href: "/settings", label: "Settings" },
        ]}
      />
      <main className="flex-1">{children}</main>
    </>
  );
}
