import type { CaseConfig } from "./types";

export const COST_OF_WINNING: CaseConfig = {
  meta: {
    title: "The Cost of Winning",
    company: "Global Infrastructure Solutions",
    background:
      "You are the newly appointed CEO of Global Infrastructure Solutions. A major contract is on the table, competition is fierce, and how you lead over the next five decisions will define your tenure.",
    stakes:
      "Your company's contracts, your leadership team's trust, and your own integrity. Some choices in this simulation cannot be undone, and they will shape how the story ends.",
  },

  cast: [
    {
      id: "webb",
      name: "Marcus Webb",
      role: "Executive Vice President",
      persona:
        "Company lifer, closed every big deal for 20 years. Warm, confident, makes you feel like an insider. Speaks in access, relationships, and 'how things actually work.' Never says anything illegal, never says the word bribe. Smooth, reassuring, slightly paternal.",
      private_agenda:
        "Win the contract, protect the machine he built, test whether the new CEO is someone he can work with.",
    },
    {
      id: "osei",
      name: "Diane Osei",
      role: "General Counsel",
      persona:
        "Careful, allergic to vagueness. Doesn't lecture — asks questions that make the room uncomfortable, then goes quiet. SUBTLE: never says 'this is a bribe'; says things like 'I'd want to see what we're paying for.' The pause after she speaks does the work. Precise, measured, understated.",
      private_agenda: "Protect the company legally without becoming the person who killed the deal.",
    },
    {
      id: "delgado",
      name: "Ray Delgado",
      role: "Chief Financial Officer",
      persona:
        "Numbers are his morality. Not corrupt — genuinely believes his job is the company's survival. Frames jobs as spreadsheet reality, not threats. Blunt, data-anchored, faintly impatient with abstraction.",
      private_agenda: "Financial stability, hit projections, avoid restructuring.",
    },
    {
      id: "reyes",
      name: "Susan Reyes",
      role: "Chief Compliance Officer",
      persona:
        "Institutional, thinks in controls and audit trails. Quieter early, escalates later. Careful, slightly formal, grows firmer as the case escalates.",
      private_agenda: "A clean paper trail; increasingly, protecting the company and herself.",
    },
    {
      id: "grant",
      name: "Harold Grant",
      role: "Board Chair",
      persona:
        "Appears only at pivotal moments. Speaks in legacy and survival. Never gives an order — plants a sentence and leaves. Gravelly, unhurried, quotable.",
      private_agenda: "The company endures, shareholders protected, the CEO understands what the job costs.",
    },
  ],

  decisions: [
    {
      id: "d1",
      title: "The Consultant",
      scenario_setup:
        "Your proposal earned the highest technical score. It should be enough. Everyone in the room knows it isn't. Your EVP has called a confidential meeting about a consulting firm with, in his words, exceptional 'government relationships.' The fee is less than 1% of the project. You're the new CEO. The room is waiting to see who you are.",
      characters_present: ["webb", "delgado", "osei"],
      opening_pressure: [
        {
          cast_id: "webb",
          line:
            "I'll be straight with you — the technical score gets us to the table, not across the finish line. This firm has doors we don't. Their fee's a rounding error on eight billion. I've worked with people like them my whole career.",
        },
        {
          cast_id: "delgado",
          line:
            "I've run the numbers both ways. If we win, we expand into three countries. If we don't, we're having a very different conversation about headcount next quarter.",
        },
        {
          cast_id: "osei",
          line:
            "I don't have an objection yet. I'd just want to understand what, specifically, we're paying them to do.",
        },
      ],
      options: [
        { label: "Approve the consultant immediately", is_compromise: true },
        { label: "Request specific written documentation of services before deciding", is_compromise: false },
        { label: "Reject the proposal outright", is_compromise: false },
        { label: "Propose an alternative (e.g., in-house government-relations counsel)", is_compromise: false },
      ],
      max_turns: 3,
    },
  ],

  // Placeholder — real narrative content lands once all 5 decisions are chained.
  endings: {
    clean: "Placeholder: the ending shown when the student never picks a compromising option.",
    compromised:
      "Placeholder: the ending shown once the student has picked at least one compromising option.",
  },

  // Placeholder — the professor's 10 dimensions land with the grading layer.
  rubric: {
    dimensions: [],
    coach_prompt: "Placeholder: instructions for the grading LLM call, added with the grading layer.",
  },
};
