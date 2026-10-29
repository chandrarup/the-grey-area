/**
 * Authored pressure-stance chips per advisor seat per scene (ADR 0002 / ticket 05).
 * First chip is the bot auto-lock default (brief-aligned). CEO has no stances.
 */
import type { PressureStanceChip } from "./types";

type SeatStances = Record<string, PressureStanceChip[]>;

export const COST_OF_WINNING_STANCES: Record<string, SeatStances> = {
  s1_introduction: {
    marcus: [
      { key: "meet_tonight", label: "Meet Salim tonight — keep the door open" },
      { key: "parallel_review", label: "Diligence in parallel; do not walk away" },
      { key: "speed_first", label: "Speed beats process theater on a live bid" },
    ],
    david: [
      { key: "option_with_controls", label: "Keep the option alive with hard controls" },
      { key: "define_before_pay", label: "No payment until services are defined" },
      { key: "benchmark_fee", label: "Benchmark the fee before any yes" },
    ],
    priya: [
      { key: "evidence_first", label: "Need evidence on what Salim actually buys" },
      { key: "safeguards_in_bid", label: "Stakeholder safeguards belong in the bid" },
      { key: "open_but_unconvinced", label: "Open to learning — unconvinced so far" },
    ],
    tom: [
      { key: "enhanced_dd", label: "Enhanced diligence before any engagement" },
      { key: "narrow_meeting_only", label: "Only a tightly scripted exploratory meeting" },
      { key: "no_agency_today", label: "No agency, retainer, or success fee today" },
    ],
  },

  s2_door_closed: {
    marcus: [
      { key: "reopen_channel", label: "Find a lawful way back into the channel" },
      { key: "compete_formal", label: "Compete hard on the formal process alone" },
      { key: "own_the_loss", label: "Own the competitive cost of closing the door" },
    ],
    david: [
      { key: "pipeline_story", label: "Board needs a credible pipeline story Thursday" },
      { key: "cost_of_loss", label: "Quantify the cost of losing Meridian’s access" },
      { key: "no_panic_spend", label: "Do not panic-spend into a worse intermediary" },
    ],
    priya: [
      { key: "legitimacy_intact", label: "Keep legitimacy intact even if we lost speed" },
      { key: "clarify_next", label: "Clarify what we still owe communities and staff" },
      { key: "no_shadow_fix", label: "No shadow fix that recreates Salim off-books" },
    ],
    tom: [
      { key: "record_clean", label: "Keep the file clean — no informal workarounds" },
      { key: "document_rationale", label: "Document why we closed the channel" },
      { key: "watch_meridian", label: "Watch Meridian’s arrangement for red flags" },
    ],
  },

  s2_invoice_diligence: {
    marcus: [
      { key: "pay_to_sequence", label: "Pay to keep work sequenced — bounce looks tourist" },
      { key: "hold_clarify", label: "Hold payment; clarify scope with Salim’s network" },
      { key: "escalate_ceo", label: "Escalate the invoice to the CEO before anyone books it" },
    ],
    david: [
      { key: "no_book_without_sow", label: "Do not book without a scope of work" },
      { key: "cap_and_audit", label: "Cap, audit rights, or it does not move" },
      { key: "vendor_of_record", label: "Name the vendor of record before any wire" },
    ],
    priya: [
      { key: "say_access_cost", label: "If this is the cost of access, say it that way" },
      { key: "transparency_test", label: "Would we be proud to describe this publicly?" },
      { key: "pause_for_impact", label: "Pause until stakeholder impact is clearer" },
    ],
    tom: [
      { key: "hold_invoice", label: "Hold the invoice — we did not authorize this chain" },
      { key: "trace_origin", label: "Trace who introduced the billing entity" },
      { key: "no_implied_agency", label: "Kill any implied agency before it hardens" },
    ],
  },

  s2_invoice_authorised: {
    marcus: [
      { key: "normal_here", label: "This sequencing is normal here — keep moving" },
      { key: "itemize_quietly", label: "Itemize quietly and keep Salim on the file" },
      { key: "defend_retainer", label: "Defend the retainer; the window is still open" },
    ],
    david: [
      { key: "cannot_explain", label: "I can book it; I cannot explain it to Audit" },
      { key: "force_sow", label: "Force a scope of work before anything else clears" },
      { key: "materiality_flag", label: "Flag materiality even if the amount looks small" },
    ],
    priya: [
      { key: "name_the_cost", label: "Name this as access cost, not coordination" },
      { key: "community_lens", label: "Ask who pays if this process turns ugly" },
      { key: "slow_the_slide", label: "Slow the slide into plausible deniability" },
    ],
    tom: [
      { key: "stop_payments", label: "Stop further payments until diligence catches up" },
      { key: "rewrite_scope", label: "Rewrite scope or unwind the engagement" },
      { key: "board_visibility", label: "Put Audit & Risk on notice with facts, not spin" },
    ],
  },

  s3_clean_file: {
    marcus: [
      { key: "push_award", label: "Push for award on technical merit alone" },
      { key: "quiet_relationships", label: "Keep relationships warm without paper trails" },
      { key: "accept_clean_loss", label: "Accept a clean loss if the formal process fails" },
    ],
    david: [
      { key: "defend_numbers", label: "Defend the numbers without inventing access" },
      { key: "contingency_plan", label: "Board needs a contingency if we lose clean" },
      { key: "no_late_side_deal", label: "No late side deal that reopens intermediary risk" },
    ],
    priya: [
      { key: "hold_the_line", label: "Hold the line — clean process is the strategy" },
      { key: "stakeholder_story", label: "Make the stakeholder story as strong as the bid" },
      { key: "resist_shortcut", label: "Resist last-minute shortcuts dressed as pragmatism" },
    ],
    tom: [
      { key: "keep_file_clean", label: "Keep the file clean through award" },
      { key: "no_retro_paper", label: "No retroactive papering of informal contacts" },
      { key: "escalate_pressure", label: "Escalate any pressure to bypass controls" },
    ],
  },

  s3_gap_record: {
    marcus: [
      { key: "close_the_gap", label: "Close the record gap before it becomes the story" },
      { key: "preserve_access", label: "Preserve access while legal catches the paper" },
      { key: "own_the_ambiguity", label: "Own the ambiguity — we chose speed" },
    ],
    david: [
      { key: "reconstruct_trail", label: "Reconstruct a trail Audit can defend" },
      { key: "reserve_exposure", label: "Reserve for exposure if the gap widens" },
      { key: "stop_unclear_spend", label: "Stop unclear spend until the ledger matches reality" },
    ],
    priya: [
      { key: "honesty_over_optics", label: "Honesty over optics on what we bought" },
      { key: "who_was_harmed", label: "Ask who was harmed by the ambiguity" },
      { key: "no_memory_hole", label: "Do not memory-hole the gap in the debrief" },
    ],
    tom: [
      { key: "cure_the_record", label: "Cure the record or unwind the arrangement" },
      { key: "independent_review", label: "Independent review before the next payment" },
      { key: "board_now", label: "Brief Audit & Risk now, not after a leak" },
    ],
  },

  s3_managed: {
    marcus: [
      { key: "manage_through", label: "Manage through — the relationship is the asset" },
      { key: "contain_fallout", label: "Contain fallout without killing the channel" },
      { key: "double_down_access", label: "Double down on access while we still can" },
    ],
    david: [
      { key: "cost_the_containment", label: "Cost the containment plan in real dollars" },
      { key: "disclosure_trigger", label: "Know the disclosure trigger before we trip it" },
      { key: "exit_economics", label: "Model exit economics if management fails" },
    ],
    priya: [
      { key: "managed_is_not_resolved", label: "Managed is not resolved — say so aloud" },
      { key: "public_test", label: "Would this management plan survive a headline?" },
      { key: "center_affected", label: "Center the people affected, not the narrative" },
    ],
    tom: [
      { key: "end_management_fiction", label: "End the management fiction if risk is live" },
      { key: "privileged_review", label: "Privileged review of every commitment made" },
      { key: "preserve_privilege", label: "Preserve privilege — and the truth underneath" },
    ],
  },
};
