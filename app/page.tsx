import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
export default async function Home({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const { join } = await searchParams;
  if (join?.trim()) redirect(`/group/open?token=${encodeURIComponent(join.trim())}`);
  redirect(await getCurrentProfile() ? "/professor/simulations" : "/login");
}
