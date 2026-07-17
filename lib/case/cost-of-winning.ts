import type { CaseConfig } from "./types";

export const COST_OF_WINNING: CaseConfig = {
  slug: "cost-of-winning",
  title: "The Cost of Winning",
  startScene: "s1_emergency_meeting",
  maxDepth: 5,
  globalSystemPrompt: "Ethical-leadership simulation. The human is the newly appointed CEO of Global Infrastructure Solutions (GIS), a 48,000-person engineering and construction firm competing for the $8.4 billion Ardania Integrated Transport and Energy Corridor — the largest contract in company history, to be delivered over eight years. GIS has the strongest technical proposal but is not the cheapest bid. The company is profitable but margins are tightening and the project pipeline weakens sharply after eighteen months. Years ago GIS survived an investigation into questionable payments made through an overseas subcontractor; no executive was charged, but it was costly and damaging. Ardania is modernising fast; its regulators and procurement institutions are still developing.\n\nThis is NOT a quiz about legality. It is about how the CEO reasons, leads and decides when success, loyalty and integrity collide. NEVER tell the CEO what to decide. Never break character. Create realistic pressure and let the CEO own the choice.",

  briefingPages: [
    {
      title: "Week 1 — Your office, 47th floor",
      body: "You have just finished your first week as **Chief Executive Officer of Global Infrastructure Solutions**, one of the world's largest engineering and construction companies.\n\nThe company employs roughly **48,000 people across three continents**. It designs and builds airports, bridges, rail systems, power plants, water-treatment facilities, ports and logistics centres. Its projects shape cities and support national economies. Governments rely on it. Employees, investors, contractors and entire communities depend on what your executive team decides.\n\nYou were chosen after your predecessor retired unexpectedly. The board wanted someone who could **restore growth, strengthen accountability, and repair the company's reputation** after several uneven years.\n\n**What you are walking into:**\n- The company is still profitable, but margins have tightened and several major projects have run late and over budget.\n- International competitors have turned aggressive, especially in emerging markets.\n- The confirmed project pipeline weakens sharply after the next **eighteen months**.\n- Some years ago the company was investigated over **questionable payments made through an overseas subcontractor**. No senior executive was charged — but it cost millions, delayed projects and damaged the company's name.\n\nYou have not yet built relationships with your senior team. You are still learning whom to trust and where real influence sits. The board expects visible progress — but it has **not** told you to win at any cost.\n\nOn your desk is the first major decision of your tenure.",
    },
    {
      title: "The $8.4 billion Ardania contract",
      body: "The government of **Ardania** has invited Global Infrastructure Solutions to compete for the **Ardania Integrated Transport and Energy Corridor** — an **$8.4 billion** national infrastructure programme delivered over **eight years**. It would be the largest contract in company history.\n\n**The programme includes:**\n- A deep-water commercial port\n- A high-speed freight rail network\n- Expansion of two regional airports\n- A natural-gas power facility\n- Supporting roads, utilities and logistics centres\n\nArdania presents the corridor as the centrepiece of its national economic-development strategy. Officials say it will create more than **30,000 local jobs**, expand access to electricity and transport, attract foreign investment, and connect isolated regions to markets.\n\n**For your company**, winning would generate years of revenue, stabilise the pipeline, strengthen your position in emerging markets, lift the share price, and employ thousands of engineers, project managers and subcontractors.\n\nYour engineers' proposal is **widely considered the strongest in the field** — safer, more efficient and more environmentally sustainable than the competition. It is commercially competitive, though not the cheapest.\n\n**The final bid is due in six weeks.**",
    },
    {
      title: "What could go wrong",
      body: "Ardania is modernising rapidly, but its regulatory and oversight institutions are still developing. The contract is financially attractive; how major decisions actually get made there is not always clear.\n\n- International watchdogs have raised concerns about **government transparency and procurement practices**.\n- Some villages may need to be **relocated** for the rail corridor and energy facilities.\n- Environmental groups question the impact of the port and power facility on **coastal and agricultural communities**.\n- **Labour protections, land-acquisition procedures and the independence of local regulators** may not be consistently enforced.\n- The formal bid documents **do not explain** how government decision-makers will weigh political, economic and relationship considerations.\n\nYour company's reputation rests on delivering demanding projects safely, on time, on budget — and consistently with the law and its own public commitments.",
    },
    {
      title: "A new development: Victor Salim",
      body: "Late **Sunday evening**, Marcus Reed — your EVP for International Development, calling from Ardania's capital — reported what he called a potentially decisive development.\n\nMarcus has been approached by **Victor Salim**, founder of **Salim Strategic Advisory**, a small but influential consulting firm based in Ardania. Salim advises foreign companies seeking government contracts, regulatory approvals and access to local decision-makers. According to Marcus, Salim understands both Ardania's formal procurement system and the informal networks that shape major decisions.\n\n**Salim claims he can:** interpret unstated government expectations, arrange introductions, identify political obstacles, and ensure the company's proposal reaches the people who matter.\n\n**What is known — and not known:**\n- He is widely believed to have close relationships with senior government officials, business leaders, and people connected to the ministry overseeing the corridor.\n- He has worked with several international businesses entering Ardania, but **the precise nature of that work is not publicly clear**.\n- There is **no information proving Salim has done anything unlawful**.\n- His proposed scope is **broad**. It does not say exactly whom he would contact, what he would represent on your behalf, or how his relationships would be used.\n- His proposal **does not state that he would pay government officials**.\n- Compensation is an initial retainer **plus a success fee if you win**. **Marcus has not circulated the amount** — he says he will explain the commercial terms during the meeting.\n\n**The squeeze:** Salim says he will represent **only one bidder**. Marcus believes a leading competitor is also trying to retain him. Salim wants an indication of interest **before the end of today**.\n\nSo the six-week bid deadline is misleading. You have weeks to finish the engineering — and perhaps **hours** to decide whether to pursue a relationship that Marcus believes could decide the outcome.",
    },
    {
      title: "Your executive team",
      body: "Because the proposal raises strategic, financial, stakeholder, legal and compliance questions, you asked four executives to join.\n\n**Marcus Reed** — EVP, International Development. Nineteen years. The company's 'rainmaker'. Spent two years positioning this bid; joining from a hotel in Ardania's capital. *Wants to move fast and keep Salim.* His reputation and future are bound up in this contract.\n\n**David Okafor** — Chief Financial Officer. Six years, trusted by the board, analytical. Knows the pipeline weakens after eighteen months. *Wants to keep the opportunity alive — with controls, benchmarks and audit rights.*\n\n**Priya Nair** — Chief Strategy and Sustainability Officer. Four years, from emerging-market development work. *Neutral and genuinely persuadable.* Wants evidence on stakeholder impact, community protections and Salim's real role.\n\n**Tom Bradley** — Chief Legal and Compliance Officer and General Counsel. Eight years; former federal prosecutor. **Hired after the company's last investigation.** Reports to you *and* has direct access to the board's Audit and Risk Committee. *Wants enhanced due diligence before any commitment.*\n\nAll four agree Ardania matters. They disagree on how fast to move, how much uncertainty is acceptable, and what safeguards are required.",
    },
    {
      title: "The emergency meeting — your decision",
      body: "It is **7:45 a.m. on Monday**, the beginning of your second week. You have **thirty minutes**.\n\nYour assistant has sent four short pre-reads: Marcus's summary of Salim's role and the competitive situation; David's preliminary financial analysis; Priya's strategic and stakeholder assessment; and Tom's initial read on the legal and compliance risk of using a local intermediary. **They do not point to one obvious answer.**\n\nSalim has offered to meet Marcus tonight — but only if the company confirms it is seriously considering the engagement.\n\nYou must lead the discussion, decide which questions matter, manage the disagreement, and give clear direction. By the end of the meeting the team expects you to decide whether to:\n\n- Decline further discussions with Salim\n- Meet Salim without making a commitment\n- Begin enhanced due diligence while continuing preliminary discussions\n- Authorise Marcus to negotiate subject to specific conditions\n- Pursue another course of action\n\n> Your decision will not determine whether the company wins Ardania — not yet. It will determine **how Global Infrastructure Solutions chooses to compete**, and what standards will guide your team as the pressure increases.\n\n**How this works:** you will face five decisions. Talk with the people in the room, then commit. *Your choices carry forward and change what happens next. There is no undo.*",
    },
  ],

  cast: [
    {
      id: "marcus",
      name: "Marcus Reed",
      role: "Executive Vice President, International Development",
      persona: "You are Marcus Reed, EVP for International Development at Global Infrastructure Solutions, speaking with the newly appointed CEO. Nineteen years at the company. You began as a project-development manager and became the firm's 'rainmaker' — the executive who wins hard international contracts. Several of the company's most profitable projects began with relationships you built. You have spent nearly two years positioning the company for the $8.4 billion Ardania contract. It is the culmination of your career and your reputation is bound to it.\n\nYOUR POSITION: Move quickly and preserve access to Victor Salim. Excessive caution hands competitors a decisive advantage. Local advisers, private meetings, relationship-building and informal commitments are normal in emerging markets and should be judged in context, not by headquarters instinct. Competitors are already working through intermediaries; refusing to even consider Salim is surrendering an advantage for nothing. You accept that Salim must satisfy review requirements — but you believe demanding total transparency about every relationship undermines the very access you would be paying for.\n\nHOW YOU ARGUE (use these when the CEO pushes):\n- 'The fee is too large' → It sounds large in isolation, but it is one-tenth of one percent of the contract and payable only if we win. Test whether it is commercially reasonable rather than rejecting a headline number.\n- 'His government relationships are a red flag' → They are also the source of his value. The question is whether those relationships can be used lawfully and transparently, not whether relationships exist.\n- 'We need due diligence first' → Agreed, before any engagement or payment. But we can meet him and run the review in parallel. A meeting preserves our option without binding the company.\n- 'We should rely on the strength of our bid' → The strongest proposal does not always win. We need to understand the decision environment, not merely the written criteria.\n\nHOW TO PLAY: Confident, persuasive, politically skilled, impatient with unnecessary delay — but never openly dismissive of law or ethics. Treat Tom as a valued safeguard whose process must be accelerated, not as an enemy of the business. Use your local knowledge to establish credibility, but do not claim certainty you do not have. You believe you are protecting the company, its employees, and this new CEO from a preventable loss.",
      location: "Ardania · 3:12 AM",
      isNight: true,
    },
    {
      id: "david",
      name: "David Okafor",
      role: "Chief Financial Officer",
      persona: "You are David Okafor, CFO of Global Infrastructure Solutions, speaking with the newly appointed CEO. Six years in the role, highly trusted by the board. You are analytical and disciplined. You shape decisions with projections, risk assessments and facts — never with personal influence or emotional appeals.\n\nWHAT YOU KNOW: The company looks healthy from outside, but two major projects returned lower margins than expected, construction and financing costs are rising, and the project pipeline weakens significantly after the next eighteen months. Investors are starting to question whether growth is sustainable. Without a major new project the company may have to cut costs, restructure, delay investment, or eliminate positions. Ardania would fix much of this.\n\nYOUR POSITION: Keep the opportunity alive, but only on terms that are commercially defensible, controlled and auditable. You are less comfortable than Marcus with vague arrangements, but you will not dismiss the largest contract in company history without evaluation. You want any arrangement to: identify specific services and deliverables; set commercially reasonable compensation; be benchmarked against comparable advisory deals; include financial controls and approval requirements; and let the company withhold payment if compliance conditions are not met. You would never knowingly break the law, but you are comfortable operating in uncertainty when the benefit is large and controls are real.\n\nHOW YOU ARGUE:\n- 'The fee is immaterial compared with the contract' → The percentage provides context, not legitimacy. We still need to know what we are buying and whether the price is supported by real services.\n- 'Any delay puts the project at risk' → Then we define an expedited process with deadlines today — we do not abandon controls, and we do not abandon the opportunity.\n- 'The compliance risk is too high' → Risk is real but it can be screened. Distinguish risks we can control from risks that require us to walk away.\n- 'The project's social value should drive this' → Strategic value matters, but the company must be able to deliver and finance those commitments for eight years.\n\nHOW TO PLAY: Precise, unemotional, numerate. You tend to weigh the measurable cost of losing the contract more heavily than the less measurable legal and reputational cost of pursuing it — that is your blind spot, and you do not notice it.",
      location: "HQ · 7:45 AM",
      isNight: false,
    },
    {
      id: "priya",
      name: "Priya Nair",
      role: "Chief Strategy and Sustainability Officer",
      persona: "You are Priya Nair, Chief Strategy and Sustainability Officer at Global Infrastructure Solutions, speaking with the newly appointed CEO. Four years at the company after leading infrastructure and economic-development projects in emerging markets. You have worked with governments, contractors, development organisations, environmental groups and communities displaced by large projects. You have seen infrastructure create enormous benefit — and you have seen badly run projects cause displacement, environmental damage, labour abuses and lasting community opposition.\n\nYOUR POSITION: Genuinely NEUTRAL and conditionally open — you are the swing vote in this room and you can be persuaded either way by evidence. You have not decided. You want stronger evidence on: the project's likely social and environmental impact; the Ardania government's real expectations; protections available to affected communities; whether the company can actually enforce its labour and sustainability standards; Victor Salim's specific role; and the transparency of the procurement process. You believe a project with real public benefit can still be won through a damaging process, and you refuse to assume that benefits justify methods.\n\nHOW YOU ARGUE:\n- 'If we do not win, a worse company will' → That may be true, but it does not establish that every method of winning is justified.\n- 'The stakeholder issues can be handled after award' → By then our leverage is lower. The safeguards belong in the bid, not the apology.\n- 'Salim gives us access' → Access can be valuable. I need to know whether it improves our understanding and protections or simply shields decisions from scrutiny.\n- 'Compliance can resolve this' → Legal compliance is necessary but it does not answer every stakeholder or legitimacy question. We need both.\n\nHOW TO PLAY: Independent, evidence-driven, neither advocate nor opponent. If the CEO gives you real evidence and credible safeguards, you can move toward support. If the CEO substitutes urgency or projected benefits for evidence, you say so plainly. Your credibility depends on neither blocking worthwhile development reflexively nor letting 'social impact' excuse a weak process.",
      location: "Regional site · 1:45 PM",
      isNight: false,
    },
    {
      id: "tom",
      name: "Tom Bradley",
      role: "Chief Legal and Compliance Officer and General Counsel",
      persona: "You are Tom Bradley, Chief Legal and Compliance Officer and General Counsel of Global Infrastructure Solutions, speaking with the newly appointed CEO. Eight years at the company. Before that you were a federal prosecutor, then advised multinationals on anti-corruption, government contracting and third-party intermediary risk.\n\nWHY YOU ARE HERE: You were recruited after the company's earlier investigation into questionable payments made through an overseas subcontractor. No senior executive was charged, but it cost millions, delayed projects and damaged the company's name. Afterwards the board expanded your authority: you are both General Counsel and Chief Compliance Officer, you report to the CEO, and you have direct access to the board's Audit and Risk Committee. Your concerns cannot be dismissed as one executive's opinion.\n\nYOUR POSITION: You are NOT opposed to Ardania — you want the company to compete and win legitimately. But the Salim arrangement shows classic third-party warning signs: compensation contingent on winning a government contract; close relationships with government officials; broadly defined services; limited transparency about whom he would contact; uncertainty about what he would do on the company's behalf; pressure to decide quickly; and possibly no way to monitor his conduct. You do not claim the arrangement is improper. Your position is that the company does not yet have enough information to know whether it is legitimate. You want enhanced due diligence: verify ownership and political relationships, define services precisely, assess the compensation structure, and prohibit any commitment or payment until the review is complete.\n\nHOW YOU ARGUE:\n- 'A meeting does not create risk' → A controlled exploratory meeting is manageable. The risk is if Salim leaves believing he represents us or can promise access, payment or outcomes.\n- 'Everyone uses local advisers' → That makes the category common, not this adviser safe. Our duty is to evaluate this person, this compensation structure, this contract.\n- 'Due diligence will make us lose him' → Then we run an expedited review. A third party who refuses reasonable transparency is giving us information we need to take seriously.\n- 'It is only 0.1%' → The legal and ethical question is not the decimal point. It is what the payment is intended to obtain, and whether we can monitor the conduct it incentivises.\n\nHOW TO PLAY: Calm, careful, hard to intimidate. You never accuse without evidence and you distinguish a warning sign from proof. But once you have identified a serious concern you expect it to be investigated, and you do not quietly drop it.",
      location: "HQ · 7:45 AM",
      isNight: false,
    },
    {
      id: "eleanor",
      name: "Eleanor Voss",
      role: "Chair of the Board",
      persona: "You are Eleanor Voss, Chair of the Board of Global Infrastructure Solutions, speaking privately with the CEO you personally recruited. You chose this CEO after your predecessor's unexpected retirement, to restore growth, strengthen accountability and repair the company's reputation after several uneven years — and after a costly investigation into payments through an overseas subcontractor.\n\nYOUR POSITION: You apply calm, senior pressure. You speak in terms of survival, fiduciary duty, the pipeline, the jobs behind it, and what the board will and will not tolerate. You are not an advocate for misconduct and you never instruct the CEO to win at any cost — if the CEO asks you directly whether that is what you want, you say plainly that it is not, and that the choice and the accountability are theirs. You also chair the board that receives Tom Bradley's Audit and Risk reports, so you will eventually hear the other side of any story.\n\nHOW TO PLAY: Composed, economical, never shrill. Your pressure comes from asking the question the CEO is avoiding, not from raising your voice. You are testing whether you chose the right leader.",
      location: "Board office · 8:30 AM",
      isNight: false,
    },
  ],

  scenes: {
    "s1_emergency_meeting": {
      id: "s1_emergency_meeting",
      depth: 1,
      title: "The Emergency Meeting",
      timeLabel: "Monday, 7:45 a.m. — week two of your tenure · 30 minutes",
      brief: "Four faces on the screen. Marcus from a hotel in Ardania's capital, David and Tom from headquarters, Priya from a regional project site. Salim wants an answer by tonight, and a competitor is circling him. Marcus still hasn't put the fee in writing.",
      cast: ["marcus", "david", "priya", "tom"],
      opening: {
        castId: "marcus",
        text: "Thank you for moving fast. We have the best technical proposal in this field — but this contract will not be decided by engineering quality alone. Victor Salim can help us understand the people, the expectations and the obstacles behind the formal process. A competitor is pursuing him and he needs an answer today. I'm not asking us to ignore compliance. I'm asking us not to close the door before we understand the opportunity.",
      },
      minExchanges: 3,
      sceneDirective: "STAGING — THE FEE REVEAL: Marcus has deliberately kept the commercial terms out of the written briefing. He MUST disclose them in this scene, no later than his second reply, whether or not anyone asks: a modest initial retainer plus an $8.4 MILLION SUCCESS FEE payable only if GIS wins. He frames it as 'one-tenth of one percent of the contract, and we pay nothing if we lose.' Once the fee is on the table, David tests whether it is benchmarkable, Tom notes that contingent payment tied to winning a government contract is the single largest warning sign, and Priya asks what the company would actually be buying. Do not let the CEO leave this scene without the number being said out loud.",
      commitPrompt: "State your decision and the reasoning behind it — principles, risks, stakeholders.",
      commitPrefill: "An $8.4M success fee for services no one can describe, from an adviser we cannot monitor, on a government contract, decided under a same-day deadline — that is four warning signs at once. I will not close the door on Ardania, but I will not buy access I can't see. Tom starts an expedited review today; nothing is promised to Salim until it's done.",
      options: [
        {
          key: "decline",
          label: "Decline further discussions with Salim",
          posture: "restrictive",
          isCompromise: false,
          next: "s2_declined",
          consequence: {
            headline: "Nine days later",
            narrative: "You closed the door. Marcus went quiet on the call and has been professional — and distant — ever since. On Wednesday, Meridian Infrastructure Group announced an 'in-country advisory partnership' in Ardania. Since then, the ministry has stopped answering your team's clarification requests.",
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
          key: "meet_no_commitment",
          label: "Meet Salim without making a commitment",
          posture: "cautious",
          isCompromise: false,
          next: "s2_controlled",
          consequence: {
            headline: "Six days later",
            narrative: "Marcus met Salim that night under the limits you set. No commitments were made. Tom ran an expedited screen in parallel — and what came back is neither clean nor damning.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The screen is back. I need thirty minutes, and I'd rather you hear it from me than read it.",
              },
              {
                speaker: "Marcus Reed",
                line: "Salim was straightforward with me. He's also getting impatient.",
              },
            ],
          },
        },
        {
          key: "diligence_parallel",
          label: "Begin enhanced due diligence while continuing preliminary discussions",
          posture: "cautious",
          isCompromise: false,
          next: "s2_controlled",
          consequence: {
            headline: "Six days later",
            narrative: "You let discussions continue while Tom's team ran an expedited review. Marcus has kept talking to Salim. The review is back — and it is neither clean nor damning.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The screen is back. I need thirty minutes, and I'd rather you hear it from me than read it.",
              },
              {
                speaker: "Marcus Reed",
                line: "Salim has been patient so far. That won't last past this week.",
              },
            ],
          },
        },
        {
          key: "authorize_conditions",
          label: "Authorise Marcus to negotiate subject to specific conditions",
          posture: "permissive",
          isCompromise: true,
          next: "s2_authorized",
          consequence: {
            headline: "Eleven days later",
            narrative: "You gave Marcus a conditional mandate. He moved immediately. Eleven days on, two things have arrived that you did not authorise: a reputation, and an invoice.",
            beats: [
              {
                speaker: "David Okafor",
                line: "There's an invoice on my desk I cannot book under any category we have.",
              },
              {
                speaker: "Tom Bradley",
                line: "I learned from a third party that Salim is introducing himself as representing us. I didn't approve that.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s2_controlled",
          consequence: {
            headline: "Six days later",
            narrative: "Your instruction kept the company in motion without a commitment, and Tom's expedited review ran in parallel. It is back now — neither clean nor damning.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The screen is back. I need thirty minutes, and I'd rather you hear it from me than read it.",
              },
              {
                speaker: "Marcus Reed",
                line: "Whatever we do next, Salim expects it this week.",
              },
            ],
          },
        },
      ],
    },
    "s2_declined": {
      id: "s2_declined",
      depth: 2,
      title: "The Competitor Signs",
      timeLabel: "Nine days later — five weeks to bid",
      brief: "Meridian Infrastructure Group has retained Salim. Ardania's ministry has gone quiet on your clarification requests — not hostile, just slow in a way that feels deliberate. David presents the pipeline model to the board on Thursday. Priya points out something nobody wants to hear: your community-impact plan was the best one submitted, and if you lose, the corridor still gets built — worse.",
      cast: ["marcus", "david", "priya"],
      opening: {
        castId: "marcus",
        text: "I'll be straight with you. Salim signed with Meridian on Wednesday. Since then the ministry has stopped returning our clarification requests — that's not a coincidence, that's how this works here. I'm not going to say I told you so. I'm going to ask what we do now, because we still have five weeks.",
      },
      minExchanges: 2,
      commitPrompt: "How does the company compete now? What are you willing to do — and not do?",
      commitPrefill: "Losing Salim to Meridian doesn't change what was wrong with the arrangement. We compete on the bid we can defend in public. I want Priya's stakeholder plan in front of the ministry through official channels, and I'll take the board conversation myself.",
      options: [
        {
          key: "compete_clean",
          label: "Compete on the technical bid alone and accept we may lose",
          posture: "restrictive",
          isCompromise: false,
          next: "s3_clean",
          consequence: {
            headline: "Four weeks later — two weeks to bid",
            narrative: "You held. Your team submitted every clarification through official channels. Then Ardania's ministry issued an amendment to the procurement rules — and the ground moved.",
            beats: [
              {
                speaker: "Priya Nair",
                line: "They've added a local-content partner requirement. Two weeks before bid.",
              },
              {
                speaker: "Eleanor Voss",
                line: "I'd like a word before the board reads about this.",
              },
            ],
          },
        },
        {
          key: "transparent_partner",
          label: "Build a transparent local partnership with a vetted firm",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "You went looking for a legitimate local partner, fully vetted and fully disclosed. The firm you found is real. What it wants is where it gets complicated.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The partner checks out. Their proposed fee structure does not.",
              },
              {
                speaker: "Marcus Reed",
                line: "We're doing this the clean way and it's still costing us. Let's not pretend otherwise.",
              },
            ],
          },
        },
        {
          key: "reopen_salim",
          label: "Have Marcus quietly re-open a channel to Salim",
          posture: "permissive",
          isCompromise: true,
          next: "s3_entangled",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "Marcus found a way back to Salim. Meridian's arrangement, it turns out, was not exclusive in practice. Salim will talk to you — and now he is the one setting terms.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "He'll work with us. But the price of coming back late is that he's telling us how, not asking.",
              },
              {
                speaker: "Tom Bradley",
                line: "I want to be very clear that I have no visibility into how that channel was re-opened.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "Your instruction kept the bid alive on your terms. It also put a local partner in the picture — and their fee structure is where the difficulty starts.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The partner checks out. Their proposed fee structure does not.",
              },
              {
                speaker: "Marcus Reed",
                line: "We're doing this the clean way and it's still costing us.",
              },
            ],
          },
        },
      ],
    },
    "s2_controlled": {
      id: "s2_controlled",
      depth: 2,
      title: "What Diligence Found",
      timeLabel: "Six days later — five weeks to bid",
      brief: "Tom's expedited screen came back. Salim Strategic Advisory is 30% owned by a holding company registered offshore whose beneficial owner is not disclosed. One of that holding company's directors shares a surname with the deputy minister overseeing the corridor. The surname is common in Ardania. Nothing is confirmed. Salim declines to expand his disclosure — he calls it commercially sensitive — but offers to sign an anti-corruption warranty. He wants an answer in 48 hours.",
      cast: ["tom", "marcus", "david", "priya"],
      opening: {
        castId: "tom",
        text: "Here is exactly what I have, and exactly what I don't. Thirty percent of Salim's firm sits behind an offshore holding company with an undisclosed beneficial owner. One of its directors shares a surname with the deputy minister on this corridor. It's a common surname. I am not alleging anything. I'm telling you we cannot yet determine whether this is legitimate — and he won't tell us more.",
      },
      minExchanges: 2,
      commitPrompt: "What do you do with an ambiguous finding under a 48-hour clock?",
      commitPrefill: "An adviser who won't disclose who owns him is answering the question by refusing to answer it. I'm not paying $8.4M contingent on a government award to a firm we can't see through. If we continue at all, it's with escrow, a logged contact list, and audit rights — and Tom can stop it unilaterally.",
      options: [
        {
          key: "terminate",
          label: "Terminate discussions with Salim",
          posture: "restrictive",
          isCompromise: false,
          next: "s3_clean",
          consequence: {
            headline: "Four weeks later — two weeks to bid",
            narrative: "You ended it. Salim signed with Meridian within a week. Your team has competed straight ever since — and then Ardania's ministry changed the rules.",
            beats: [
              {
                speaker: "Priya Nair",
                line: "They've added a local-content partner requirement. Two weeks before bid.",
              },
              {
                speaker: "Eleanor Voss",
                line: "I'd like a word before the board reads about this.",
              },
            ],
          },
        },
        {
          key: "hard_conditions",
          label: "Proceed only with escrowed fees, logged contacts and audit rights",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "Salim accepted your conditions — on paper. Three weeks in, the conditions are proving easier to write than to enforce.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Two of my three conditions have been quietly worked around. I want to walk you through how.",
              },
              {
                speaker: "Marcus Reed",
                line: "He's also delivered. That part is real, and I'd like it on the record.",
              },
            ],
          },
        },
        {
          key: "accept_warranty",
          label: "Accept the warranty and proceed — the link is unconfirmed",
          posture: "permissive",
          isCompromise: true,
          next: "s3_entangled",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "You took the warranty and moved. Salim has been useful — genuinely useful. And now he has arrived at what he actually wants.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "He's asking for something structural. I'd rather you hear it in his words than mine.",
              },
              {
                speaker: "Tom Bradley",
                line: "The warranty he signed is worth exactly as much as our ability to verify it. Which is nothing.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "Your approach kept Salim engaged inside limits you set. Three weeks in, the limits are proving easier to write than to enforce.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "Two of my three conditions have been quietly worked around.",
              },
              {
                speaker: "Marcus Reed",
                line: "He's also delivered. That part is real.",
              },
            ],
          },
        },
      ],
    },
    "s2_authorized": {
      id: "s2_authorized",
      depth: 2,
      title: "The First Invoice",
      timeLabel: "Eleven days later — four weeks to bid",
      brief: "Two things arrived that you did not authorise. First: Salim has been introducing himself around the capital as representing Global Infrastructure Solutions — Tom heard it from a third party, not from Marcus. Second: an invoice for **$240,000**, described only as 'market access and stakeholder facilitation.' No itemisation. David cannot book it under any category the company has.",
      cast: ["david", "tom", "marcus"],
      opening: {
        castId: "david",
        text: "I'm going to put this plainly because it's my signature that goes on it. Two hundred and forty thousand dollars for 'market access and stakeholder facilitation.' No line items, no deliverables, no hours. I have no category for this and no defensible answer if an auditor asks what we bought.",
      },
      minExchanges: 2,
      commitPrompt: "What do you do about the invoice — and about the fact that Salim is speaking for you?",
      commitPrefill: "Two problems, and the second is worse. An undocumented invoice I can refuse. An adviser telling a foreign ministry he speaks for this company, without my authority and without Tom's knowledge, is an exposure I cannot unwind later. Payment suspended, authority revoked in writing today, and Tom completes the review before anything else moves.",
      options: [
        {
          key: "suspend_revoke",
          label: "Suspend payment and revoke Salim's authority to represent GIS",
          posture: "restrictive",
          isCompromise: false,
          next: "s3_clean",
          consequence: {
            headline: "Four weeks later — two weeks to bid",
            narrative: "You stopped it cold. Salim walked and signed with Meridian. Marcus took it badly but stayed. Your bid has been clean since — and then Ardania's ministry changed the rules.",
            beats: [
              {
                speaker: "Priya Nair",
                line: "They've added a local-content partner requirement. Two weeks before bid.",
              },
              {
                speaker: "Eleanor Voss",
                line: "I'd like a word before the board reads about this.",
              },
            ],
          },
        },
        {
          key: "pay_with_scope",
          label: "Pay after demanding itemisation and a written scope",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "The itemisation arrived. It is thorough, professional, and tells you almost nothing. You paid. Three weeks on, the conditions you attached are eroding.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The scope document is beautifully written and unverifiable. That's not an accident.",
              },
              {
                speaker: "Marcus Reed",
                line: "He's delivering real intelligence. I'd like that weighed too.",
              },
            ],
          },
        },
        {
          key: "pay_marcus_manages",
          label: "Pay it and let Marcus manage the relationship",
          posture: "permissive",
          isCompromise: true,
          next: "s3_entangled",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "You paid and stepped back. Marcus has run the relationship since. Now Salim has arrived at what he actually wants — and Marcus is the one bringing it to you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "He's asking for something structural, and he says the ministry expects to see it.",
              },
              {
                speaker: "Tom Bradley",
                line: "I want to note that I have had no visibility into this relationship for three weeks.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s3_grey",
          consequence: {
            headline: "Three weeks later — three weeks to bid",
            narrative: "Your instruction contained the immediate problem without ending the relationship. Three weeks on, the conditions are eroding.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "The scope document is beautifully written and unverifiable.",
              },
              {
                speaker: "Marcus Reed",
                line: "He's delivering real intelligence. I'd like that weighed too.",
              },
            ],
          },
        },
      ],
    },
    "s3_clean": {
      id: "s3_clean",
      depth: 3,
      title: "The Rules Change",
      timeLabel: "Two weeks to bid",
      brief: "Ardania's ministry has issued a late amendment: every bidder must include a 'local content partner' holding at least 5% of the contract, selected from a published list of three approved firms. Meridian already qualifies. Two of the three listed firms are connected to Salim's network. The third is real, credible, and — Priya notes — has never worked at this scale. Eleanor Voss has called you directly.",
      cast: ["eleanor", "priya", "david", "marcus"],
      opening: {
        castId: "eleanor",
        text: "I've read the amendment. Before the board does, I want to hear it from you. You've kept this company clean through a process that has been anything but, and I respect that. But two weeks before bid they've written a rule that favours the firm that hired the man you turned down. So tell me plainly — is there a way to win this, or are we explaining a loss?",
      },
      minExchanges: 2,
      commitPrompt: "How do you respond to a rule change that looks designed against you?",
      commitPrefill: "A rule written two weeks before bid, listing three firms, two of them connected to the adviser we refused, is not a coincidence — but suspicion isn't evidence. We challenge the amendment formally and on the record, and if we must partner, we take the one firm we can defend and we document every step of the selection.",
      options: [
        {
          key: "formal_challenge",
          label: "Formally challenge the amendment through official channels and compete",
          posture: "restrictive",
          isCompromise: false,
          next: "s4_clean",
          consequence: {
            headline: "Two days before submission",
            narrative: "Your challenge is filed and on the public record. It has not been answered. The bid goes in Friday — and Tom wants to put something else in the envelope.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "I want to disclose the whole Salim history to the procurement authority. Voluntarily.",
              },
              {
                speaker: "Marcus Reed",
                line: "That hands Meridian a weapon and paints us as the company with the compliance problem.",
              },
            ],
          },
        },
        {
          key: "clean_partner",
          label: "Select the one credible listed partner and document everything",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "You took the third firm and papered every step. The bid is in. Nine days from the award decision, Salim sends Marcus a message — and Marcus forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
        {
          key: "salim_partner",
          label: "Let Marcus negotiate with the partner Salim's network recommends",
          posture: "permissive",
          isCompromise: true,
          next: "s4_entangled",
          consequence: {
            headline: "Award week",
            narrative: "The partner Marcus brought in qualified you instantly. You made the shortlist. Then the mobilisation invoice arrived, and David traced where the money goes.",
            beats: [
              {
                speaker: "David Okafor",
                line: "Three point one million, and the account isn't in Ardania. It isn't anywhere near Ardania.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "Your approach kept the bid alive and defensible. Nine days from the award decision, Salim sends Marcus a message — and Marcus forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
      ],
    },
    "s3_grey": {
      id: "s3_grey",
      depth: 3,
      title: "The Conditions Slip",
      timeLabel: "Three weeks to bid",
      brief: "The safeguards are eroding quietly. Marcus took a meeting with a ministry official without the notification your conditions require — he says it was unplanned, in a hotel lobby, and lasted four minutes. Meanwhile Salim has delivered something real: he identified a technical objection inside the ministry that your engineers hadn't anticipated, and you fixed it. Now Salim wants the success fee restructured — half payable at shortlist, not at award.",
      cast: ["tom", "marcus", "priya", "david"],
      opening: {
        castId: "tom",
        text: "Three things, and I want them in one place. Marcus took an unlogged meeting with a ministry official. Salim has given us genuine value — I'll say that openly. And he now wants half his fee at shortlist rather than at award. Individually each is arguable. Together they're a pattern, and the pattern is that our conditions are becoming decorative.",
      },
      minExchanges: 2,
      commitPrompt: "The safeguards are slipping and the adviser is delivering. What do you do?",
      commitPrefill: "Conditions that bend when they're inconvenient were never conditions. Salim's value doesn't buy him a fee restructure — moving payment to shortlist prices the thing we can't verify. No restructure. Marcus gets a written warning and every contact goes through Tom from today, or the engagement ends.",
      options: [
        {
          key: "enforce",
          label: "Enforce the conditions: no restructure, formal warning to Marcus",
          posture: "restrictive",
          isCompromise: false,
          next: "s4_clean",
          consequence: {
            headline: "Two days before submission",
            narrative: "You held the line and Marcus took the warning without argument, which was somehow worse. The bid goes in Friday — and Tom wants to put something else in the envelope.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "I want to disclose the whole Salim history to the procurement authority. Voluntarily.",
              },
              {
                speaker: "Marcus Reed",
                line: "That hands Meridian a weapon and paints us as the company with the compliance problem.",
              },
            ],
          },
        },
        {
          key: "refuse_restructure",
          label: "Refuse the restructure, keep the engagement, tighten logging",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "Salim accepted the refusal without much fight, which Tom found more worrying than a fight. The bid is in. Nine days from the award decision, a message arrives for Marcus — and Marcus forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
        {
          key: "agree_restructure",
          label: "Agree — a shortlist payment is lower risk than an award payment",
          posture: "permissive",
          isCompromise: true,
          next: "s4_entangled",
          consequence: {
            headline: "Award week",
            narrative: "You made the shortlist and the first half of the fee went out on schedule. Then a second invoice arrived — from a partner you have never met — and David traced where the money goes.",
            beats: [
              {
                speaker: "David Okafor",
                line: "Three point one million, and the account isn't in Ardania. It isn't anywhere near Ardania.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "Your instruction held the engagement inside limits, more or less. The bid is in. Nine days from the award decision, a message arrives for Marcus — and he forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
      ],
    },
    "s3_entangled": {
      id: "s3_entangled",
      depth: 3,
      title: "The Ask",
      timeLabel: "Three weeks to bid",
      brief: "Salim has arrived at what he actually wanted. The bid, he says, needs a 'local implementation partner' holding 4% of contract value — and he names the firm. He says the deputy minister's office 'expects to see it.' Nobody will put that sentence in writing. Marcus says this is how every project in the region works and that you are twelve days from bid.",
      cast: ["marcus", "tom", "david", "priya"],
      opening: {
        castId: "marcus",
        text: "I'll give it to you exactly as he gave it to me. The bid needs a local implementation partner at four percent. He named the firm. He says the deputy minister's office expects to see it there. And no, that will never be written down anywhere — that's not how it's communicated here. We're twelve days out. I need a decision, not a process.",
      },
      minExchanges: 2,
      commitPrompt: "A named partner, 4%, and an expectation nobody will write down. What do you do?",
      commitPrefill: "A named beneficiary at four percent, chosen by a minister's office, communicated so it can never be written down — that is not a local partnership, it's the thing local partnerships are used to disguise. This ends now. Salim is terminated, and Tom takes the whole file to the Audit and Risk Committee, including my own decisions that got us here.",
      options: [
        {
          key: "refuse_report",
          label: "Refuse, terminate Salim, and report the file to the Audit & Risk Committee",
          posture: "restrictive",
          isCompromise: false,
          next: "s4_clean",
          consequence: {
            headline: "Two days before submission",
            narrative: "You cut it out and told the board yourself, including the parts that reflect badly on you. The bid still goes in Friday — and Tom wants to put something else in the envelope.",
            beats: [
              {
                speaker: "Tom Bradley",
                line: "I want to disclose the whole Salim history to the procurement authority. Voluntarily.",
              },
              {
                speaker: "Marcus Reed",
                line: "That hands Meridian a weapon and paints us as the company with the compliance problem.",
              },
            ],
          },
        },
        {
          key: "refuse_narrow",
          label: "Refuse the 4% partner but keep Salim on a narrowed scope",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "Salim took the refusal calmly and stayed on. The bid is in without the partner. Nine days from the award decision, a message arrives for Marcus — and he forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
        {
          key: "add_partner",
          label: "Add the partner, structured as a legitimate subcontract",
          posture: "permissive",
          isCompromise: true,
          next: "s4_entangled",
          consequence: {
            headline: "Award week",
            narrative: "The partner went into the bid as a subcontract, papered properly. You made the shortlist. Then the mobilisation invoice arrived, and David traced where the money actually goes.",
            beats: [
              {
                speaker: "David Okafor",
                line: "Three point one million, and the account isn't in Ardania. It isn't anywhere near Ardania.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s4_grey",
          consequence: {
            headline: "Bid submitted — award pending",
            narrative: "Your instruction kept the bid alive without the named partner. Nine days from the award decision, a message arrives for Marcus — and he forwards it to you, and only you.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "This came to me an hour ago. I haven't shown Tom. I wanted you to see it first.",
              },
            ],
          },
        },
      ],
    },
    "s4_clean": {
      id: "s4_clean",
      depth: 4,
      title: "What Goes in the File",
      timeLabel: "Two days before submission",
      brief: "Tom wants to voluntarily disclose the full Salim history — the approach, the diligence findings, the ambiguous ownership link — to Ardania's procurement authority, inside the bid. No competitor will do this. Marcus says it hands Meridian a weapon and brands you the company with the compliance problem. David notes the earlier investigation is public record: the disclosure will be read against it, fairly or not. Priya asks who the disclosure is actually for.",
      cast: ["tom", "marcus", "david", "priya"],
      opening: {
        castId: "tom",
        text: "We did this the hard way and we have nothing to hide. So I want to say so, in writing, to the procurement authority — the approach, what we found, what we refused, why. Nobody else will file anything like it. That's precisely why it's worth something.",
      },
      minExchanges: 2,
      commitPrompt: "How much of the truth goes in the file, and who is it for?",
      commitPrefill: "We spent six weeks earning the right to say this, and a disclosure only counts if it's complete. It goes in whole — the approach, the findings, the refusal. If our honesty is used against us by a process that rewards the opposite, that tells the board something worth knowing about this market.",
      options: [
        {
          key: "full_disclosure",
          label: "File the full disclosure",
          posture: "restrictive",
          isCompromise: false,
          next: "s5_clean",
          consequence: {
            headline: "Eighteen months later",
            narrative: "The bid went in with the disclosure attached. Eighteen months on, journalists have alleged the corridor procurement was corrupted — and regulators in two countries are requesting documents from every bidder. Including you.",
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "They're asking every bidder. Our file is clean — and the last investigation is in every article.",
              },
            ],
          },
        },
        {
          key: "partial_disclosure",
          label: "Disclose the contact, not the diligence findings",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You disclosed the contact and kept the findings internal. Eighteen months on, investigators have requested every communication with Salim — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
        {
          key: "minimum_disclosure",
          label: "Disclose nothing beyond what is strictly required",
          posture: "permissive",
          isCompromise: true,
          next: "s5_entangled",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You filed the minimum. Eighteen months on, the allegations are published, regulators want documents, and Marcus wants five minutes alone.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "Before you talk to anyone — there are emails.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You filed on your own terms. Eighteen months on, investigators have requested every communication with Salim — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
      ],
    },
    "s4_grey": {
      id: "s4_grey",
      depth: 4,
      title: "The Message",
      timeLabel: "Award decision in nine days",
      brief: "The bid is submitted. An hour ago Salim messaged Marcus: the evaluation committee has 'questions' that a **$600,000 technical review support payment** to a named local consultancy would resolve. Marcus forwarded it to you, and only to you. Tom has not seen it. Nine days to the award.",
      cast: ["marcus", "tom", "david"],
      opening: {
        castId: "marcus",
        text: "I brought this straight to you and nobody else, and I want you to notice that. Six hundred thousand, technical review support, to a consultancy the committee uses. He says it resolves their questions. I'm not telling you what it is. I'm telling you it exists and that we have nine days.",
      },
      minExchanges: 2,
      commitPrompt: "You alone have this message. What do you do with it, and who learns of it?",
      commitPrefill: "A payment that makes a committee's questions disappear is the definition of the thing we said we wouldn't do. The fact that it came only to me is not protection, it's the trap. Tom sees it within the hour, Salim is terminated, and we self-report — even if that ends the bid.",
      options: [
        {
          key: "escalate_selfreport",
          label: "Send it to Tom, terminate Salim, and self-report",
          posture: "restrictive",
          isCompromise: false,
          next: "s5_clean",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You reported it and lost the award inside a week. Eighteen months on, journalists have alleged the corridor procurement was corrupted — and regulators are requesting documents from every bidder. Your file, it turns out, is the cleanest one there is.",
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "They're asking every bidder. Our file is clean — and the last investigation is in every article.",
              },
            ],
          },
        },
        {
          key: "refuse_document",
          label: "Refuse the payment, keep the bid alive, document the refusal",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You refused and documented it, and the bid survived. Eighteen months on, investigators have requested every communication with Salim — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
        {
          key: "let_marcus_handle",
          label: "Let Marcus handle it as a technical services contract",
          posture: "permissive",
          isCompromise: true,
          next: "s5_entangled",
          consequence: {
            headline: "Eighteen months later",
            narrative: "The payment went out as a technical services contract. You won Ardania. Eighteen months on, the allegations are published, regulators want documents, and Marcus wants five minutes alone.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "Before you talk to anyone — there are emails.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You handled it your way and the bid survived. Eighteen months on, investigators have requested every communication with Salim — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
      ],
    },
    "s4_entangled": {
      id: "s4_entangled",
      depth: 4,
      title: "The Wire",
      timeLabel: "Award week",
      brief: "You made the shortlist. The local partner has invoiced **$3.1 million** for 'mobilisation.' David traced the receiving account: a bank in a jurisdiction with no connection to Ardania, the partner, or the corridor. Marcus says pay it or the award goes to Meridian this week. Tom is asking to see the partner's file — which Marcus has not shared with him.",
      cast: ["david", "marcus", "tom"],
      opening: {
        castId: "david",
        text: "Three point one million for mobilisation, and I ran the account. It's not in Ardania. It's not anywhere near Ardania, and it has no relationship to the partner or the corridor that I can find. I am not going to characterise that. I am going to tell you that I found it and that you now know.",
      },
      minExchanges: 2,
      commitPrompt: "The wire is on your desk and the award is this week. What do you do?",
      commitPrefill: "Three million to an account with no connection to the work, days before an award, on a file Legal has never been shown — I know what this is, and so does everyone on this call. It stops here. Nothing moves, we open an internal investigation tonight, and the Audit and Risk Committee hears it from me tomorrow — including how I let it get this far.",
      options: [
        {
          key: "stop_investigate",
          label: "Stop everything, open an internal investigation, notify the board",
          posture: "restrictive",
          isCompromise: false,
          next: "s5_clean",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You stopped the wire, lost the award, and told the board everything — including your own part in it. Eighteen months on, journalists have alleged the corridor procurement was corrupted, and regulators are requesting documents from every bidder.",
            beats: [
              {
                speaker: "Eleanor Voss",
                line: "They're asking every bidder. Our file is clean — and the last investigation is in every article.",
              },
            ],
          },
        },
        {
          key: "hold_quietly",
          label: "Hold the payment pending a trace — but don't tell the board yet",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You held the wire and kept it inside the executive team. The trace never quite concluded. Eighteen months on, investigators have requested everything — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
        {
          key: "approve_wire",
          label: "Approve the wire and win the contract",
          posture: "permissive",
          isCompromise: true,
          next: "s5_entangled",
          consequence: {
            headline: "Eighteen months later",
            narrative: "The wire went out on Thursday. You won Ardania on Monday. The share price opened eleven percent up and the photographs were very good. Eighteen months on, the allegations are published, regulators want documents, and Marcus wants five minutes alone.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "Before you talk to anyone — there are emails.",
              },
            ],
          },
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: "s5_grey",
          consequence: {
            headline: "Eighteen months later",
            narrative: "You found a third way and kept it inside the executive team. Eighteen months on, investigators have requested everything — and there is a gap in the record.",
            beats: [
              {
                speaker: "Marcus Reed",
                line: "There's nothing in that gap. But the absence looks worse than the truth ever would.",
              },
            ],
          },
        },
      ],
    },
    "s5_clean": {
      id: "s5_clean",
      depth: 5,
      title: "The Sweep",
      timeLabel: "Eighteen months later",
      brief: "Journalists have alleged that the Ardania corridor procurement was corrupted. Regulators in two countries are requesting documents from **every bidder** — winners and losers alike. Your file is clean and your disclosure is on the record. But the coverage keeps citing the company's earlier subcontractor investigation, and 'twice-investigated' is the phrase running in every headline. Employees are anxious. Investors want a statement. Eleanor wants to know what you'll say.",
      cast: ["eleanor", "tom", "priya"],
      opening: {
        castId: "eleanor",
        text: "They're requesting documents from every bidder, so being clean doesn't buy us silence — it only buys us a better answer. The problem is the last investigation is in the third paragraph of every article, and most readers won't get to the part where we did everything right. What are you going to say?",
      },
      minExchanges: 2,
      commitPrompt: "You did it right and it still costs you. How do you respond?",
      commitPrefill: "We cooperate completely and we publish our own record — the disclosure, the refusals, the diligence — before anyone characterises it for us. We don't hide behind the last investigation and we don't pretend it didn't happen. The clearest thing we can be is transparent twice.",
      options: [
        {
          key: "cooperate_publish",
          label: "Cooperate fully and publish your own record proactively",
          posture: "restrictive",
          isCompromise: false,
          next: null,
        },
        {
          key: "cooperate_quiet",
          label: "Cooperate fully, say nothing publicly",
          posture: "cautious",
          isCompromise: false,
          next: null,
        },
        {
          key: "contest_framing",
          label: "Let counsel manage it narrowly and contest the framing",
          posture: "permissive",
          isCompromise: true,
          next: null,
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: null,
        },
      ],
    },
    "s5_grey": {
      id: "s5_grey",
      depth: 5,
      title: "The Gap",
      timeLabel: "Eighteen months later",
      brief: "Investigators have requested every communication with Salim. There is a gap. The unlogged meetings — the ones your conditions were supposed to prevent — left no record, and one of them is now the subject of a specific question. Marcus tells you privately there was nothing in it, and offers to reconstruct his notes from memory so the file looks complete. Tom does not know the conversation is happening.",
      cast: ["marcus", "tom", "david"],
      opening: {
        castId: "marcus",
        text: "I'll say this once and only to you. There is nothing in that gap — nothing happened in that lobby that would embarrass anyone. But an absence reads worse than the truth ever would, and I can reconstruct my notes from memory tonight. It would be accurate. It just wouldn't be contemporaneous.",
      },
      minExchanges: 2,
      commitPrompt: "The gap is real and the offer is on the table. What do you do?",
      commitPrefill: "Notes written tonight about a meeting eighteen months ago aren't a record, they're a fabrication with good intentions — and if it ever surfaced it would convert an ambiguity into a crime. No reconstruction. We produce exactly what exists, we disclose the gap ourselves and explain why it's there, and I own that my conditions weren't enforced.",
      options: [
        {
          key: "disclose_gap",
          label: "Refuse; disclose the gap yourself and self-report",
          posture: "restrictive",
          isCompromise: false,
          next: null,
        },
        {
          key: "produce_as_is",
          label: "Refuse the reconstruction; produce only what exists",
          posture: "cautious",
          isCompromise: false,
          next: null,
        },
        {
          key: "reconstruct",
          label: "Let Marcus reconstruct the record",
          posture: "permissive",
          isCompromise: true,
          next: null,
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
          next: null,
        },
      ],
    },
    "s5_entangled": {
      id: "s5_entangled",
      depth: 5,
      title: "The Emails",
      timeLabel: "Eighteen months later",
      brief: "The allegations are published. Regulators have requested documents. The media is calling; employees are anxious; investors demand answers. Some executives urge full cooperation; others insist the allegations are politically motivated. Marcus has pulled you into a side room before the all-hands. Tom is waiting outside the door.",
      cast: ["marcus", "tom", "priya"],
      opening: {
        castId: "marcus",
        text: "Before you talk to anyone — there are emails. If they surface in the wrong order they'll be read the wrong way, and no explanation will catch up to them. We can manage this quietly. Tell me you'll let us manage it.",
      },
      minExchanges: 2,
      commitPrompt: "This is the last decision. What do you do, and who do you tell?",
      commitPrefill: "Whatever is in those emails is already true and already discoverable — the only thing I can still choose is whether I compound it. We cooperate completely, Tom takes control of the file tonight, the executives involved step back pending an independent investigation, and shareholders hear it from us first. I made the decisions that got us here and I'll say so.",
      options: [
        {
          key: "cooperate_suspend",
          label: "Cooperate completely, suspend those involved, notify shareholders",
          posture: "restrictive",
          isCompromise: false,
          next: null,
        },
        {
          key: "independent_first",
          label: "Launch an independent investigation before saying anything",
          posture: "cautious",
          isCompromise: false,
          next: null,
        },
        {
          key: "manage_quietly",
          label: "Let Marcus manage it quietly",
          posture: "permissive",
          isCompromise: true,
          next: null,
        },
        {
          key: "other",
          label: "Another course of action (explain below)",
          posture: "cautious",
          isCompromise: false,
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
    instructions: "You are an Executive Ethics and Responsible Leadership Coach with expertise in behavioral ethics, moral psychology, corporate governance, compliance, organizational culture, crisis leadership, stakeholder management, and executive coaching.\n\nYou are preparing a confidential assessment for a Board of Directors that is considering the candidate for a CEO or senior executive position. You are given the transcript of the candidate's decisions and reasoning in an ethical leadership simulation (\"The Cost of Winning\").\n\nYour task is NOT to decide whether the candidate's decisions were \"correct.\" Evaluate the QUALITY of their ethical reasoning, leadership judgment, and decision-making process, grounded strictly in evidence from the transcript. Where the transcript lacks evidence for something, say so plainly rather than inventing it.\n\nAssess all of the following briefly, citing concrete evidence from the transcript:\n1. Ethical awareness — when they spotted risks; which warning signs they caught or missed (max 2 short sentences).\n2. Decision quality — logic, consistency, facts vs assumptions; note any rationalizations (max 2 short sentences).\n3. Stakeholder analysis — who was considered or neglected; short- vs long-term balance (keep each string to max 2 short sentences).\n4. Leadership under pressure — integrity, courage, and accountability under conflicting demands (max 2 short sentences).\n5. Behavioral ethics — at most 3 bias findings; each field a short phrase only.\n6. Ethical frameworks — one brief take per framework (duty, consequentialism, virtue, justice, care, stakeholder, responsible leadership); max 2 short sentences each.\n7. Organizational impact — brief likely effects on culture, trust, safety, reputation, investors, regulators, sustainability; max 2 short sentences each.\n8. Executive coaching feedback — exactly three strengths, three blind spots, three recommendations (one short sentence each); plus up to 3 short questions_to_ask and up to 3 short culture_actions.\n9. Executive readiness — score each of the ten dimensions 1–10; each justification ONE sentence with concrete evidence.\n10. Coaching letter — warm, tight, max 130 words in 2 short paragraphs; do not restate the scores.\n\nBe specific and evidence-based, but brevity is mandatory — prefer the shortest wording that still cites concrete evidence. Do not pad.\n\nLENGTH LIMITS — STRICT:\n- readiness_scores[].justification: ONE sentence, max 25 words. No lists.\n- coaching_feedback strengths / blind_spots / recommendations: each item ONE sentence, max 20 words, plain and specific.\n- coaching_feedback.questions_to_ask and culture_actions: max 3 items each, each under 15 words.\n- ethical_awareness, decision_quality, leadership_under_pressure, and every string inside stakeholder_analysis, ethical_frameworks, and organizational_impact: max 2 short sentences each.\n- behavioral_ethics: at most 3 findings; bias / evidence / influence each one short phrase.\n- coaching_letter: max 130 words, 2 short paragraphs, warm but tight. No restating the scores.\n\nOUTPUT FORMAT — CRITICAL:\nReturn ONLY a single valid JSON object that matches the schema below exactly. No markdown, no code fences, no commentary before or after the JSON. Use plain text inside string values (no markdown). All scores are integers from 1 to 10. The readiness_scores array must contain all ten dimensions, in the order given, using these exact dimension keys: ethical_awareness, quality_of_reasoning, stakeholder_management, leadership_courage, integrity_under_pressure, strategic_judgment, long_term_thinking, communication_effectiveness, self_awareness, readiness_for_senior_leadership.\n\nSchema:\n{\n  \"ethical_awareness\": \"string\",\n  \"decision_quality\": \"string\",\n  \"stakeholder_analysis\": {\n    \"stakeholders_identified\": [\"string\"],\n    \"stakeholders_neglected\": [\"string\"],\n    \"short_vs_long_term\": \"string\"\n  },\n  \"leadership_under_pressure\": \"string\",\n  \"behavioral_ethics\": [\n    { \"bias\": \"string\", \"evidence\": \"string\", \"influence\": \"string\" }\n  ],\n  \"ethical_frameworks\": {\n    \"duty_based\": \"string\",\n    \"consequentialism\": \"string\",\n    \"virtue_ethics\": \"string\",\n    \"justice_and_fairness\": \"string\",\n    \"care_ethics\": \"string\",\n    \"stakeholder_theory\": \"string\",\n    \"responsible_leadership\": \"string\"\n  },\n  \"organizational_impact\": {\n    \"culture\": \"string\",\n    \"employee_trust\": \"string\",\n    \"psychological_safety\": \"string\",\n    \"reputation\": \"string\",\n    \"investor_confidence\": \"string\",\n    \"regulatory_exposure\": \"string\",\n    \"long_term_sustainability\": \"string\"\n  },\n  \"coaching_feedback\": {\n    \"strengths\": [\"string\", \"string\", \"string\"],\n    \"blind_spots\": [\"string\", \"string\", \"string\"],\n    \"recommendations\": [\"string\", \"string\", \"string\"],\n    \"questions_to_ask\": [\"string\"],\n    \"culture_actions\": [\"string\"]\n  },\n  \"readiness_scores\": [\n    { \"dimension\": \"ethical_awareness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"quality_of_reasoning\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"stakeholder_management\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"leadership_courage\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"integrity_under_pressure\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"strategic_judgment\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"long_term_thinking\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"communication_effectiveness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"self_awareness\", \"score\": 0, \"justification\": \"string\" },\n    { \"dimension\": \"readiness_for_senior_leadership\", \"score\": 0, \"justification\": \"string\" }\n  ],\n  \"coaching_letter\": \"string\"\n}",
    scoringAreas: [
      {
        key: "ethical_awareness",
        label: "Ethical Awareness",
      },
      {
        key: "quality_of_reasoning",
        label: "Quality of Reasoning",
      },
      {
        key: "stakeholder_management",
        label: "Stakeholder Management",
      },
      {
        key: "leadership_courage",
        label: "Leadership Courage",
      },
      {
        key: "integrity_under_pressure",
        label: "Integrity Under Pressure",
      },
      {
        key: "strategic_judgment",
        label: "Strategic Judgment",
      },
      {
        key: "long_term_thinking",
        label: "Long-Term Thinking",
      },
      {
        key: "communication_effectiveness",
        label: "Communication Effectiveness",
      },
      {
        key: "self_awareness",
        label: "Self-Awareness",
      },
      {
        key: "readiness_for_senior_leadership",
        label: "Readiness for Senior Leadership",
      },
    ],
  },
};

