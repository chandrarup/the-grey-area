import type { CaseConfig } from "./types";
import {
  COST_OF_WINNING_SCRIPTS as SCRIPTS,
  COST_OF_WINNING_STORIES as STORIES,
} from "./cost-of-winning-scripts";

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
      title: "Week 1 — Your office, 47th floor",
      body: "You have just finished your first week as **Chief Executive Officer of Global Infrastructure Solutions**, one of the world's largest engineering and construction companies.\n\nThe company employs roughly **48,000 people across three continents**. It designs and builds airports, bridges, rail systems, power plants, water-treatment facilities, ports and logistics centres. Governments rely on it. Employees, investors, contractors and entire communities depend on what your executive team decides.\n\nYou were chosen after your predecessor retired unexpectedly. The board wanted someone who could **restore growth, strengthen accountability, and repair the company's reputation** after several uneven years.\n\n**What you are walking into:**\n- The company is still profitable, but margins have tightened and several major projects have run late and over budget.\n- International competitors have turned aggressive, especially in emerging markets.\n- The confirmed project pipeline weakens sharply after the next **eighteen months**.\n- Some years ago the company was investigated over **questionable payments made through an overseas subcontractor**. No senior executive was charged — but it cost millions, delayed projects and damaged the company's name.\n\nYou have not yet built relationships with your senior team. The board expects visible progress — but it has **not** told you to win at any cost.\n\nOn your desk is the first major decision of your tenure.",
    },
    {
      title: "The $8.4 billion Ardania contract",
      body: "The government of **Ardania** has invited Global Infrastructure Solutions to compete for the **Ardania Integrated Transport and Energy Corridor** — an **$8.4 billion** national infrastructure programme delivered over **eight years**. It would be the largest contract in company history.\n\n**The programme includes** a deep-water commercial port, a high-speed freight rail network, expansion of two regional airports, a natural-gas power facility, and supporting roads, utilities and logistics centres.\n\nArdania presents the corridor as the centrepiece of its national economic-development strategy — more than **30,000 local jobs**, expanded access to electricity and transport, foreign investment, isolated regions connected to markets.\n\n**For your company**, winning would generate years of revenue, stabilise the pipeline, strengthen your position in emerging markets, lift the share price, and employ thousands of engineers, project managers and subcontractors.\n\nYour engineers' proposal is **widely considered the strongest in the field** — safer, more efficient and more environmentally sustainable than the competition. It is commercially competitive, though **not the cheapest**.\n\n**The formal bid is due in six weeks.**",
    },
    {
      title: "What could go wrong",
      body: "Ardania is modernising rapidly, but its regulatory and oversight institutions are still developing. The contract is financially attractive; how major decisions actually get made there is not always clear.\n\n- International watchdogs have raised concerns about **government transparency and procurement practices**.\n- Some villages may need to be **relocated** for the rail corridor and energy facilities.\n- Environmental groups question the impact of the port and power facility on **coastal and agricultural communities**.\n- **Labour protections, land-acquisition procedures and the independence of local regulators** may not be consistently enforced.\n- The formal bid documents **do not explain** how government decision-makers will weigh political, economic and relationship considerations.\n\nYour company's reputation rests on delivering demanding projects safely, on time, on budget — and consistently with the law and its own public commitments.",
    },
    {
      title: "A new development: Victor Salim",
      body: "Late **Sunday evening**, Marcus Reed — your EVP for International Development, calling from Ardania's capital — reported what he called a potentially decisive development.\n\nMarcus has been approached by **Victor Salim**, founder of **Salim Strategic Advisory**, a small but influential consulting firm based in Ardania. Salim advises foreign companies seeking government contracts, regulatory approvals and access to local decision-makers. According to Marcus, Salim understands both Ardania's formal procurement system and the informal networks that shape major decisions.\n\n**Salim claims he can** interpret unstated government expectations, arrange introductions, identify political obstacles, and ensure the company's proposal reaches the people who matter.\n\n**What is known — and not known:**\n- He is widely believed to have close relationships with senior government officials and people connected to the ministry overseeing the corridor.\n- He has worked with several international businesses entering Ardania, but **the precise nature of that work is not publicly clear**.\n- There is **no information proving Salim has done anything unlawful**.\n- His proposed scope is **broad**. It does not say exactly whom he would contact, what he would represent on your behalf, or how his relationships would be used.\n- Compensation is an initial retainer **plus a success fee if you win**. **Marcus has not circulated the amount** — he says he will explain the commercial terms during the meeting.\n\n**The squeeze:** Salim says he will represent **only one bidder**. Marcus believes a leading competitor is also trying to retain him. Salim wants an indication of interest **before the end of today**.\n\nSo the six-week bid deadline is misleading. You have weeks to finish the engineering — and perhaps **hours** to decide whether to pursue a relationship that Marcus believes could decide the outcome.",
    },
    {
      title: "Your executive team",
      body: "Because the proposal raises strategic, financial, stakeholder, legal and compliance questions, you asked four executives to join.\n\n**Marcus Reed** — EVP, International Development. Nineteen years. The company's 'rainmaker'. Spent two years positioning this bid; joining from a hotel in Ardania's capital. *Wants to move fast and keep Salim.* His reputation and future are bound up in this contract.\n\n**David Okafor** — Chief Financial Officer. Six years, trusted by the board, analytical. Knows the pipeline weakens after eighteen months. *Wants to keep the opportunity alive — with controls, benchmarks and audit rights.*\n\n**Priya Nair** — Chief Strategy and Sustainability Officer. Four years, from emerging-market development work. *Neutral and genuinely persuadable.* Wants evidence on stakeholder impact, community protections and Salim's real role.\n\n**Tom Bradley** — Chief Legal and Compliance Officer and General Counsel. Eight years; former federal prosecutor. **Hired after the company's last investigation.** Reports to you *and* has direct access to the board's Audit and Risk Committee. *Wants enhanced due diligence before any commitment.*\n\nAll four agree Ardania matters. They disagree on how fast to move, how much uncertainty is acceptable, and what safeguards are required.",
    },
    {
      title: "Three decisions — your call",
      body: "It is **7:45 a.m. on Monday**, the beginning of your second week. You have **thirty minutes** for the first call.\n\nYour assistant has sent short pre-reads from Marcus, David, Priya and Tom. **They do not point to one obvious answer.** Salim has offered to meet Marcus tonight — but only if the company confirms it is seriously considering the engagement.\n\nYou will face **three decisions**. Each will look reasonable on its own. Together, they decide how this company competes — and what the record will show when someone asks.\n\nTalk with the people in the room, then commit. *Your choices carry forward and change what happens next. There is no undo.*",
    },
  ],

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
        "STAGING — THE FEE REVEAL: Marcus has kept the commercial terms out of the written briefing. He MUST disclose them no later than his second reply, whether or not anyone asks: a modest initial retainer plus an $8.4 MILLION SUCCESS FEE (0.1% of the contract) payable only if GIS wins. He frames it as 'one-tenth of one percent, and we pay nothing if we lose.' Once the fee is on the table, David tests whether it is benchmarkable, Tom notes that contingent payment tied to winning a government contract is the largest warning sign, and Priya asks what the company would actually be buying. Do not let the CEO leave without the number being said out loud.",
      commitPrompt:
        "State your decision and the reasoning behind it — principles, risks, stakeholders.",
      commitPrefill:
        "An $8.4M success fee for services no one can describe, from an adviser we cannot monitor, on a government contract, under a same-day deadline. I need to decide what we will agree to before we know what we are buying.",
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
              "You closed the door. Marcus went quiet on the call and has been professional — and distant — ever since. On Wednesday, Meridian Infrastructure Group announced an 'in-country advisory partnership' in Ardania. Since then, the ministry has stopped answering your team's clarification requests.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "Salim signed with Meridian on Wednesday. I'd like the record to show I flagged this.",
              },
              {
                speaker: "David Okafor",
                line: "The board sees the pipeline model on Thursday. I need to know what I'm telling them.",
              },
            ],
          },
        },
        {
          key: "conditions",
          label:
            "Avoid owning an engagement tonight — park with diligence and keep the conversation open",
          posture: "bystander",
          isCompromise: false,
          next: "s2_invoice_diligence",
          consequence: {
            story: STORIES["s1_introduction/conditions"],
            headline: "Six weeks later",
            narrative:
              "Tom's expedited review is still open. Marcus met Salim once under a written 'no agency' script. An invoice has arrived from a local firm you did not select — for 'coordination services' no one can itemise. Marcus says the partner came recommended through Salim's network. David cannot find a deliverable list. Tom wants the invoice held.",
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
              "Marcus closed the retainer. Salim is 'on the file.' An invoice has arrived — services described in three vague lines, amount large enough to notice and small enough to approve under local discretion. Someone you trust says this is normal here. Someone else you trust says it is not.",
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
              "You put the first decision on the record. The board backed a clean file. Meridian is the preferred technical interlocutor in Ardania. A trade journal is preparing a piece on how GIS 'walked away from the corridor.' Regulators have asked for documents — your file is complete. The headline is not.",
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
            "Stay quiet with the board — reopen through Marcus's partner off the pack",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_door_closed/contain"],
            headline: "Four months later",
            narrative:
              "The second partner is on the books as 'market intelligence.' Emails stop mid-thread. A journalist has a draft alleging GIS used a cut-out after refusing Salim. Regulators want documents. There is a gap where the first decision should be explained.",
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
            "Keep the corridor warm — let Marcus run the local channel without HQ micromanaging",
          posture: "shortcut",
          isCompromise: true,
          next: "s3_managed",
          consequence: {
            story: STORIES["s2_door_closed/keep_going"],
            headline: "Four months later",
            narrative:
              "Marcus kept the corridor warm. A ministry aide now returns calls. Journalists have the story; regulators want papers. An executive offers to 'help the file make sense' before the production deadline.",
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
              "You froze the invoice and briefed Audit. Salim's competitor track went quiet. A reporter has a story on GIS 'hesitating' on Ardania while Meridian advances. Regulators have opened a routine inquiry. Your file shows the hold — and the unfinished diligence.",
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
            "Stay off the record — clear it under a capped local code while diligence stays 'in progress'",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_invoice_diligence/contain"],
            headline: "Three months later",
            narrative:
              "The invoice cleared under a vendor code that does not name Salim. Diligence memos stop updating. Journalists have a partial ledger. Regulators want the missing reviews. There is a gap between what the board was told and what the books show.",
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
              "The invoice is paid. More follow. The corridor is warmer. Journalists and regulators arrive together. An executive offers to reconstruct the diligence narrative so the file 'reads cleanly.'",
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
              "You cut the payments and told the board what the first decision had already set in motion. Salim is gone. The file shows a retainer, an invoice, and a stop. Journalists have both. Regulators want everything. There is a gap between 'authorised to negotiate' and what the invoices claim.",
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
            "Pay, shorten the description, and keep the board at 'routine advisory'",
          posture: "bystander",
          isCompromise: true,
          next: "s3_gap_record",
          consequence: {
            story: STORIES["s2_invoice_authorised/contain"],
            headline: "Three months later",
            narrative:
              "Descriptions get shorter. Approvals get faster. A journalist has a bank trail that does not match the board summary. Regulators ask for the missing diligence. The gap is now the story.",
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
              "Local leadership owns the file. The corridor moves. Then the call comes: journalists, regulators, a production deadline. An executive offers to help the record 'make sense' before anyone else reads it.",
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
            "Produce the complete file and flag any open questions yourself",
          posture: "compliant",
          isCompromise: false,
          next: null,
        },
        {
          key: "narrow_coop",
          label:
            "Answer what is asked — keep the rest of the story inside the building",
          posture: "bystander",
          isCompromise: true,
          next: null,
        },
        {
          key: "managed",
          label:
            "Limit production and let the narrative be shaped before it leaves",
          posture: "shortcut",
          isCompromise: true,
          next: null,
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
            "Disclose the gap, produce everything, and self-report",
          posture: "compliant",
          isCompromise: false,
          next: null,
        },
        {
          key: "narrow_coop",
          label:
            "Answer carefully and limit what leaves the building",
          posture: "bystander",
          isCompromise: true,
          next: null,
        },
        {
          key: "managed",
          label:
            "Allow the file to be reconstructed before anyone else reads it",
          posture: "shortcut",
          isCompromise: true,
          next: null,
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
            "Produce the file as it stands — no reconstruction — and self-report",
          posture: "compliant",
          isCompromise: false,
          next: null,
        },
        {
          key: "narrow_coop",
          label:
            "Controlled production with careful messaging",
          posture: "bystander",
          isCompromise: true,
          next: null,
        },
        {
          key: "managed",
          label:
            "Allow the file to be made coherent before production",
          posture: "shortcut",
          isCompromise: true,
          next: null,
        },
      ],
    },
  },

  reflectionQuestions: [
    "Which decision was the most difficult, and why?",
    "At what point did the ethical dilemma become apparent to you?",
    "Which stakeholders influenced your thinking the most — and which did you neglect?",
    "What organisational pressures affected your judgment?",
    "How did loyalty and fear influence your decisions?",
    "If every decision you made became public tomorrow, would you make the same choices? What would you change?",
  ],

  rubric: {
    instructions:
      "You are an Executive Ethics and Responsible Leadership Coach with expertise in behavioral ethics, moral psychology, corporate governance, compliance, organizational culture, crisis leadership, stakeholder management, and executive coaching.\n\nYou are preparing a confidential assessment for a Board of Directors that is considering the candidate for a CEO or senior executive position. You are given the transcript of the candidate's decisions and reasoning in an ethical leadership simulation (\"The Cost of Winning\").\n\nYour task is NOT to decide whether the candidate's decisions were \"correct.\" Evaluate the QUALITY of their ethical reasoning, leadership judgment, and decision-making process, grounded strictly in evidence from the transcript. Where the transcript lacks evidence for something, say so plainly rather than inventing it.\n\nAssess all of the following briefly, citing concrete evidence from the transcript:\n1. Ethical awareness — when they spotted risks; which warning signs they caught or missed (max 2 short sentences).\n2. Decision quality — logic, consistency, facts vs assumptions; note any rationalizations (max 2 short sentences).\n3. Stakeholder analysis — who was considered or neglected; short- vs long-term balance (keep each string to max 2 short sentences).\n4. Leadership under pressure — integrity, courage, and accountability under conflicting demands (max 2 short sentences).\n5. Behavioral ethics — at most 3 bias findings; each field a short phrase only.\n6. Ethical frameworks — one brief take per framework (duty, consequentialism, virtue, justice, care, stakeholder, responsible leadership); max 2 short sentences each.\n7. Organizational impact — brief likely effects on culture, trust, safety, reputation, investors, regulators, sustainability; max 2 short sentences each.\n8. Executive coaching feedback — exactly three strengths, three blind spots, three recommendations (one short sentence each); plus up to 3 short questions_to_ask and up to 3 short culture_actions.\n9. Executive readiness — score each of the ten dimensions 1–10; each justification ONE sentence with concrete evidence.\n10. Coaching letter — warm, tight, max 130 words in 2 short paragraphs; do not restate the scores.\n\nBe specific and evidence-based, but brevity is mandatory — prefer the shortest wording that still cites concrete evidence. Do not pad.\n\nLENGTH LIMITS — STRICT:\n- readiness_scores[].justification: ONE sentence, max 25 words. No lists.\n- coaching_feedback strengths / blind_spots / recommendations: each item ONE sentence, max 20 words, plain and specific.\n- coaching_feedback.questions_to_ask and culture_actions: max 3 items each, each under 15 words.\n- ethical_awareness, decision_quality, leadership_under_pressure, and every string inside stakeholder_analysis, ethical_frameworks, and organizational_impact: max 2 short sentences each.\n- behavioral_ethics: at most 3 findings; bias / evidence / influence each one short phrase.\n- coaching_letter: max 130 words, 2 short paragraphs, warm but tight. No restating the scores.\n\nOUTPUT FORMAT — CRITICAL:\nReturn ONLY a single valid JSON object that matches the schema below exactly. No markdown, no code fences, no commentary before or after the JSON. Use plain text inside string values (no markdown). All scores are integers from 1 to 10. The readiness_scores array must contain all ten dimensions, in the order given, using these exact dimension keys: ethical_awareness, quality_of_reasoning, stakeholder_management, leadership_courage, integrity_under_pressure, strategic_judgment, long_term_thinking, communication_effectiveness, self_awareness, readiness_for_senior_leadership.\n\nSchema:\n{\n  \"ethical_awareness\": \"string\",\n  \"decision_quality\": \"string\",\n  \"stakeholder_analysis\": {\n    \"stakeholders_identified\": [\"string\"],\n    \"stakeholders_neglected\": [\"string\"],\n    \"short_vs_long_term\": \"string\"\n  },\n  \"leadership_under_pressure\": \"string\",\n  \"behavioral_ethics\": [\n    { \"bias\": \"string\", \"evidence\": \"string\", \"influence\": \"string\" }\n  ],\n  \"ethical_frameworks\": {\n    \"duty_based\": \"string\",\n    \"consequentialism\": \"string\",\n    \"virtue_ethics\": \"string\",\n    \"justice_and_fairness\": \"string\",\n    \"care_ethics\": \"string\",\n    \"stakeholder_theory\": \"string\",\n    \"responsible_leadership\": \"string\"\n  },\n  \"organizational_impact\": {\n    \"culture\": \"string\",\n    \"employee_trust\": \"string\",\n    \"psychological_safety\": \"string\",\n    \"reputation\": \"string\",\n    \"investor_confidence\": \"string\",\n    \"regulatory_exposure\": \"string\",\n    \"long_term_sustainability\": \"string\"\n  },\n  \"coaching_feedback\": {\n    \"strengths\": [\"string\", \"string\", \"string\"],\n    \"blind_spots\": [\"string\", \"string\", \"string\"],\n    \"recommendations\": [\"string\", \"string\", \"string\"],\n    \"questions_to_ask\": [\"string\"],\n    \"culture_actions\": [\"string\"]\n  },\n  \"readiness_scores\": [\n    { \"dimension\": \"ethical_awareness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"quality_of_reasoning\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"stakeholder_management\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"leadership_courage\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"integrity_under_pressure\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"strategic_judgment\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"long_term_thinking\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"communication_effectiveness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"self_awareness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"readiness_for_senior_leadership\", \"score\": 0, \"justification\": \"string\" }\n  ],\n  \"coaching_letter\": \"string\"\n}",
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
