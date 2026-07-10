import { StagePlaceholder } from "../stage-placeholder";
import { stagePath } from "../stages";

export default function LeadershipTeamPage() {
  return (
    <StagePlaceholder
      title="Meet Your Leadership Team"
      body="Your executive team and board will each show up across this simulation. Their profiles and priorities will appear here."
      ctaLabel="Continue"
      ctaHref={stagePath("read-case")}
    />
  );
}
