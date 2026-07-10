import { StagePlaceholder } from "../stage-placeholder";
import { stagePath } from "../stages";

export default function DecisionsPage() {
  return (
    <StagePlaceholder
      title="The Decisions"
      body="Five escalating decisions will play out here, each one building on the choices before it."
      ctaLabel="Continue"
      ctaHref={stagePath("debrief")}
    />
  );
}
