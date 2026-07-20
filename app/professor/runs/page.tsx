import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import {
  listRunsWithProfiles,
  getAssessmentRaw,
  getDecisions,
  getMessages,
} from "@/lib/db/queries";
import { ReleaseForm, GradeButton } from "../release-form";
import { ResetSoloButton } from "@/app/components/reset-solo-button";

/** Optional: view solo student runs. Kept secondary to groups. */
export default async function ProfessorRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const profile = await getProfessorActor();
  const params = await searchParams;
  const rows = await listRunsWithProfiles(profile);
  const selectedId = params.run;
  const selected = rows.find((r) => r.run.id === selectedId);

  let detail: {
    decisions: Awaited<ReturnType<typeof getDecisions>>;
    messages: Awaited<ReturnType<typeof getMessages>>;
    assessment: Awaited<ReturnType<typeof getAssessmentRaw>>;
  } | null = null;

  if (selected) {
    detail = {
      decisions: await getDecisions(profile, selected.run.id),
      messages: await getMessages(profile, selected.run.id),
      assessment: await getAssessmentRaw(profile, selected.run.id),
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Groups
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-foreground">Solo runs</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <ul className="divide-y divide-border border border-border">
          {rows.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No solo runs yet.
            </li>
          ) : (
            rows.map(({ run, studentName }) => (
              <li key={run.id}>
                <Link
                  href={`/professor/runs?run=${run.id}`}
                  className={`block px-4 py-3 text-sm hover:bg-surface ${
                    selectedId === run.id ? "bg-surface" : ""
                  }`}
                >
                  <span className="font-medium text-foreground">
                    {studentName ?? "Student"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {run.status} · depth {run.depth}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>

        <section>
          {!selected || !detail ? (
            <p className="text-sm text-muted-foreground">Select a run.</p>
          ) : (
            <div>
              <h2 className="font-serif text-2xl text-foreground">
                {selected.studentName}
              </h2>
              <ul className="mt-6 space-y-3">
                {detail.decisions.map((d) => (
                  <li key={d.id} className="border border-border px-4 py-3 text-sm">
                    <p className="font-medium">{d.choice}</p>
                    <p className="mt-1 text-muted-foreground">{d.reasoning}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <GradeButton runId={selected.run.id} />
                <ResetSoloButton
                  runId={selected.run.id}
                  asStaff
                  label="Reset this run"
                />
              </div>
              {detail.assessment ? (
                <div className="mt-6">
                  <p className="text-sm">
                    Assessment: {detail.assessment.status}
                  </p>
                  {detail.assessment.status !== "released" ? (
                    <ReleaseForm runId={selected.run.id} />
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
