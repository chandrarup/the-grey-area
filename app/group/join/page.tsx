import { JoinForm } from "./join-form";

export default async function GroupJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 md:px-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Group mode
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">Join a session</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use your invite link token or enter a session code and pick an open seat.
      </p>
      <JoinForm initialToken={params.token ?? ""} />
    </div>
  );
}
