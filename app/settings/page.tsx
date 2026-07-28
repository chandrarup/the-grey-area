import Link from "next/link";
import { MODELS } from "@/lib/llm/models";
import { getModelPrefs } from "@/lib/model-prefs";
import { saveModelPrefsAction } from "./actions";

export default async function SettingsPage() {
  const prefs = await getModelPrefs();

  return (
    <div className="mx-auto max-w-lg px-6 py-12 md:px-8">
      <h1 className="font-serif text-3xl text-foreground">Model defaults</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Defaults for meeting AI and grading. New sessions inherit these.
      </p>

      <form action={saveModelPrefsAction} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Roleplay model
          </span>
          <select
            name="roleplayModel"
            defaultValue={prefs.roleplayModel}
            className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Grader model
          </span>
          <select
            name="graderModel"
            defaultValue={prefs.graderModel}
            className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="bg-accent px-5 py-2.5 text-sm text-accent-foreground"
        >
          Save defaults
        </button>
      </form>

      <p className="mt-10 text-xs text-muted-foreground">
        <Link href="/professor" className="underline underline-offset-2">
          ← Sessions
        </Link>
      </p>
    </div>
  );
}
