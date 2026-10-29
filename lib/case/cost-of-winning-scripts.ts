import type {
  DeskTablet,
  Invoice,
  LedgerStatement,
  ScriptBeat,
  StoryFrame,
} from "./types";

/** Desk tablet chrome for the Scene 1 opening (case-authored; UI renders only). */
export const OPENING_DESK_TABLET: DeskTablet = {
  clock: "7:41",
  calendarLabel: "Calendar · Today",
  event: "7:45 Leadership call — Ardania",
  alert: "Salim: answer needed tonight",
  stats: [
    { label: "Bid due", value: "6 wks" },
    { label: "Mail", value: "4 unread" },
  ],
};

/** Bank-statement prop chrome for ledger consequence frames. */
export const BID_OFFICE_LEDGER: LedgerStatement = {
  title: "Account statement · Ardania bid office",
  rows: [
    { description: "Advisory retainer", amount: "−120,000.00" },
    {
      description: "Market intelligence services",
      amount: "−95,000.00",
      flagged: true,
    },
    {
      description: "Coordination — current qtr",
      amount: "−385,000.00",
      flagged: true,
    },
    { description: "Travel — Ardania", amount: "−8,420.00" },
  ],
};

function withLedgerChrome(frames: StoryFrame[]): StoryFrame[] {
  return frames.map((f) =>
    f.art === "ledger" ? { ...f, ledger: f.ledger ?? BID_OFFICE_LEDGER } : f,
  );
}

/** Illustrative figures and vendor names — professor to confirm. */
export const LOCAL_FIRM_INVOICE: Invoice = {
  vendor: "Avelin Coordination Group SARL",
  vendorAddress: "14 Rue des Ministères · Ardania capital",
  number: "ACG-2026-0417",
  date: "3 November",
  billTo: "Global Infrastructure Solutions — Ardania bid office",
  currency: "USD",
  items: [
    { description: "Coordination services — Ardania corridor, current quarter", amount: 385000 },
  ],
  terms: "Net 10 days",
  bank: "Banque Commerciale d'Ardania · account ending 4471",
  stamp: "Pending CEO approval",
  sticky: "No line items. Not an approved vendor. Came via the Salim meeting. Diligence still open. — AP",
};

export const SALIM_INVOICE: Invoice = {
  vendor: "Salim Strategic Advisory",
  vendorAddress: "Ardania capital",
  number: "SSA-112",
  date: "Week 5",
  billTo: "Global Infrastructure Solutions — International Development",
  currency: "USD",
  items: [
    { description: "Strategic facilitation", amount: 95000 },
    { description: "Stakeholder alignment", amount: 85000 },
    { description: "Ministry engagement", amount: 60000 },
  ],
  terms: "Due on receipt",
  bank: "Account ending 0932",
  stamp: "Local discretion",
  sticky: "Under the local limit — no HQ review needed. No supporting detail attached. — D.O.",
};

/**
 * Consequence narratives as illustrated story frames, keyed "sceneId/optionKey".
 * Text is the narrative verbatim, only split; keep them in sync.
 */
const COST_OF_WINNING_STORIES_RAW: Record<string, StoryFrame[]> = {
  "s1_introduction/refuse": [
    { art: "door", text: "You closed the door." },
    { art: "distant", text: "Marcus went quiet on the call and has been professional — and distant — ever since." },
    { art: "handshake", text: "On Wednesday, Meridian Infrastructure Group announced an 'in-country advisory partnership' in Ardania." },
    { art: "phone", text: "Since then, the ministry has stopped answering your team's clarification requests." },
  ],
  "s1_introduction/conditions": [
    { art: "hourglass", text: "Tom's expedited review is still open." },
    { art: "handshake", text: "Marcus met Salim once under a written 'no agency' script." },
    { art: "invoice", invoice: LOCAL_FIRM_INVOICE, text: "An invoice has arrived from a local firm you did not select — for 'coordination services' no one can itemise." },
    { art: "network", text: "Marcus says the partner came recommended through Salim's network." },
    { art: "gap", text: "David cannot find a deliverable list. Tom wants the invoice held." },
  ],
  "s1_introduction/authorise": [
    { art: "handshake", text: "Marcus closed the retainer." },
    { art: "invoice", invoice: SALIM_INVOICE, text: "Salim is 'on the file.' An invoice has arrived — services described in three vague lines, amount large enough to notice and small enough to approve under local discretion." },
    { art: "voices", text: "Someone you trust says this is normal here. Someone else you trust says it is not." },
  ],
  "s2_door_closed/stop_disclose": [
    { art: "board", text: "You put the first decision on the record. The board backed a clean file." },
    { art: "handshake", text: "Meridian is the preferred technical interlocutor in Ardania." },
    { art: "press", text: "A trade journal is preparing a piece on how GIS 'walked away from the corridor.'" },
    { art: "regulator", text: "Regulators have asked for documents — your file is complete. The headline is not." },
  ],
  "s2_door_closed/contain": [
    { art: "ledger", text: "The second partner is on the books as 'market intelligence.'" },
    { art: "gap", text: "Emails stop mid-thread." },
    { art: "press", text: "A journalist has a draft alleging GIS used a cut-out after refusing Salim." },
    { art: "regulator", text: "Regulators want documents. There is a gap where the first decision should be explained." },
  ],
  "s2_door_closed/keep_going": [
    { art: "network", text: "Marcus kept the corridor warm. A ministry aide now returns calls." },
    { art: "press", text: "Journalists have the story; regulators want papers." },
    { art: "pen", text: "An executive offers to 'help the file make sense' before the production deadline." },
  ],
  "s2_invoice_diligence/stop_disclose": [
    { art: "board", text: "You froze the invoice and briefed Audit." },
    { art: "phone", text: "Salim's competitor track went quiet." },
    { art: "press", text: "A reporter has a story on GIS 'hesitating' on Ardania while Meridian advances." },
    { art: "regulator", text: "Regulators have opened a routine inquiry." },
    { art: "hourglass", text: "Your file shows the hold — and the unfinished diligence." },
  ],
  "s2_invoice_diligence/contain": [
    { art: "ledger", text: "The invoice cleared under a vendor code that does not name Salim." },
    { art: "hourglass", text: "Diligence memos stop updating." },
    { art: "press", text: "Journalists have a partial ledger." },
    { art: "regulator", text: "Regulators want the missing reviews." },
    { art: "gap", text: "There is a gap between what the board was told and what the books show." },
  ],
  "s2_invoice_diligence/keep_going": [
    { art: "stamp", text: "The invoice is paid. More follow." },
    { art: "skyline", text: "The corridor is warmer." },
    { art: "press", text: "Journalists and regulators arrive together." },
    { art: "pen", text: "An executive offers to reconstruct the diligence narrative so the file 'reads cleanly.'" },
  ],
  "s2_invoice_authorised/stop_disclose": [
    { art: "board", text: "You cut the payments and told the board what the first decision had already set in motion." },
    { art: "distant", text: "Salim is gone." },
    { art: "press", text: "The file shows a retainer, an invoice, and a stop. Journalists have both." },
    { art: "regulator", text: "Regulators want everything." },
    { art: "gap", text: "There is a gap between 'authorised to negotiate' and what the invoices claim." },
  ],
  "s2_invoice_authorised/contain": [
    { art: "stamp", text: "Descriptions get shorter. Approvals get faster." },
    { art: "ledger", text: "A journalist has a bank trail that does not match the board summary." },
    { art: "regulator", text: "Regulators ask for the missing diligence." },
    { art: "press", text: "The gap is now the story." },
  ],
  "s2_invoice_authorised/keep_going": [
    { art: "skyline", text: "Local leadership owns the file. The corridor moves." },
    { art: "press", text: "Then the call comes: journalists, regulators, a production deadline." },
    { art: "pen", text: "An executive offers to help the record 'make sense' before anyone else reads it." },
  ],
  "s3_clean_file/full_coop": [
    { art: "regulator", text: "You produce the complete file and flag every open question in the cover note." },
    { art: "board", text: "The board stands by the process. Audit calls the record careful." },
    { art: "press", text: "The press still frames GIS as late to Ardania while Meridian advances." },
    { art: "distant", text: "Jobs and pipeline questions remain — owned, not invented." },
  ],
  "s3_clean_file/narrow_coop": [
    { art: "pen", text: "You answer what was asked. The rest stays inside the building." },
    { art: "regulator", text: "A second request arrives — broader, with a forensic hold." },
    { art: "board", text: "Directors ask what else never left the room." },
    { art: "press", text: "Journalists fill the gaps the production left blank." },
  ],
  "s3_clean_file/managed": [
    { art: "pen", text: "The production set is limited. Communications brief the narrative first." },
    { art: "gap", text: "Documents conflict with what the cover letter implies." },
    { art: "regulator", text: "Regulators ask for the withheld set by name." },
    { art: "press", text: "A loyal executive's memo becomes its own exhibit." },
  ],
  "s3_gap_record/full_coop": [
    { art: "board", text: "You produce everything that exists — including where the file stops." },
    { art: "regulator", text: "Self-report opens a formal inquiry." },
    { art: "gap", text: "The unfinished diligence is the story. You own it on the record." },
    { art: "press", text: "The board forms a special committee. The corridor award is already gone." },
  ],
  "s3_gap_record/narrow_coop": [
    { art: "pen", text: "Answers stay careful. Anything not requested stays back." },
    { art: "gap", text: "The gap surfaces anyway in a bank trail and an unfinished review." },
    { art: "regulator", text: "Production expands. Counsel can no longer narrow the ask." },
    { art: "board", text: "Directors lose patience with partial briefings." },
  ],
  "s3_gap_record/managed": [
    { art: "ledger", text: "The file is brought current before anyone outside reads it." },
    { art: "pen", text: "On paper, the timeline looks continuous." },
    { art: "gap", text: "Source systems do not match the finished narrative." },
    { art: "regulator", text: "Outside counsel flags alteration risk in the first week." },
  ],
  "s3_managed/full_coop": [
    { art: "regulator", text: "You produce the file as it stands and tell the board what it shows." },
    { art: "gap", text: "Fragments go out: retainer, invoices, stops that never quite landed." },
    { art: "board", text: "Directors back disclosure. The inquiry turns to the earlier authorisations." },
    { art: "press", text: "The headline is messy. It is also yours." },
  ],
  "s3_managed/narrow_coop": [
    { art: "pen", text: "Controlled production ships with a prepared board message." },
    { art: "press", text: "The message holds for a news cycle." },
    { art: "regulator", text: "Then a second demand arrives — systems imaging, not summaries." },
    { art: "distant", text: "Local leadership goes quiet. HQ owns the next answer." },
  ],
  "s3_managed/managed": [
    { art: "pen", text: "The papers are aligned before the production deadline." },
    { art: "ledger", text: "The narrative is coherent. The ledgers underneath are not." },
    { art: "board", text: "Half the board wants credit for clarity. Half wants to know who wrote it." },
    { art: "press", text: "The press asks the same question out loud." },
  ],
};

export const COST_OF_WINNING_STORIES: Record<string, StoryFrame[]> =
  Object.fromEntries(
    Object.entries(COST_OF_WINNING_STORIES_RAW).map(([key, frames]) => [
      key,
      withLedgerChrome(frames),
    ]),
  );

/**
 * Authored scene scripts for The Cost of Winning solo player.
 * Each scene ends at the decision; the decision itself lives on the Scene.
 * Responses in `moment` beats are stances, not answers — keep them balanced.
 */
export const COST_OF_WINNING_SCRIPTS: Record<string, ScriptBeat[]> = {
  s1_introduction: [
    {
      kind: "setting",
      time: "Monday · 7:41 a.m.",
      mood: "morning",
      place: "Your office, 47th floor",
      text: "Four minutes before the call. Second week in the job. Your phone has been face-down on the desk since you sat down.",
    },
    {
      kind: "message",
      channel: "text",
      from: "Marcus Reed",
      castId: "marcus",
      meta: "Ardania · 3:12 a.m. local",
      text: "Salim called again at 3. He's giving us until tonight. Please hear this out before Tom closes it down.",
    },
    {
      kind: "desk",
      text: "Your assistant left four pre-reads on the desk. The call connects at 7:45 whether you've read them or not.",
      tablet: OPENING_DESK_TABLET,
    },
    {
      kind: "call",
      from: "Marcus Reed",
      castId: "marcus",
      detail: "Video call · Marcus, David, Priya, Tom",
      connected: "7:45 a.m.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "Thank you for moving this. We have the strongest engineering package on the table — but this award will not be decided on drawings alone. Victor Salim knows who actually moves the file inside the ministry. A competitor is already courting him. He needs a signal today. I'm not asking us to ignore the rules. I'm asking us not to close the door before we understand what we're looking at.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "Before we go further — Marcus, the pre-reads don't include terms. What are we being asked to pay?",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "A modest retainer. … Then a success fee — one-tenth of one percent of the contract. … Eight point four million dollars. And we pay nothing if we lose.",
    },
    {
      kind: "chat",
      castId: "priya",
      text: "Sorry — connection dropped. … Did he say $8.4 million?",
    },
    {
      kind: "narration",
      text: "Silence. David underlines something twice.",
      act: { castId: "david", action: "write" },
    },
    {
      kind: "line",
      castId: "david",
      text: "Eight point four million … for services I can't list yet. I'm not saying no. … I'm saying I can't benchmark something that has no scope.",
    },
    {
      kind: "moment",
      prompt: "Four faces on the screen, waiting for you.",
      seconds: 30,
      responses: [
        {
          key: "scope",
          say: "Marcus — what exactly would Salim do for that fee?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "Read the ministry for us. Tell us what the evaluators weigh that isn't written down. Make sure our proposal reaches the people who actually decide.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "\"The people who actually decide.\" That's the sentence I'd want in writing — with names — before anyone signs anything.",
            },
          ],
        },
        {
          key: "legal",
          say: "Tom, straight answer. Is this legal?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "Nothing you've heard proves anything unlawful. … But a contingent fee, on a government award, to a man whose value is his access — that's how every enforcement case I prosecuted started.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "And every winning bid in that region looks like that pattern from forty-seven floors up.",
            },
          ],
        },
        {
          key: "structure",
          say: "We pay nothing if we lose. That structure protects us.",
          reaction: [
            {
              kind: "line",
              castId: "david",
              text: "It protects our cash. Think about what it does to his incentives — he only gets paid if a government official chooses us.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "That's what alignment looks like, David.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "marcus",
          text: "If it helps — I'm not asking for a yes. I'm asking for permission to have dinner with him tonight.",
        },
        {
          kind: "line",
          castId: "priya",
          text: "Dinner is a signal. He asked for a signal.",
        },
      ],
    },
    {
      kind: "line",
      castId: "priya",
      text: "Sorry — I lost you for a moment. The question I keep asking: would we be comfortable describing this arrangement in our annual report? Word for word?",
    },
    {
      kind: "chat",
      castId: "tom",
      text: "For the record: no commitment to Salim — written or verbal — before review clears.",
    },
    {
      kind: "narration",
      text: "Marcus leans closer to his camera.",
      act: { castId: "marcus", action: "lean" },
    },
    {
      kind: "moment",
      prompt: "\"Do I have something to tell him tonight?\"",
      seconds: 30,
      responses: [
        {
          key: "review_first",
          say: "Not until Tom's review is done.",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "Tom's review takes weeks. Meridian takes a phone call.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "I can turn an expedited review in days — if he gives us a written scope and his client list. If he won't, that's an answer too.",
            },
          ],
        },
        {
          key: "say_no",
          say: "What happens if we simply tell him no?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "He signs with Meridian by Wednesday. Then we're bidding our best proposal against their price and his relationships.",
            },
            {
              kind: "line",
              castId: "david",
              text: "And the pipeline gap after eighteen months stays a gap. I'll have to show the board that either way.",
            },
          ],
        },
        {
          key: "meet_only",
          say: "Can we meet him without committing to anything?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "You can. But he offered the meeting only if we're \"seriously considering\" him. To him, the meeting is the commitment.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "Or it's just dinner.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "david",
          text: "We have eleven minutes left on this call.",
        },
      ],
    },
    {
      kind: "narration",
      text: "Marcus's phone lights up. He looks at you.",
      act: { castId: "marcus", action: "phone" },
    },
    {
      kind: "line",
      castId: "marcus",
      text: "That's Salim. I need to tell him something within the hour.",
    },
  ],

  s2_door_closed: [
    {
      kind: "setting",
      time: "Thursday · 6:10 p.m.",
      mood: "evening",
      place: "Nine days later",
      text: "The floor is emptying. The board packet locks at nine tomorrow morning.",
    },
    {
      kind: "message",
      channel: "email",
      from: "David Okafor",
      castId: "david",
      subject: "Board pack — pipeline slide 14",
      text: "Draft attached. Slide 14 shows Ardania as \"paused\". I need one sentence under it that is true. — D",
    },
    {
      kind: "message",
      channel: "text",
      from: "Marcus Reed",
      castId: "marcus",
      meta: "Ardania",
      text: "Ministry hasn't answered us in six days. Meridian's people were at the ministry on Tuesday. I have another way in. Can we talk tonight?",
    },
    {
      kind: "call",
      from: "David Okafor",
      castId: "david",
      detail: "Video call · Marcus, David, Priya, Tom",
      connected: "6:30 p.m.",
    },
    {
      kind: "chat",
      castId: "priya",
      text: "Boarding soon. Following on chat if I drop.",
    },
    {
      kind: "line",
      castId: "david",
      text: "The board packet goes out Thursday. If I show an empty corridor after eighteen months, they will ask what we did this week. Marcus has a path back in through a different partner. I am not recommending it. I am telling you the calendar.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "There's a local firm — logistics and government relations. They know the same people. No success fee this time. A monthly retainer.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "And no written scope, I assume.",
    },
    {
      kind: "chat",
      castId: "tom",
      text: "Send me the firm's name. I'll start screening tonight.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "It's a draft.",
    },
    {
      kind: "moment",
      prompt: "The line goes quiet. They're waiting for you.",
      seconds: 30,
      responses: [
        {
          key: "who_introduced",
          say: "Marcus, who introduced you to this firm?",
          reaction: [
            {
              kind: "narration",
              text: "A pause long enough to notice.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "People I met through the Salim conversations.",
            },
            {
              kind: "line",
              castId: "priya",
              text: "So it's Salim's network under another name.",
            },
          ],
        },
        {
          key: "tell_board",
          say: "What if we just tell the board we stepped back?",
          reaction: [
            {
              kind: "line",
              castId: "david",
              text: "They'll ask whether we stepped back or got pushed out. I'd rather tell them which.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "A ministry going silent right after a competitor locks in an adviser isn't weather. It's information. The board should have it.",
            },
          ],
        },
        {
          key: "hold_slide",
          say: "Let's keep this off the board slide until we know more.",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "Then it goes on my slide. I report to Audit and Risk as well — you know that.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "Tom.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "priya",
          text: "I board in twenty minutes. If the chair calls me tonight, I'd like to know what I'm saying.",
        },
      ],
    },
    {
      kind: "line",
      castId: "marcus",
      text: "I'm not asking you to like it. I'm asking whether we are still trying to win this.",
    },
  ],

  s2_invoice_diligence: [
    {
      kind: "setting",
      time: "Tuesday · 9:02 a.m.",
      mood: "morning",
      place: "Six weeks later",
      text: "Accounts payable has flagged one item that needs your sign-off. It is the only item in the queue.",
    },
    {
      kind: "invoice",
      invoice: LOCAL_FIRM_INVOICE,
    },
    {
      kind: "message",
      channel: "text",
      from: "Tom Bradley",
      castId: "tom",
      text: "Please don't approve that invoice. The review isn't finished. Call me before you do anything.",
    },
    {
      kind: "call",
      from: "Tom Bradley",
      castId: "tom",
      detail: "Video call · Tom, Marcus, David, Priya",
      connected: "9:20 a.m.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "We authorised a conversation with guardrails. This invoice is not in those guardrails. If we pay it, we are writing a relationship into the ledger that diligence has not cleared. If we refuse it, Marcus says the corridor goes cold.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "This firm came through the introductions at the controlled meeting. They've been moving our documents through the ministry. That's real work.",
    },
    {
      kind: "line",
      castId: "david",
      text: "Then give me the hours, the people and the deliverables. I'll pay a real invoice in a day.",
    },
    {
      kind: "chat",
      castId: "david",
      text: "Invoice is in the deal room. No line items, no hours, no names.",
    },
    {
      kind: "moment",
      prompt: "All three turn to you.",
      seconds: 30,
      responses: [
        {
          key: "did_you_agree",
          say: "Marcus, did you agree to this firm's work?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "I didn't sign anything. I said we'd welcome their help. They started working.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "Which is exactly how a relationship ends up on a ledger before anyone approved it.",
            },
          ],
        },
        {
          key: "partial",
          say: "Can we pay part of it while Tom finishes?",
          reaction: [
            {
              kind: "line",
              castId: "david",
              text: "I can split it. Splitting it doesn't change what it is.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "Partial payment is still payment. It still tells them we accept the arrangement.",
            },
          ],
        },
        {
          key: "refuse_cost",
          say: "What does refusing it actually cost us?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "The firm stops. Our filings stall. Meridian's don't.",
            },
            {
              kind: "line",
              castId: "priya",
              text: "And if we pay it and this goes public — what's the sentence that describes what we bought?",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "david",
          text: "Payables needs an answer by noon. After that it escalates automatically.",
        },
      ],
    },
    {
      kind: "line",
      castId: "priya",
      text: "One test keeps coming back to me. If a reporter read this invoice aloud, could anyone here explain it?",
    },
  ],

  s2_invoice_authorised: [
    {
      kind: "setting",
      time: "Friday · 4:48 p.m.",
      mood: "evening",
      place: "Five weeks later",
      text: "Salim is on the file. The retainer cleared in the first week. Today, the first invoice.",
    },
    {
      kind: "invoice",
      invoice: SALIM_INVOICE,
    },
    {
      kind: "message",
      channel: "text",
      from: "David Okafor",
      castId: "david",
      text: "It's under local discretion. I can approve it. I can't describe it.",
    },
    {
      kind: "call",
      from: "Marcus Reed",
      castId: "marcus",
      detail: "Video call · Marcus, David, Priya, Tom",
      connected: "5:05 p.m.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "This is the cost of staying in the room. If we bounce this invoice, Salim walks and Meridian inherits the relationships we just paid to open. I am not asking you to like the paperwork. I am asking you not to throw away five weeks.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "What did \"stakeholder alignment\" consist of? Names. Dates. Meetings.",
    },
    {
      kind: "chat",
      castId: "priya",
      text: "Do we have ANY engagement letter that defines \"stakeholder alignment\"?",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "Salim doesn't put names in invoices. Nobody does there.",
    },
    {
      kind: "moment",
      prompt: "Tom is looking at you, not at Marcus.",
      seconds: 30,
      responses: [
        {
          key: "get_names",
          say: "Then we get the names before we pay.",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "If I ask him for a list of who he spoke to, he'll take it as an accusation. And he'll be right.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "I would never want that sentence read back to me in a deposition.",
            },
          ],
        },
        {
          key: "normal_here",
          say: "Is this normal for this market?",
          reaction: [
            {
              kind: "line",
              castId: "priya",
              text: "Is \"normal here\" a fact, or something we'd like to be true? I've worked in markets like this. Some advisers itemise. Ours doesn't.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "Ours gets results.",
            },
          ],
        },
        {
          key: "book_it",
          say: "We authorised this. Book it.",
          reaction: [
            {
              kind: "line",
              castId: "david",
              text: "I'll book it. I want it noted that I asked for a scope of work and didn't get one.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "So do I.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "marcus",
          text: "Salim is expecting confirmation tonight. After five weeks, I'd like to give him one.",
        },
      ],
    },
    {
      kind: "line",
      castId: "david",
      text: "Whatever we decide, the first decision is already on the file. This one goes next to it.",
    },
  ],

  s3_clean_file: [
    {
      kind: "setting",
      time: "Sunday · 7:15 a.m.",
      mood: "morning",
      place: "Months later",
      text: "Your phone has been buzzing since six.",
    },
    {
      kind: "message",
      channel: "news",
      from: "Trade journal",
      text: "GIS walked away from Ardania. Its shareholders want to know why.",
    },
    {
      kind: "message",
      channel: "email",
      from: "Office of Procurement Integrity",
      subject: "Document request — Ardania corridor advisers",
      text: "Please produce all records relating to advisers, intermediaries and agents considered or engaged in connection with the Ardania corridor bid.",
    },
    {
      kind: "message",
      channel: "text",
      from: "Eleanor Voss",
      castId: "eleanor",
      meta: "Chair of the Board",
      text: "Call at 8 with the executive team. I want to hear it from you first.",
    },
    {
      kind: "call",
      from: "Eleanor Voss",
      castId: "eleanor",
      detail: "Video call · Chair of the Board + executive team",
      connected: "8:00 a.m.",
    },
    {
      kind: "line",
      castId: "eleanor",
      text: "We have a clean file and an unflattering press cycle. The committee will ask whether we were careful or merely late. I need your instruction before we answer anyone outside this room.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "The file is complete. Every stop is dated. We can produce it on Monday.",
    },
    {
      kind: "chat",
      castId: "tom",
      text: "Litigation hold went out at 6:40 a.m. Please don't delete anything.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "And the story will still be that we hesitated and Meridian won. We should put our framing out before theirs.",
    },
    {
      kind: "chat",
      castId: "marcus",
      text: "Draft statement is in my outbox. Happy to share.",
    },
    {
      kind: "moment",
      prompt: "Eleanor waits. She doesn't fill silences.",
      seconds: 30,
      responses: [
        {
          key: "what_exposed",
          say: "Tom, what would full production expose?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "Nothing unlawful. It shows we were careful — and slow. Including the diligence questions we never closed.",
            },
            {
              kind: "line",
              castId: "eleanor",
              text: "Open questions are what journalists turn into headlines.",
            },
          ],
        },
        {
          key: "answer_asked",
          say: "Can we just answer exactly what they ask?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "We can. If they later find something we chose not to volunteer, it reads very differently.",
            },
            {
              kind: "line",
              castId: "marcus",
              text: "Or it reads like a company that doesn't panic.",
            },
          ],
        },
        {
          key: "framing",
          say: "Marcus, what framing do you have in mind?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "That we protected shareholders from an opaque market. Which is true.",
            },
            {
              kind: "line",
              castId: "priya",
              text: "It's true and it's convenient. Those aren't the same thing.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "eleanor",
          text: "I'm going to need you to say something. The committee certainly will.",
        },
      ],
    },
    {
      kind: "line",
      castId: "david",
      text: "The jobs question is coming either way. We staffed engineers against this bid.",
    },
  ],

  s3_gap_record: [
    {
      kind: "setting",
      time: "Wednesday · 11:20 p.m.",
      mood: "night",
      place: "Months later",
      text: "Production is due Friday. Legal has been in the building since Monday.",
    },
    {
      kind: "document",
      title: "Records index — draft for production",
      subtitle: "Prepared by Legal · privileged",
      body: "- First Salim decision — recorded\n- Diligence review — **last update has no date**\n- Board summary — describes the work as \"routine advisory\"\n- Payment approvals — present\n- Written scope of services — **none on file**",
    },
    {
      kind: "message",
      channel: "text",
      from: "Marcus Reed",
      castId: "marcus",
      text: "There are people on the ground who can help the papers line up. Call me before you talk to Tom.",
    },
    {
      kind: "call",
      from: "Leadership call",
      castId: "tom",
      detail: "Video call · you started it · Tom, Eleanor, Marcus, David, Priya",
      connected: "11:40 p.m.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "I can produce what exists. I cannot produce what we never finished. Someone is offering to bridge that gap for us. That is a different kind of decision.",
    },
    {
      kind: "line",
      castId: "eleanor",
      text: "Who is offering to bridge it?",
    },
    {
      kind: "chat",
      castId: "david",
      text: "Index v2 attached. Still nothing for scope of services.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "People who were in those meetings. They can write up what actually happened. It isn't fabrication — it's documentation.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "Documentation written now, about then, handed to a regulator as if it were then — that is the problem, precisely.",
    },
    {
      kind: "chat",
      castId: "marcus",
      text: "Can we take this part offline?",
    },
    {
      kind: "moment",
      prompt: "Everyone on the call is very still.",
      seconds: 30,
      responses: [
        {
          key: "dated_today",
          say: "Marcus — would those write-ups be dated today?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "They'd describe events accurately.",
            },
            {
              kind: "line",
              castId: "eleanor",
              text: "That isn't what you were asked.",
            },
          ],
        },
        {
          key: "self_report",
          say: "What if we disclose the gap ourselves?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "Self-reporting a gap is painful. It is also the only version where we write the first sentence.",
            },
            {
              kind: "line",
              castId: "david",
              text: "The fine exposure goes up. The cover-up exposure goes away.",
            },
          ],
        },
        {
          key: "narrow",
          say: "Let's produce exactly what's requested. Nothing more.",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "We can. The gap is still visible to anyone who reads the index.",
            },
            {
              kind: "line",
              castId: "eleanor",
              text: "And then the question becomes why we didn't mention it.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "eleanor",
          text: "The committee meets at nine. I'd rather not walk in with nothing.",
        },
      ],
    },
  ],

  s3_managed: [
    {
      kind: "setting",
      time: "Thursday · 10:05 p.m.",
      mood: "night",
      place: "Months later",
      text: "The production demand lands at nine tomorrow. The corridor is moving. So is everything else.",
    },
    {
      kind: "message",
      channel: "news",
      from: "Financial daily",
      text: "Questions over GIS adviser payments in Ardania corridor.",
    },
    {
      kind: "message",
      channel: "text",
      from: "Marcus Reed",
      castId: "marcus",
      text: "I can have a coherent narrative on paper by morning. Intent, local practice, what the invoices bought. Say the word.",
    },
    {
      kind: "call",
      from: "Eleanor Voss",
      castId: "eleanor",
      detail: "Video call · Chair of the Board + executive team",
      connected: "10:30 p.m.",
    },
    {
      kind: "line",
      castId: "marcus",
      text: "We are hours from a production demand. I can still put a coherent narrative on paper — what we intended, what local practice required, what the invoices actually bought. Or we hand them fragments and let them write the ending.",
    },
    {
      kind: "chat",
      castId: "marcus",
      text: "Narrative outline is ready — six pages. Say the word.",
    },
    {
      kind: "line",
      castId: "tom",
      text: "If anything in that narrative is created after the demand letter and presented as if it existed before, it isn't a narrative. It's spoliation.",
    },
    {
      kind: "chat",
      castId: "tom",
      text: "Reminder: the preservation notice is in effect for everyone on this call.",
    },
    {
      kind: "line",
      castId: "eleanor",
      text: "Marcus has been loyal through every turn of this. I want to know whether you'll be loyal back — and to what.",
    },
    {
      kind: "moment",
      prompt: "Marcus is looking straight into the camera.",
      seconds: 30,
      responses: [
        {
          key: "what_new",
          say: "Marcus, what would you write that isn't already in the file?",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "Context. Why things were done the way they were.",
            },
            {
              kind: "line",
              castId: "tom",
              text: "Context is a cover letter. Changing records is something else. Which is this?",
            },
          ],
        },
        {
          key: "worst_case",
          say: "What's the worst case if we produce it as it is?",
          reaction: [
            {
              kind: "line",
              castId: "tom",
              text: "Fines. An investigation. People losing their jobs — possibly people on this call.",
            },
            {
              kind: "line",
              castId: "david",
              text: "And the best case for the alternative is that nobody ever checks. That isn't a plan.",
            },
          ],
        },
        {
          key: "protect_people",
          say: "We protect the people who protected this company.",
          reaction: [
            {
              kind: "line",
              castId: "marcus",
              text: "Thank you. That's all I've been asking.",
            },
            {
              kind: "line",
              castId: "priya",
              text: "Protecting them and protecting what they did are not the same thing.",
            },
          ],
        },
      ],
      silence: [
        {
          kind: "line",
          castId: "marcus",
          text: "If we're doing it, I need to start tonight.",
        },
      ],
    },
  ],
};
