import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { COST_OF_WINNING as scenario } from "@/lib/case/cost-of-winning";
import { LearningDebrief } from "@/app/components/learning-debrief";
export default async function DebriefPreview() {
  await requireStaff();
  const path = [
    {sceneId:"s1_introduction",optionKey:"authorise",reasoning:"Keep the opportunity open while the team checks the scope before payment."},
    {sceneId:"s2_invoice_authorised",optionKey:"stop_disclose",reasoning:"The invoice is not supported. Stop payments, preserve the file, and brief the board."},
    {sceneId:"s3_gap_record",optionKey:"full_coop",reasoning:"Produce the original record, disclose the gaps, and protect colleagues who raised concerns."},
  ];
  return <main className="mx-auto max-w-6xl px-6 py-10">
    <div className="mb-8 flex flex-wrap justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-xs"><span>Instructor design preview · fictional example feedback · not a participant assessment</span><Link href="/professor/simulations" className="text-accent">Back to simulations</Link></div>
    <LearningDebrief caseConfig={scenario} decisions={path.map(d=>({...d,choice:scenario.scenes[d.sceneId].options.find(o=>o.key===d.optionKey)!.label}))}
      feedback={{summary:"You kept the commercial conversation open, then changed course when the invoice exposed what had not been checked. Your later actions limited further harm; they could not erase the earlier commitment.",letter:"You recognised the need to act once the payment lacked support. You also named the board’s right to understand what happened. Notice the first assumption: that permission to negotiate would stay separate from a commitment. Next time, make that boundary visible to the person being approached, and give a named colleague authority to stop the process.",
        strengths:["You stopped further payment when the scope could not be explained.","You made the earlier authorisation visible to the board.","You chose to preserve the record rather than make it look complete."],growth:["The first authorisation had no named owner for the unfinished checks.","The team could interpret ‘keep talking’ as permission to make a commitment.","Consider who must explain the delay to employees and the client."],practices:["Before authorising contact, name the permitted activity, the prohibited commitment, the review owner and the deadline."],
        scores:[{key:"integrity_under_pressure",label:"Integrity under pressure",score:7,rationale:"You stopped unsupported payments and later disclosed the incomplete record, after initially allowing negotiations to proceed."},{key:"leadership_courage",label:"Leadership courage",score:8,rationale:"You accepted an uncomfortable board conversation rather than passing the problem back to the regional team."},{key:"stakeholder_management",label:"Stakeholder management",score:6,rationale:"Your reasoning protected colleagues who raised concerns; it gave less attention to the client and delivery team."},{key:"long_term_thinking",label:"Long-term thinking",score:7,rationale:"You preserved the original record, while the initial decision underestimated how quickly expectations could become commitments."}]}}
      notes="In our discussion, separate the decision to explore a service from permission to represent the company. What exact sentence would make that boundary clear?" />
  </main>;
}
