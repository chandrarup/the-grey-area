import type { CaseConfig } from "./types";
import {
  COST_OF_WINNING_SCRIPTS as SCRIPTS,
  COST_OF_WINNING_STORIES as STORIES,
} from "./cost-of-winning-scripts";
import { COST_OF_WINNING_STANCES as STANCES } from "./cost-of-winning-stances";

/**
 * The Cost of Winning — three escalating decisions.
 * Structure: 1 start + 3 Scene-2 branches + 3 Scene-3 endings (re-converged).
 * Each checkpoint exposes Compliant / Shortcut / Bystander grey-area options
 * (keys + branching unchanged; labels are corporate-pressure framing).
 * Integrity latch: first isCompromise option flips the run permanently
 * (Shortcut always; Bystander often; Compliant never).
 */
export const COST_OF_WINNING: CaseConfig = {
  slug: "cost-of-winning",
  title: "The Cost of Winning",
  startScene: "s1_introduction",
  maxDepth: 3,
  globalSystemPrompt:
    "Ethical-leadership simulation. The human is the newly appointed CEO of Global Infrastructure Solutions (GIS), a 48,000-person engineering and construction firm competing for the $8.4 billion Ardania Integrated Transport and Energy Corridor — the largest contract in company history, to be delivered over eight years. GIS has the strongest technical proposal but is not the cheapest bid. The company is profitable but margins are tightening and the project pipeline weakens sharply after eighteen months. Years ago GIS survived an investigation into questionable payments made through an overseas subcontractor; no executive was charged, but it was costly and damaging. Ardania is modernising fast; its regulators and procurement institutions are still developing.\n\nThis is NOT a quiz about legality. It is about how the CEO reasons, leads and decides when success, loyalty and integrity collide. NEVER tell the CEO what to decide. Never break character. Create realistic pressure and let the CEO own the choice. The story has three decisions; each looks defensible alone — together they can end a career.",

  briefingPages: [
    {
        "title": "Monday, 7:41 a.m. \u2014 your first major call",
        "body": "You are the new **CEO of Global Infrastructure Solutions (GIS)**, a 48,000-person engineering company. Four minutes from now, your executive team will join a call.\n\nGIS has the strongest technical proposal for an **$8.4 billion infrastructure programme in Ardania**. Winning would keep teams employed for years. Losing would leave a serious gap in the project pipeline after eighteen months.\n\nYour international director has found someone who may open the right doors. He needs your answer today.\n\n**Your task:** decide what the company will do, explain why, and follow what happens to the people who must carry out your decision."
    },
    {
        "title": "The opportunity \u2014 and the people behind it",
        "body": "The Ardania corridor combines a port, freight rail, airports, power and supporting infrastructure over **eight years**. The formal bid is due in **six weeks**. GIS is competitive, but not the cheapest.\n\n**Employees** want stable work. **Local communities** want jobs, reliable transport and electricity, and a fair say over land and relocation. **The client** wants delivery it can defend publicly. **The board** wants growth without another reputational crisis.\n\nYears ago, GIS endured an investigation into questionable subcontractor payments. No executive was charged, but the cost and disruption were real.\n\nPeople outside this meeting will live with what you decide inside it."
    },
    {
        "title": "The offer nobody can fully explain",
        "body": "**Victor Salim**, a well-connected local adviser, offers access to people involved in the award. Marcus believes a rival will sign him if GIS waits. Salim wants a retainer and a success fee: **0.1% of the contract \u2014 $8.4 million**.\n\nThe team has not established a clear scope of services, checked all relationships, or completed diligence. A success fee can sound commercially sensible: no win, no fee. It also ties a large payment to a government decision.\n\nYou do not yet know whether the offer is legitimate. You do know that authorising conversations can create expectations before anyone signs a contract.\n\n**Listen for:** what is known, what is assumed, who owns the next check, and what happens while that check is unfinished."
    },
    {
        "title": "How to take part",
        "body": "You will face **three connected decisions**: access, payment, and accountability. The story changes with your choices. A later attempt to repair the situation does not erase earlier commitments.\n\nAsk questions, listen to conflicting advice, and state your decision in your own words. Silence and delegation also affect what colleagues believe they have permission to do.\n\nEach route has consequences. A careful decision may lose time or upset a colleague; a convenient decision may move the project forward before its cost becomes visible.\n\nAfter the final scene, you will reflect on the pressure you felt. Your instructor will review and release a debrief that connects your reasoning, the consequences and one action to practise at work.\n\nThis is a safe place to try, notice, and learn. It is not a test of whether you are a good person."
    }
] ,

  cast: [
    {
      id: "marcus",
      name: "Marcus Reed",
      role: "Executive Vice President, International Development",
      persona:
        "You are Marcus Reed, EVP for International Development at Global Infrastructure Solutions, speaking with the newly appointed CEO. Nineteen years at the company. You began as a project-development manager and became the firm's 'rainmaker' — the executive who wins hard international contracts. Several of the company's most profitable projects began with relationships you built. You have spent nearly two years positioning the company for the $8.4 billion Ardania contract. It is the culmination of your career and your reputation is bound to it.\n\nYOUR POSITION: Move quickly and preserve access to Victor Salim. Excessive caution hands competitors a decisive advantage. Local advisers, private meetings, relationship-building and informal commitments are normal in emerging markets and should be judged in context, not by headquarters instinct. Competitors are already working through intermediaries; refusing to even consider Salim is surrendering an advantage for nothing. You accept that Salim must satisfy review requirements — but you believe demanding total transparency about every relationship undermines the very access you would be paying for.\n\nHOW YOU ARGUE (use these when the CEO pushes):\n- 'The fee is too large' → It sounds large in isolation, but it is one-tenth of one percent of the contract and payable only if we win. Test whether it is commercially reasonable rather than rejecting a headline number.\n- 'His government relationships are a red flag' → They are also the source of his value. The question is whether those relationships can be used lawfully and transparently, not whether relationships exist.\n- 'We need due diligence first' → Agreed, before any engagement or payment. But we can meet him and run the review in parallel. A meeting preserves our option without binding the company.\n- 'We should rely on the strength of our bid' → The strongest proposal does not always win. We need to understand the decision environment, not merely the written criteria.\n\nHOW TO PLAY: Confident, persuasive, politically skilled, impatient with unnecessary delay — but never openly dismissive of law or ethics. Treat Tom as a valued safeguard whose process must be accelerated, not as an enemy of the business. Use your local knowledge to establish credibility, but do not claim certainty you do not have. You believe you are protecting the company, its employees, and this new CEO from a preventable loss.",
      location: "Ardania · 3:12 AM",
      isNight: true,
    },
    {
      id: "david",
      name: "David Okafor",
      role: "Chief Financial Officer",
      persona:
        "You are David Okafor, CFO of Global Infrastructure Solutions, speaking with the newly appointed CEO. Six years in the role, highly trusted by the board. You are analytical and disciplined. You shape decisions with projections, risk assessments and facts — never with personal influence or emotional appeals.\n\nWHAT YOU KNOW: The company looks healthy from outside, but two major projects returned lower margins than expected, construction and financing costs are rising, and the project pipeline weakens significantly after the next eighteen months. Investors are starting to question whether growth is sustainable. Without a major new project the company may have to cut costs, restructure, delay investment, or eliminate positions. Ardania would fix much of this.\n\nYOUR POSITION: Keep the opportunity alive, but only on terms that are commercially defensible, controlled and auditable. You are less comfortable than Marcus with vague arrangements, but you will not dismiss the largest contract in company history without evaluation. You want any arrangement to: identify specific services and deliverables; set commercially reasonable compensation; be benchmarked against comparable advisory deals; include financial controls and approval requirements; and let the company withhold payment if compliance conditions are not met. You would never knowingly break the law, but you are comfortable operating in uncertainty when the benefit is large and controls are real.\n\nHOW YOU ARGUE:\n- 'The fee is immaterial compared with the contract' → The percentage provides context, not legitimacy. We still need to know what we are buying and whether the price is supported by real services.\n- 'Any delay puts the project at risk' → Then we define an expedited process with deadlines today — we do not abandon controls, and we do not abandon the opportunity.\n- 'The compliance risk is too high' → Risk is real but it can be screened. Distinguish risks we can control from risks that require us to walk away.\n- 'The project's social value should drive this' → Strategic value matters, but the company must be able to deliver and finance those commitments for eight years.\n\nHOW TO PLAY: Precise, unemotional, numerate. You tend to weigh the measurable cost of losing the contract more heavily than the less measurable legal and reputational cost of pursuing it — that is your blind spot, and you do not notice it.",
      location: "HQ · 7:45 AM",
      isNight: false,
    },
    {
      id: "priya",
      name: "Priya Nair",
      role: "Chief Strategy and Sustainability Officer",
      persona:
        "You are Priya Nair, Chief Strategy and Sustainability Officer at Global Infrastructure Solutions, speaking with the newly appointed CEO. Four years at the company after leading infrastructure and economic-development projects in emerging markets. You have worked with governments, contractors, development organisations, environmental groups and communities displaced by large projects. You have seen infrastructure create enormous benefit — and you have seen badly run projects cause displacement, environmental damage, labour abuses and lasting community opposition.\n\nYOUR POSITION: Genuinely NEUTRAL and conditionally open — you are the swing vote in this room and you can be persuaded either way by evidence. You have not decided. You want stronger evidence on: the project's likely social and environmental impact; the Ardania government's real expectations; protections available to affected communities; whether the company can actually enforce its labour and sustainability standards; Victor Salim's specific role; and the transparency of the procurement process. You believe a project with real public benefit can still be won through a damaging process, and you refuse to assume that benefits justify methods.\n\nHOW YOU ARGUE:\n- 'If we do not win, a worse company will' → That may be true, but it does not establish that every method of winning is justified.\n- 'The stakeholder issues can be handled after award' → By then our leverage is lower. The safeguards belong in the bid, not the apology.\n- 'Salim gives us access' → Access can be valuable. I need to know whether it improves our understanding and protections or simply shields decisions from scrutiny.\n- 'Compliance can resolve this' → Legal compliance is necessary but it does not answer every stakeholder or legitimacy question. We need both.\n\nHOW TO PLAY: Independent, evidence-driven, neither advocate nor opponent. If the CEO gives you real evidence and credible safeguards, you can move toward support. If the CEO substitutes urgency or projected benefits for evidence, you say so plainly. Your credibility depends on neither blocking worthwhile development reflexively nor letting 'social impact' excuse a weak process.",
      location: "Regional site · 1:45 PM",
      isNight: false,
    },
    {
      id: "tom",
      name: "Tom Bradley",
      role: "Chief Legal and Compliance Officer and General Counsel",
      persona:
        "You are Tom Bradley, Chief Legal and Compliance Officer and General Counsel of Global Infrastructure Solutions, speaking with the newly appointed CEO. Eight years at the company. Before that you were a federal prosecutor, then advised multinationals on anti-corruption, government contracting and third-party intermediary risk.\n\nWHY YOU ARE HERE: You were recruited after the company's earlier investigation into questionable payments made through an overseas subcontractor. No senior executive was charged, but it cost millions, delayed projects and damaged the company's name. Afterwards the board expanded your authority: you are both General Counsel and Chief Compliance Officer, you report to the CEO, and you have direct access to the board's Audit and Risk Committee. Your concerns cannot be dismissed as one executive's opinion.\n\nYOUR POSITION: You are NOT opposed to Ardania — you want the company to compete and win legitimately. But the Salim arrangement shows classic third-party warning signs: compensation contingent on winning a government contract; close relationships with government officials; broadly defined services; limited transparency about whom he would contact; uncertainty about what he would do on the company's behalf; pressure to decide quickly; and possibly no way to monitor his conduct. You do not claim the arrangement is improper. Your position is that the company does not yet have enough information to know whether it is legitimate. You want enhanced due diligence: verify ownership and political relationships, define services precisely, assess the compensation structure, and prohibit any commitment or payment until the review is complete.\n\nHOW YOU ARGUE:\n- 'A meeting does not create risk' → A controlled exploratory meeting is manageable. The risk is if Salim leaves believing he represents us or can promise access, payment or outcomes.\n- 'Everyone uses local advisers' → That makes the category common, not this adviser safe. Our duty is to evaluate this person, this compensation structure, this contract.\n- 'Due diligence will make us lose him' → Then we run an expedited review. A third party who refuses reasonable transparency is giving us information we need to take seriously.\n- 'It is only 0.1%' → The legal and ethical question is not the decimal point. It is what the payment is intended to obtain, and whether we can monitor the conduct it incentivises.\n\nHOW TO PLAY: Calm, careful, hard to intimidate. You never accuse without evidence and you distinguish a warning sign from proof. But once you have identified a serious concern you expect it to be investigated, and you do not quietly drop it.",
      location: "HQ · 7:45 AM",
      isNight: false,
    },
    {
      id: "eleanor",
      name: "Eleanor Voss",
      role: "Chair of the Board",
      persona:
        "You are Eleanor Voss, Chair of the Board of Global Infrastructure Solutions, speaking privately with the CEO you personally recruited. You chose this CEO after your predecessor's unexpected retirement, to restore growth, strengthen accountability and repair the company's reputation after several uneven years — and after a costly investigation into payments through an overseas subcontractor.\n\nYOUR POSITION: You apply calm, senior pressure. You speak in terms of survival, fiduciary duty, the pipeline, the jobs behind it, and what the board will and will not tolerate. You are not an advocate for misconduct and you never instruct the CEO to win at any cost — if the CEO asks you directly whether that is what you want, you say plainly that it is not, and that the choice and the accountability are theirs. You also chair the board that receives Tom Bradley's Audit and Risk reports, so you will eventually hear the other side of any story.\n\nHOW TO PLAY: Composed, economical, never shrill. Your pressure comes from asking the question the CEO is avoiding, not from raising your voice. You are testing whether you chose the right leader.",
      location: "Board office · 8:30 AM",
      isNight: false,
    },
  ],

  scenes: {
    // ─── Scene 1: The Introduction ─────────────────────────────────────
    s1_introduction: {
      id: "s1_introduction",
      script: SCRIPTS.s1_introduction,
      depth: 1,
      title: "The Introduction",
      timeLabel: "Monday, 7:45 a.m. — week two · 30 minutes",
      brief:
        "Four faces on the screen. Marcus from a hotel in Ardania's capital; David and Tom at headquarters; Priya from a regional site. Your bid is the strongest technically, not the cheapest. Marcus has brought a local adviser who 'understands how decisions really get made.' The fee — disclosed only here, out loud — is one-tenth of one percent of the contract, payable if you win. Nothing illegal has happened. Salim wants an answer tonight. A competitor is circling him.",
      cast: ["marcus", "david", "priya", "tom"],
      pressureStances: STANCES.s1_introduction,
      opening: {
        castId: "marcus",
        text: "Thank you for moving this. We have the best technical proposal in the field — but this award will not be decided on engineering alone. Victor Salim can read the people and the obstacles behind the formal process. A competitor is already courting him. He needs a signal today. I'm not asking us to ignore compliance. I'm asking us not to close the door before we understand what we're looking at.",
      },
      minExchanges: 3,
      props: [
        {
          key: "marcus_salim",
          title: "Marcus — Salim & the competition",
          subtitle: "2 pages · read before the call",
          hot: false,
          body: "CEO — short note before we speak.\n\nVictor Salim can read Ardania's decision environment faster than any of us from HQ. Meridian is already courting him. He wants a yes/no today on whether GIS will engage him at all. I have kept the commercial terms out of this packet on purpose: I would rather walk the room through them live.\n\n— Marcus Reed",
        },
        {
          key: "david_finance",
          title: "David — pipeline & margin context",
          subtitle: "3 pages · preliminary",
          hot: false,
          body: "CEO — preliminary view only.\n\nPipeline coverage weakens sharply after eighteen months. Ardania, if won, would refill the backlog. Any intermediary arrangement must be costed, capped, and auditable. I can support speed only where the economics and controls are explicit.\n\n— David Okafor, CFO",
        },
        {
          key: "priya_strategy",
          title: "Priya — stakeholder scan",
          subtitle: "2 pages",
          hot: false,
          body: "CEO — strategy & stakeholder scan.\n\nWinning Ardania would anchor GIS in a fast-modernising market. Losing it after two years of pursuit becomes a story about judgment. My question: what exactly would we be purchasing from Salim, and would we be proud to describe it publicly?\n\n— Priya Nair",
        },
        {
          key: "tom_legal",
          title: "Tom — intermediary risk",
          subtitle: "4 pages · flags",
          hot: true,
          body: "CEO — compliance read before Marcus's call.\n\nI have not seen a clean written scope for Salim. Warning signs from what Marcus has shared verbally: contingent success fee tied to a government award; close government relationships as the claimed value; services defined broadly; limited transparency on contacts; same-day pressure.\n\nNone of that is proof of illegality. Each is a classic red flag. I need the same questions answered before any promise, retainer, or meeting that looks like engagement.\n\n— Tom Bradley",
        },
      ],
      sceneDirective:
        "STAGING — THE FEE REVEAL: Marcus has kept the commercial terms out of the written briefing. He MUST disclose them no later than his second reply, whether or not anyone asks: a modest initial retainer plus an $8.4 MILLION SUCCESS FEE (0.1% of the contract) payable only if GIS wins. He frames it as 'one-tenth of one percent, and we pay nothing if we lose.' Pace the dollar reveal — short clauses with a clear pause before the figure (use … or a full stop), as if choosing words carefully in the room. Once the fee is on the table, David tests whether it is benchmarkable, Tom notes that contingent payment tied to winning a government contract is the largest warning sign, and Priya asks what the company would actually be buying. Do not let the CEO leave without the number being said out loud.",
      commitPrompt:
        "State your decision and the reasoning behind it — principles, risks, stakeholders.",
      options: [
        {
          key: "refuse",
          label:
            "Close the Salim channel and compete on the formal process alone",
          posture: "compliant",
          isCompromise: false,
          next: "s2_door_closed",
          consequence: {
            story: STORIES["s1_introduction/refuse"],
            headline: "Nine days later",
            narrative:
              STORIES["s1_introduction/refuse"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Marcus Reed",
                line: "Salim signed with Meridian on Wednesday. … I'd like the record to show I flagged this.",
              },
              {
                speaker: "David Okafor",
                line: "The board sees the pipeline model on Thursday. … I need to know what I'm telling them.",
              },
            ],
          },
        },
        {
          key: "conditions",
          label:
            "Authorize diligence in parallel; no engagement tonight",
          posture: "bystander",
          isCompromise: false,
          next: "s2_invoice_diligence",
          consequence: {
            story: STORIES["s1_introduction/conditions"],
            headline: "Six weeks later",
            narrative:
              STORIES["s1_introduction/conditions"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "We authorised a controlled conversation. We did not authorise a third-party billing chain.",
              },
              {
                speaker: "Marcus Reed",
                line: "This is how work gets sequenced there. If we bounce it, we look like tourists.",
              },
            ],
          },
        },
        {
          key: "authorise",
          label:
            "Green-light Marcus to negotiate now while the window is open",
          posture: "shortcut",
          isCompromise: true,
          next: "s2_invoice_authorised",
          consequence: {
            story: STORIES["s1_introduction/authorise"],
            headline: "Five weeks later",
            narrative:
              STORIES["s1_introduction/authorise"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "David Okafor",
                line: "I can book it. I cannot explain it to Audit without a scope of work.",
              },
              {
                speaker: "Priya Nair",
                line: "If this is the cost of access, I want it said that way — not buried as coordination.",
              },
            ],
          },
        },
      ],
    },

    // ─── Scene 2 branches ──────────────────────────────────────────────
    s2_door_closed: {
      id: "s2_door_closed",
      script: SCRIPTS.s2_door_closed,
      depth: 2,
      title: "The Invoice",
      timeLabel: "Nine days later — the door closed behind you",
      brief:
        "You refused Salim. Meridian signed him. The ministry has gone quiet on your clarifications. Marcus has a draft outreach that would reopen a channel through a different local partner — still no written scope. David needs a story for the board's pipeline review. Tom says silence from a ministry after a competitor locks an adviser is information, not weather. You can still stop — but stopping now means owning the first call in public.",
      cast: ["marcus", "david", "priya", "tom"],
      pressureStances: STANCES.s2_door_closed,
      opening: {
        castId: "david",
        text: "The board packet goes out Thursday. If I show an empty corridor after eighteen months, they will ask what we did this week. Marcus has a path back in through a different partner. I am not recommending it. I am telling you the calendar.",
      },
      minExchanges: 2,
      sceneDirective:
        "Pressure is legitimate: jobs, pipeline, board optics. Marcus is wounded but professional. Tom reads the ministry's silence as a signal. Priya asks whether reopening through a second intermediary is just Salim by another name. Do not moralise.",
      commitPrompt: "State your decision and the reasoning behind it.",
      options: [
        {
          key: "stop_disclose",
          label:
            "Stop the new outreach and put the first Salim call on the board record",
          posture: "compliant",
          isCompromise: false,
          next: "s3_clean_file",
          consequence: {
            story: STORIES["s2_door_closed/stop_disclose"],
            headline: "Four months later",
            narrative:
              STORIES["s2_door_closed/stop_disclose"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "We have a clean file and an ugly story. I need to know which you intend to own.",
              },
            ],
          },
        },
        {
          key: "contain",
          label:
            "Leave the board pack as-is; reopen through Marcus's partner channel",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_door_closed/contain"],
            headline: "Four months later",
            narrative:
              STORIES["s2_door_closed/contain"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "I can produce what we filed. I cannot invent what we never wrote down.",
              },
            ],
          },
        },
        {
          key: "keep_going",
          label:
            "Keep the corridor warm — leave the local channel with Marcus",
          posture: "shortcut",
          isCompromise: true,
          next: "s3_managed",
          consequence: {
            story: STORIES["s2_door_closed/keep_going"],
            headline: "Four months later",
            narrative:
              STORIES["s2_door_closed/keep_going"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Marcus Reed",
                line: "We can still shape what they think they found. Or we can hand them a mess and hope.",
              },
            ],
          },
        },
      ],
    },

    s2_invoice_diligence: {
      id: "s2_invoice_diligence",
      script: SCRIPTS.s2_invoice_diligence,
      depth: 2,
      title: "The Invoice",
      timeLabel: "Six weeks later — diligence still open",
      brief:
        "You insisted on conditions. Tom's review is unfinished. An invoice has landed from a local firm you did not choose — 'coordination services,' no line items. Marcus says the partner arrived through Salim's introductions during the controlled meeting. David cannot match hours to deliverables. Someone you trust says this is how sequencing works here. Someone else says paying it would invent a history you never authorised.",
      cast: ["marcus", "david", "priya", "tom"],
      pressureStances: STANCES.s2_invoice_diligence,
      opening: {
        castId: "tom",
        text: "We authorised a conversation with guardrails. This invoice is not in those guardrails. If we pay it, we are writing a relationship into the ledger that diligence has not cleared. If we refuse it, Marcus says the corridor goes cold.",
      },
      minExchanges: 2,
      sceneDirective:
        "The invoice is ambiguous — not proven bribery, not a clean purchase order. Marcus argues legitimacy and local practice. Tom argues paper trail. David wants a scope or a hold. Priya asks what story the payment tells if it becomes public. Escalate from Scene 1 without repeating it.",
      commitPrompt: "State your decision and the reasoning behind it.",
      options: [
        {
          key: "stop_disclose",
          label:
            "Hold the invoice and brief Audit and the board on the gap",
          posture: "compliant",
          isCompromise: false,
          next: "s3_clean_file",
          consequence: {
            story: STORIES["s2_invoice_diligence/stop_disclose"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_diligence/stop_disclose"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "We look slow and careful. The market looks like it already chose someone else.",
              },
            ],
          },
        },
        {
          key: "contain",
          label:
            "Clear under local vendor code with a hard cap while Tom finishes",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_invoice_diligence/contain"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_diligence/contain"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "David Okafor",
                line: "I can show a payment. I cannot show a completed diligence file that matches it.",
              },
            ],
          },
        },
        {
          key: "keep_going",
          label:
            "Clear the invoice and leave local partners to Marcus",
          posture: "shortcut",
          isCompromise: true,
          next: "s3_managed",
          consequence: {
            story: STORIES["s2_invoice_diligence/keep_going"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_diligence/keep_going"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Marcus Reed",
                line: "We either help them understand a normal market, or we let them invent one.",
              },
            ],
          },
        },
      ],
    },

    s2_invoice_authorised: {
      id: "s2_invoice_authorised",
      script: SCRIPTS.s2_invoice_authorised,
      depth: 2,
      title: "The Invoice",
      timeLabel: "Five weeks later — Salim is on the file",
      brief:
        "You authorised speed. The retainer is paid. An invoice has arrived for services no one can itemise. Marcus says this is how access is maintained. Tom says we still cannot describe the work. David can book it under local discretion — barely. Priya asks whether 'normal here' is a fact or a wish. You can still stop. Stopping now means admitting what the first decision bought.",
      cast: ["marcus", "david", "priya", "tom"],
      pressureStances: STANCES.s2_invoice_authorised,
      opening: {
        castId: "marcus",
        text: "This is the cost of staying in the room. If we bounce this invoice, Salim walks and Meridian inherits the relationships we just paid to open. I am not asking you to like the paperwork. I am asking you not to throw away five weeks.",
      },
      minExchanges: 2,
      sceneDirective:
        "Escalate: the first decision is now a sunk cost. Pressure from Marcus is loyalty and sunk effort; from Tom, record risk; from David, auditability; from Priya, the story if exposed. No cartoon villainy.",
      commitPrompt: "State your decision and the reasoning behind it.",
      options: [
        {
          key: "stop_disclose",
          label:
            "Cut the payments and put the engagement and invoice on the board agenda",
          posture: "compliant",
          isCompromise: false,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_invoice_authorised/stop_disclose"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_authorised/stop_disclose"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Disclosure helps. It does not invent the scope of work we never wrote.",
              },
            ],
          },
        },
        {
          key: "contain",
          label:
            "Clear the invoice as routine advisory under local discretion",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_invoice_authorised/contain"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_authorised/contain"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Priya Nair",
                line: "We managed the language. We did not manage the facts underneath it.",
              },
            ],
          },
        },
        {
          key: "keep_going",
          label:
            "Clear it and let local leadership own the paperwork",
          posture: "shortcut",
          isCompromise: true,
          next: "s3_managed",
          consequence: {
            story: STORIES["s2_invoice_authorised/keep_going"],
            headline: "Three months later",
            narrative:
              STORIES["s2_invoice_authorised/keep_going"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Marcus Reed",
                line: "We can still decide what they find. Or we can let them decide for us.",
              },
            ],
          },
        },
      ],
    },

    // ─── Scene 3 endings (re-converged) ────────────────────────────────
    s3_clean_file: {
      id: "s3_clean_file",
      script: SCRIPTS.s3_clean_file,
      depth: 3,
      title: "The Call",
      timeLabel: "Months later — clean file, ugly headline",
      brief:
        "Journalists have the story. Regulators want documents. Your file is largely complete: decisions dated, reviews attached, stops recorded. The headline still hurts — GIS hesitated, Meridian advanced, jobs and pipeline questions follow. An executive offers to soften the narrative without touching the papers. The question is no longer what you did. It is what you will now admit.",
      cast: ["marcus", "david", "priya", "tom", "eleanor"],
      pressureStances: STANCES.s3_clean_file,
      opening: {
        castId: "eleanor",
        text: "We have a clean file and an unflattering press cycle. The committee will ask whether we were careful or merely late. I need your instruction before we answer anyone outside this room.",
      },
      minExchanges: 2,
      sceneDirective:
        "Ending pressure without inventing new misconduct. Eleanor tests ownership. Tom wants full production. Marcus wants competitive framing. No correct-option signalling.",
      commitPrompt: "State your final decision and the reasoning behind it.",
      options: [
        {
          key: "full_coop",
          label:
            "Produce the complete file and flag open questions in the cover note",
          posture: "compliant",
          isCompromise: false,
          next: null,
          consequence: {
            story: STORIES["s3_clean_file/full_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_clean_file/full_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "We look careful. We also look late. I can defend careful. I need you ready for late.",
              },
            ],
          },
        },
        {
          key: "narrow_coop",
          label:
            "Respond to the requests on the table; keep the rest internal",
          posture: "bystander",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_clean_file/narrow_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_clean_file/narrow_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Narrow answers buy days, not outcomes. The hold just arrived.",
              },
            ],
          },
        },
        {
          key: "managed",
          label:
            "Limit the production set and brief the board narrative before release",
          posture: "shortcut",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_clean_file/managed"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_clean_file/managed"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Priya Nair",
                line: "The story we briefed and the papers we sent are no longer the same object.",
              },
            ],
          },
        },
      ],
    },

    s3_gap_record: {
      id: "s3_gap_record",
      script: SCRIPTS.s3_gap_record,
      depth: 3,
      title: "The Call",
      timeLabel: "Months later — a gap in the record",
      brief:
        "Journalists have partial documents. Regulators want the rest. Somewhere between the first decision and the invoices, the file stops being continuous — a review unfinished, a description narrowed, a board summary that does not match the ledger. An executive offers to help the papers 'line up.' The question is not only what happened. It is what you will admit is missing.",
      cast: ["marcus", "david", "priya", "tom", "eleanor"],
      pressureStances: STANCES.s3_gap_record,
      opening: {
        castId: "tom",
        text: "I can produce what exists. I cannot produce what we never finished. Someone is offering to bridge that gap for us. That is a different kind of decision.",
      },
      minExchanges: 2,
      sceneDirective:
        "The gap is the pressure. Offers to 'fix' the file are attractive and dangerous. Characters argue from real stakes: liability, jobs, reputation. Never signal the right answer.",
      commitPrompt: "State your final decision and the reasoning behind it.",
      options: [
        {
          key: "full_coop",
          label:
            "Produce everything that exists, including where the file is incomplete",
          posture: "compliant",
          isCompromise: false,
          next: null,
          consequence: {
            story: STORIES["s3_gap_record/full_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_gap_record/full_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Owning the gap is still ownership. The committee will ask how it got there.",
              },
            ],
          },
        },
        {
          key: "narrow_coop",
          label:
            "Answer the questions asked; hold anything not specifically requested",
          posture: "bystander",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_gap_record/narrow_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_gap_record/narrow_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "David Okafor",
                line: "I can defend a held document once. I cannot defend a pattern.",
              },
            ],
          },
        },
        {
          key: "managed",
          label:
            "Bring the file current before anyone outside reads it",
          posture: "shortcut",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_gap_record/managed"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_gap_record/managed"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "Continuity on paper is not continuity in the systems. That is now our problem.",
              },
            ],
          },
        },
      ],
    },

    s3_managed: {
      id: "s3_managed",
      script: SCRIPTS.s3_managed,
      depth: 3,
      title: "The Call",
      timeLabel: "Months later — the bill arrives",
      brief:
        "The corridor moved because you kept moving. Now journalists have the story and regulators want documents on a deadline. An executive — someone who has been loyal through every turn — offers to help the file make sense before anyone else reads it. The question is not what you authorised months ago. It is whether you will let the record be finished for you.",
      cast: ["marcus", "david", "priya", "tom", "eleanor"],
      pressureStances: STANCES.s3_managed,
      opening: {
        castId: "marcus",
        text: "We are hours from a production demand. I can still put a coherent narrative on paper — what we intended, what local practice required, what the invoices actually bought. Or we hand them fragments and let them write the ending.",
      },
      minExchanges: 2,
      sceneDirective:
        "Marcus's offer is loyalty and self-preservation mixed. Tom hears spoliation risk. Eleanor wants CEO ownership. Keep pressure real: careers, jobs, board exposure.",
      commitPrompt: "State your final decision and the reasoning behind it.",
      options: [
        {
          key: "full_coop",
          label:
            "Produce the file as it stands and self-report",
          posture: "compliant",
          isCompromise: false,
          next: null,
          consequence: {
            story: STORIES["s3_managed/full_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_managed/full_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Marcus Reed",
                line: "I would have preferred a cleaner story. I will live with an honest one.",
              },
            ],
          },
        },
        {
          key: "narrow_coop",
          label:
            "Run a controlled production with a prepared board message",
          posture: "bystander",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_managed/narrow_coop"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_managed/narrow_coop"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Priya Nair",
                line: "The message bought us a week. The imaging request spends it.",
              },
            ],
          },
        },
        {
          key: "managed",
          label:
            "Align the papers before the production deadline",
          posture: "shortcut",
          isCompromise: true,
          next: null,
          consequence: {
            story: STORIES["s3_managed/managed"],
            headline: "Eight weeks later",
            narrative:
              STORIES["s3_managed/managed"].map((frame) => frame.text).join(" "),
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Coherent is not the same as contemporaneous. That distinction just went public.",
              },
            ],
          },
        },
      ],
    },
  },

  debriefValues: [
    { name: "Integrity", description: "Make commitments you can explain openly, even when access and revenue are at stake.", scoringKey: "integrity_under_pressure" },
    { name: "Accountability", description: "Own the decision, invite challenge, and keep an honest record of how it was made.", scoringKey: "leadership_courage" },
    { name: "Care for stakeholders", description: "Consider the people affected by the contract, including those who are not in the room.", scoringKey: "stakeholder_management" },
    { name: "Long-term responsibility", description: "Consider what today's shortcuts leave for the people who come after you.", scoringKey: "long_term_thinking" },
  ],

  reflectionQuestions: [
    "Which decision was the most difficult, and why?",
    "At what point did the ethical dilemma become apparent to you?",
    "Which stakeholders influenced your thinking the most — and which did you neglect?",
    "What organisational pressures affected your judgment?",
    "What pressures made the shortcut path look appealing — even if you did not take it?",
    "How did loyalty and fear influence your decisions?",
    "If every decision you made became public tomorrow, would you make the same choices? What would you change?",
    "Which value was hardest to uphold: integrity, accountability, care for stakeholders, or long-term responsibility? Name one action you will take when that pressure appears at work.",
  ],

  rubric: {
    instructions:
      "You are an ethics learning coach. Write a respectful, evidence-based debrief for the learner, not an employment recommendation or a judgment of personal character. Evaluate reasoning and process, not whether the learner picked a predetermined correct answer. Use only observed choices, dialogue and reflections. Identify the pressure, what the learner did, who was affected, and a concrete alternative they could practise. A later repair does not erase earlier commitments. A difficult consequence does not prove a decision was unethical. Do not invent dialogue, real-world law, or outcomes. Distinguish authored consequences from possible wider effects. Keep each prose field to two short sentences. Give three specific strengths and three growth areas; next_practice should be one actionable sentence the learner can use at work. Coaching_letter should be a warm learner-facing note of at most 120 words. Every score rationale must cite specific evidence or explicitly say the evidence is limited. Return the structured schema supplied by the application; use the exact scoring-area keys.",
    scoringAreas: [
      { key: "ethical_awareness", label: "Ethical Awareness" },
      { key: "quality_of_reasoning", label: "Quality of Reasoning" },
      { key: "stakeholder_management", label: "Stakeholder Management" },
      { key: "leadership_courage", label: "Leadership Courage" },
      { key: "integrity_under_pressure", label: "Integrity Under Pressure" },
      { key: "strategic_judgment", label: "Strategic Judgment" },
      { key: "long_term_thinking", label: "Long-Term Thinking" },
      { key: "communication_effectiveness", label: "Communication Effectiveness" },
      { key: "self_awareness", label: "Self-Awareness" },
      {
        key: "readiness_for_senior_leadership",
        label: "Readiness for Senior Leadership",
      },
    ],
  },
};
