import { requireStudentRun } from "@/lib/simulation/run";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";
import { ContinueButton } from "../continue-button";

export default async function LeadershipTeamPage() {
  const { caseConfig, run } = await requireStudentRun();
  const stageData = (run.stageData ?? {}) as RunStageData;
  enforceStageAccess("leadership-team", stageData);

  const team = caseConfig.cast.filter((m) => m.id !== "eleanor");

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Stage 1
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Meet Your Leadership Team
      </h1>
      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        These executives will press you across five decisions. Learn who they
        are before you open the case packet.
      </p>

      <ul className="mt-10 divide-y divide-border border border-border">
        {team.map((member) => (
          <li key={member.id} className="px-5 py-5 md:px-6">
            <p className="font-serif text-xl text-foreground">{member.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
            {member.location ? (
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {member.location}
                {member.isNight ? " · night" : ""}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <ContinueButton
          runId={run.id}
          fromSlug="leadership-team"
          toSlug="read-case"
          label="Continue to case packet"
        />
      </div>
    </div>
  );
}
