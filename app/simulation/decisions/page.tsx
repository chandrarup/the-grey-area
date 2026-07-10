import { COST_OF_WINNING } from "@/lib/cases/cost-of-winning";
import { DecisionChat } from "./decision-chat";

export default function DecisionsPage() {
  const decision = COST_OF_WINNING.decisions[0];

  return <DecisionChat meta={COST_OF_WINNING.meta} cast={COST_OF_WINNING.cast} decision={decision} />;
}
