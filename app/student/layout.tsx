import { requireStudentArea } from "@/lib/auth/role-guard";
import { AreaHeader } from "@/app/components/area-header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudentArea();

  return (
    <>
      <AreaHeader
        area="student"
        links={[
          { href: "/student", label: "Home" },
          { href: "/simulation/leadership-team", label: "Solo play" },
        ]}
      />
      <main className="flex-1">{children}</main>
    </>
  );
}
