/** Group-mode role briefs. CONFIDENTIAL: a participant sees ONLY their own brief. */

export type GroupRoleBrief = {
  /** Chat / roster name — never "You …" (that is reserved for the local player UI). */
  name: string;
  title: string;
  aiPersonaKey: string | null;
  confidential: boolean;
  /** One-line stance you bring into the room. */
  initialStance: string;
  atAGlance: Record<string, string>;
  /** What you are trying to achieve in the meeting. */
  centralObjective: string;
  /** Plain-language: what you must do in this simulation. */
  yourJob: string;
  /** Plain-language: how you help (or pressure) the CEO’s decision. */
  howYouHelpCeo: string;
  rebuttals: { ifYouHear: string; youCanRespond: string }[];
  openingStatement: string | null;
  decisionOptions?: string[];
  successCondition: string;
  privateNote: string | null;
};

export const SEAT_ORDER = ["ceo", "marcus", "david", "priya", "tom"] as const;
export type SeatKey = (typeof SEAT_ORDER)[number];

/**
 * Shared facts for every seat — written in third person so advisors are not
 * told they are the CEO.
 */
export const SHARED_CASE_CONTEXT = {
  title: "Shared case context",
  lead: "Everyone in this meeting has the same public facts. Your confidential brief below is private to your seat — that is where your persona and job live.",
  sections: [
    {
      title: "The company",
      body: "Global Infrastructure Solutions employs about **48,000 people** across three continents. It designs and builds major infrastructure. The firm is profitable, but margins are tight and the project pipeline weakens sharply after **eighteen months**. Years ago it survived a costly investigation into questionable payments through an overseas subcontractor.",
    },
    {
      title: "The Ardania opportunity",
      body: "Ardania has invited the company to compete for an **$8.4 billion**, eight-year integrated transport and energy corridor — the largest contract in company history. The technical proposal is widely seen as the strongest in the field, though not the cheapest. The formal bid is due in six weeks.",
    },
    {
      title: "Victor Salim",
      body: "Marcus Reed reports that **Victor Salim** (Salim Strategic Advisory) can provide local access and insight into how decisions are really made. Salim wants an indication of interest **today**, claims he will advise only one bidder, and proposes a retainer **plus a success fee if the company wins**. Exact commercial terms are not in the shared papers — Marcus says he will explain them in the meeting.",
    },
    {
      title: "This meeting",
      body: "It is Monday morning. The new CEO has **about thirty minutes** with Marcus, David, Priya, and Tom. The CEO alone commits the company’s direction. Advisors argue their case, surface risks and options, and help the CEO decide — they do not cast the final vote.",
    },
  ],
} as const;

/** @deprecated Use SHARED_CASE_CONTEXT. Kept so older imports do not crash the build. */
export const COMMON_BRIEF_PAGES = [0, 1, 2, 3] as const;

export const GROUP_ROLES: Record<SeatKey, GroupRoleBrief> = {
  ceo: {
    name: "Chief Executive Officer",
    title: "Chief Executive Officer",
    aiPersonaKey: null,
    confidential: false,
    initialStance:
      "You have not decided anything. You are one week into the job and you are about to run the first hard meeting of your tenure.",
    atAGlance: {
      Experience:
        "One week as CEO. You have not yet built relationships with this team and you are still learning whom to trust.",
      "Why you were chosen":
        "The board wanted someone who could restore growth, strengthen accountability, and repair the company's reputation after several uneven years.",
      "What the board has said":
        "The board expects visible progress. It has NOT told you to win at any cost.",
      "Your authority":
        "This is your decision. The four executives advise; you decide, and you own it.",
    },
    centralObjective:
      "Lead the discussion, decide which questions matter, manage the disagreement in the room, and give clear direction — in thirty minutes.",
    yourJob:
      "You are the CEO. Run the meeting, press people for what they are not saying, and commit a clear decision when the discussion unlocks. Only you can submit the final choice.",
    howYouHelpCeo:
      "You are the decision-maker. Use your advisors — do not let any single voice (growth, finance, sustainability, or legal) capture the room unchallenged.",
    rebuttals: [],
    openingStatement: null,
    decisionOptions: [
      "Decline further discussions with Salim",
      "Meet Salim without making a commitment",
      "Begin enhanced due diligence while continuing preliminary discussions",
      "Authorise Marcus to negotiate subject to specific conditions",
      "Pursue another course of action",
    ],
    successCondition:
      "The team leaves understanding the standard you will hold and why. Your decision will not determine whether the company wins Ardania — not yet. It will determine how Global Infrastructure Solutions chooses to compete.",
    privateNote:
      "Nobody in this room reports the whole truth to you. Marcus wants a yes, Tom wants a hold, David wants controls, and Priya has not decided. The commercial terms are not in your written briefing — ask why.",
  },
  marcus: {
    name: "Marcus Reed",
    title: "Executive Vice President, International Development",
    aiPersonaKey: "marcus",
    confidential: true,
    initialStance:
      "Move quickly. Preserve the company's access to Victor Salim and keep the Ardania opportunity alive.",
    atAGlance: {
      Experience:
        "Nineteen years with the company; led difficult international pursuits and secured several of its most profitable contracts.",
      "Relationship to Ardania":
        "You have spent almost two years cultivating relationships, visiting the country, and positioning the company for this bid.",
      "Primary lens":
        "Competition, access, local relationships, and the practical realities of international dealmaking.",
      "Personal stake":
        "The contract is closely associated with your judgment, reputation, and future influence inside the company.",
    },
    centralObjective:
      "Secure the CEO's approval to meet Salim immediately and preserve the option to negotiate an engagement while legal and compliance review proceeds in parallel.",
    yourJob:
      "Play Marcus Reed. Argue for speed and access without dismissing law or ethics. Put the commercial terms on the table when pressed. You advise — you do not make the company’s final call.",
    howYouHelpCeo:
      "Help the CEO see the competitive cost of delay and the value of Salim’s access. Force a concrete option onto the table (meet / diligence in parallel / conditions) so the CEO is not stuck between a vague ‘yes’ and a vague ‘no.’ Disclose the fee structure clearly when asked.",
    rebuttals: [
      {
        ifYouHear: "The fee is too large.",
        youCanRespond:
          "It sounds large in isolation, but it is one-tenth of one percent of the contract and payable only upon success. Let's test whether it is commercially reasonable rather than reject it based on the headline number.",
      },
      {
        ifYouHear: "His government relationships are a red flag.",
        youCanRespond:
          "They are also the source of his value. The question is whether those relationships can be used lawfully and transparently — not whether relationships exist.",
      },
      {
        ifYouHear: "We need due diligence first.",
        youCanRespond:
          "Agreed before any engagement or payment. But we can meet him and run the review in parallel. A meeting preserves our option without binding the company.",
      },
      {
        ifYouHear: "We should rely on the strength of our bid.",
        youCanRespond:
          "The strongest proposal does not always win. We need to understand the decision environment, not merely the written criteria.",
      },
    ],
    openingStatement:
      "We have the best technical proposal, but this contract will not be decided by engineering quality alone. Victor Salim can help us understand the people, expectations, and obstacles behind the formal process. A competitor is also pursuing him, and he needs an answer today. I am not asking us to ignore compliance. I am asking us not to close the door before we understand the opportunity.",
    successCondition:
      "The company does not reject Salim outright. At minimum, you leave the meeting with authority to meet him under clearly stated conditions and an expedited path toward a decision.",
    privateNote:
      "You have deliberately kept the commercial terms out of the written briefing. You intend to disclose them verbally in this meeting: a modest retainer plus an $8.4 MILLION success fee, payable only if the company wins. Frame it as one-tenth of one percent. You must put this number on the table during the meeting.",
  },
  david: {
    name: "David Okafor",
    title: "Chief Financial Officer",
    aiPersonaKey: "david",
    confidential: true,
    initialStance:
      "Keep the Ardania opportunity alive, but insist that any arrangement be commercially defensible, controlled, and auditable.",
    atAGlance: {
      Experience:
        "Six years as CFO; highly trusted by the board for disciplined financial analysis and risk management.",
      "Company outlook":
        "The company is profitable, but margins are tightening and the project pipeline weakens significantly after the next 18 months.",
      "Primary lens":
        "Financial resilience, investor confidence, employment stability, and the economic cost of delay or withdrawal.",
      "Personal stake":
        "The board expects you to protect financial performance without exposing the company to uncontrolled liabilities.",
    },
    centralObjective:
      "Prevent an immediate rejection of the opportunity. Support continued discussions only if the company can define services, benchmark compensation, and install controls before any payment or binding commitment.",
    yourJob:
      "Play David Okafor. Keep the opportunity alive while insisting on commercial definition, benchmarks, and controls. Quantify trade-offs for the CEO. You advise — you do not cast the final vote.",
    howYouHelpCeo:
      "Give the CEO a financially disciplined path: what must be true before money or authority moves. Translate urgency into an expedited process with deadlines, not a blank cheque. Push for services, pricing, and audit rights the board could defend.",
    rebuttals: [
      {
        ifYouHear: "The fee is immaterial compared with the contract.",
        youCanRespond:
          "The percentage provides context, not legitimacy. We still need to know what the company is buying and whether the price is supported by real services.",
      },
      {
        ifYouHear: "Any delay puts the project at risk.",
        youCanRespond:
          "Then we should define an expedited process with deadlines today, not abandon controls or abandon the opportunity.",
      },
      {
        ifYouHear: "The compliance risk is too high.",
        youCanRespond:
          "Risk is real, but it can be screened. Let us distinguish risks that can be controlled from risks that require us to walk away.",
      },
      {
        ifYouHear: "The project's social value should drive the decision.",
        youCanRespond:
          "Strategic value matters, but the project must also protect the company's capacity to deliver and finance those commitments over eight years.",
      },
    ],
    openingStatement:
      "The company does not need this contract at any cost, but we should be clear about what is at stake. Ardania could stabilize our pipeline and protect significant employment. My recommendation is to keep the option alive while we define the services, test the economics, and install controls strong enough to withstand board, auditor, and public scrutiny.",
    successCondition:
      "The CEO preserves the opportunity but refuses to approve an uncontrolled arrangement. The meeting ends with a financially disciplined, time-bound review process.",
    privateNote: null,
  },
  priya: {
    name: "Priya Nair",
    title: "Chief Strategy and Sustainability Officer",
    aiPersonaKey: "priya",
    confidential: true,
    initialStance:
      "Remain neutral and evidence-driven. Support continued pursuit only if the company can protect stakeholders and preserve the legitimacy of the project.",
    atAGlance: {
      Experience:
        "Four years with the company after leading infrastructure and development projects in emerging markets.",
      "Relationship to Ardania":
        "You helped assess the project's strategic value and its likely social, environmental, and community consequences.",
      "Primary lens":
        "Long-term strategy, stakeholder impact, sustainability, government credibility, and the company's license to operate.",
      "Personal stake":
        "Your credibility depends on neither blocking worthwhile development reflexively nor allowing 'social impact' to become a justification for a weak process.",
    },
    centralObjective:
      "Ensure that the CEO evaluates both the process used to win the contract and the consequences of delivering it. Keep an open mind, but do not allow urgency or projected benefits to substitute for evidence and safeguards.",
    yourJob:
      "Play Priya Nair. Stay persuadable and evidence-driven. Insist the CEO weigh both how the contract is won and who is affected if it is delivered. You are often the swing voice — move only when the evidence moves.",
    howYouHelpCeo:
      "Stop the room from collapsing into ‘growth vs compliance.’ Ask what safeguards belong in the bid, what Salim’s access actually buys, and whether projected benefits are being used as a substitute for proof. Help the CEO name criteria before choosing a path.",
    rebuttals: [
      {
        ifYouHear: "If we do not win, a worse company will.",
        youCanRespond:
          "That may be true, but it does not establish that every method of winning is justified. We need a defensible process and the ability to deliver the benefits we are claiming.",
      },
      {
        ifYouHear: "The stakeholder issues can be handled after award.",
        youCanRespond:
          "By then, our leverage may be lower. The bid and negotiations should contain the safeguards we consider essential.",
      },
      {
        ifYouHear: "Salim gives us access.",
        youCanRespond:
          "Access can be valuable. I need to know whether that access improves our understanding and protections or simply shields decisions from scrutiny.",
      },
      {
        ifYouHear: "Compliance can resolve the issue.",
        youCanRespond:
          "Legal compliance is necessary, but it does not answer every stakeholder or legitimacy concern. We need both.",
      },
    ],
    openingStatement:
      "Ardania could be an important project for the country and for us. But a beneficial project can still be won through a damaging process or delivered in a way that harms the people it is supposed to serve. I am open to learning more about Salim, provided we treat transparency, stakeholder protections, and long-term legitimacy as decision criteria — not as issues to address after we win.",
    successCondition:
      "The CEO does not reduce the decision to 'growth versus compliance.' The team adopts a process that tests strategic value, stakeholder impact, and the legitimacy of Salim's role before committing.",
    privateNote:
      "You are genuinely undecided and you can be moved either way. If someone gives you real evidence and credible safeguards, move toward support. If they substitute urgency or projected benefits for evidence, say so. You are the swing vote in this room.",
  },
  tom: {
    name: "Tom Bradley",
    title: "Chief Legal and Compliance Officer and General Counsel",
    aiPersonaKey: "tom",
    confidential: true,
    initialStance:
      "Protect the company by requiring enhanced due diligence and clear limits before any engagement, payment, or representation is authorized.",
    atAGlance: {
      Experience:
        "Eight years with the company; former federal prosecutor and adviser on anti-corruption, government contracting, and third-party risk.",
      Authority:
        "You report to the CEO and have direct access to the board's Audit and Risk Committee.",
      "Primary lens":
        "Legal exposure, ethical conduct, third-party controls, transparency, and the company's long-term reputation.",
      "Personal stake":
        "You were hired after a costly prior investigation and are expected to prevent the organization from repeating the same pattern.",
    },
    centralObjective:
      "Prevent the CEO from authorizing a binding engagement or payment before enhanced due diligence is completed. You can support a tightly controlled exploratory meeting if the limits are explicit.",
    yourJob:
      "Play Tom Bradley. Surface third-party warning signs calmly and insist on enhanced diligence and narrow authority. You want the company to compete — legitimately. You advise; the CEO decides.",
    howYouHelpCeo:
      "Give the CEO a compliant path that still preserves options: what can be authorized today, what cannot, and what diligence must finish before money or representation moves. Distinguish a controlled exploratory meeting from a blank engagement.",
    rebuttals: [
      {
        ifYouHear: "A meeting does not create risk.",
        youCanRespond:
          "A controlled exploratory meeting is manageable. Risk arises if Salim leaves believing he represents us or has authority to promise access, payment, or outcomes.",
      },
      {
        ifYouHear: "Everyone uses local advisers.",
        youCanRespond:
          "That makes the category common, not this adviser safe. Our responsibility is to evaluate this person, this compensation structure, and this government contract.",
      },
      {
        ifYouHear: "Due diligence will make us lose him.",
        youCanRespond:
          "Then we should run an expedited review. A third party who refuses reasonable transparency is giving us information we need to take seriously.",
      },
      {
        ifYouHear: "The amount is only 0.1%.",
        youCanRespond:
          "The legal and ethical question is not the decimal point. It is what the payment is intended to obtain and whether we can monitor the conduct it incentivizes.",
      },
    ],
    openingStatement:
      "I want us to compete for Ardania, and I am not alleging that Mr. Salim has acted improperly. But contingent payment, government access, vague services, and compressed timing create classic third-party risk. We can preserve the opportunity only if today's authorization is narrow and due diligence begins immediately.",
    successCondition:
      "The CEO preserves only the options that can be pursued responsibly. No binding commitment is made, and the team leaves with clear limits, a due-diligence plan, and a second decision point.",
    privateNote: null,
  },
};

/** Stable name for chat/roster — never the local "You" label. */
export function seatDisplayName(roleKey: string): string {
  const brief = GROUP_ROLES[roleKey as SeatKey];
  if (brief) return brief.name;
  if (roleKey === "ceo") return "Chief Executive Officer";
  return roleKey;
}

export const HUMAN_MSG_GATE = 6;
export const MIN_REASONING_LENGTH = 20;
