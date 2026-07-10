import { StagePlaceholder } from "../stage-placeholder";
import { stagePath } from "../stages";

export default function ReadCasePage() {
  return (
    <StagePlaceholder
      title="Read the Case"
      body="The full background on Global Infrastructure Solutions, the contract at stake, and how you arrived here will appear in this section."
      ctaLabel="Continue"
      ctaHref={stagePath("values")}
    />
  );
}
