import { StagePlaceholder } from "../stage-placeholder";
import { stagePath } from "../stages";

export default function ValuesPage() {
  return (
    <StagePlaceholder
      title="Your Leadership Values"
      body="A short reflection on how you lead, captured before the pressure starts, will appear here."
      ctaLabel="Continue"
      ctaHref={stagePath("decisions")}
    />
  );
}
