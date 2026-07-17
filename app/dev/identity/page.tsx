import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  clearDevProfile,
  createDevProfile,
  selectDevProfile,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function DevIdentityPage() {
  if (process.env.DEV_IDENTITY !== "true") {
    notFound();
  }

  const current = await getCurrentProfile();
  const allProfiles = await db
    .select()
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  return (
    <div className="mx-auto max-w-lg px-6 py-16 md:px-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Dev only
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">Identity</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Pick a profile to simulate auth. This page is gated by{" "}
        <code className="text-foreground">DEV_IDENTITY=true</code> and is not
        available in production.
      </p>

      {current ? (
        <div className="mt-8 border border-border bg-surface px-4 py-3 text-sm">
          Signed in as{" "}
          <span className="font-medium text-foreground">{current.name}</span>{" "}
          ({current.role})
          <form action={clearDevProfile} className="mt-2">
            <button
              type="submit"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-foreground">Existing profiles</h2>
        <ul className="mt-4 divide-y divide-border border border-border">
          {allProfiles.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No profiles yet — run <code>npm run db:seed</code> or create one
              below.
            </li>
          ) : (
            allProfiles.map((profile) => (
              <li
                key={profile.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {profile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.role}
                    {profile.email ? ` · ${profile.email}` : null}
                  </p>
                </div>
                <form action={selectDevProfile}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button
                    type="submit"
                    className="bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
                  >
                    {current?.id === profile.id ? "Active" : "Use"}
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-foreground">Create profile</h2>
        <form action={createDevProfile} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-muted-foreground">Name</span>
            <input
              name="name"
              required
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="Jordan Lee"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Email (optional)</span>
            <input
              name="email"
              type="email"
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="jordan@dev.local"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Role</span>
            <select
              name="role"
              defaultValue="student"
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            >
              <option value="student">student</option>
              <option value="professor">professor</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Create and use
          </button>
        </form>
      </section>
    </div>
  );
}
