import { redirect } from "next/navigation";
import { JoinForm } from "./join-form";

export default async function GroupJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();
  // Prefer auto-seat so invite / re-open never drops the token on a blank form.
  if (token) {
    redirect(`/group/open?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 md:px-8">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        Live meeting
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">
        Join your seat
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Open the invite link from your instructor, or expand Join with code
        below.
      </p>
      <JoinForm initialToken="" />
    </div>
  );
}
