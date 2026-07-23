/**
 * SERVER ONLY — send batch seat invites via Resend.
 */
import { getCase } from "@/lib/case/registry";
import {
  getGroupBatch,
  getParticipantInviteTarget,
  listBatchRoster,
  setParticipantInviteStatus,
  type BatchRosterResultRow,
} from "@/lib/db/group-queries";
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  type InviteEmailPayload,
} from "@/lib/email/invite-template";
import {
  appBaseUrlServer,
  emailFromAddress,
  emailTestTo,
  getResend,
} from "@/lib/email/resend";

const SEND_GAP_MS = 350; // ~3/sec — stay under provider rate limits

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function joinUrlForToken(token: string): string {
  return `${appBaseUrlServer()}/?join=${encodeURIComponent(token)}`;
}

function payloadForRow(row: BatchRosterResultRow): InviteEmailPayload {
  const caseTitle =
    getCase(row.caseSlug || "cost-of-winning").title || "The Cost of Winning";
  return {
    studentName: row.name,
    intendedEmail: row.email,
    caseTitle,
    roleKey: row.roleKey,
    groupCode: row.groupCode,
    joinUrl: joinUrlForToken(row.joinToken),
  };
}

export type InviteSendResult = {
  participantId: string;
  intendedEmail: string;
  deliveredTo: string;
  status: "sent" | "failed";
  error?: string;
};

async function sendOneInvite(
  row: BatchRosterResultRow,
): Promise<InviteSendResult> {
  const payload = payloadForRow(row);
  const testTo = emailTestTo();
  const deliveredTo = testTo || row.email;

  if (testTo) {
    console.info(
      `[invite] TEST MODE → ${testTo} (intended ${row.email}) participant=${row.participantId} role=${row.roleKey} group=${row.groupCode}`,
    );
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: emailFromAddress(),
      to: [deliveredTo],
      subject: buildInviteSubject(payload),
      text: buildInviteText(payload),
      html: buildInviteHtml(payload),
      headers: testTo
        ? { "X-Intended-Recipient": row.email }
        : undefined,
    });
    if (error) {
      await setParticipantInviteStatus(row.participantId, "failed");
      return {
        participantId: row.participantId,
        intendedEmail: row.email,
        deliveredTo,
        status: "failed",
        error: error.message,
      };
    }
    await setParticipantInviteStatus(row.participantId, "sent");
    return {
      participantId: row.participantId,
      intendedEmail: row.email,
      deliveredTo,
      status: "sent",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setParticipantInviteStatus(row.participantId, "failed");
    return {
      participantId: row.participantId,
      intendedEmail: row.email,
      deliveredTo,
      status: "failed",
      error: message,
    };
  }
}

export async function sendBatchInvites(
  batchId: string,
  opts?: { onlyFailed?: boolean; participantIds?: string[] },
): Promise<{
  results: InviteSendResult[];
  roster: BatchRosterResultRow[];
}> {
  const batch = await getGroupBatch(batchId);
  if (!batch) throw new Error("Batch not found");

  let roster = await listBatchRoster(batchId);
  roster = roster.filter((r) => r.email.trim().length > 0);

  if (opts?.participantIds?.length) {
    const set = new Set(opts.participantIds);
    roster = roster.filter((r) => set.has(r.participantId));
  } else if (opts?.onlyFailed) {
    roster = roster.filter((r) => r.inviteStatus === "failed");
  } else {
    // Default: pending + failed (skip already sent unless explicit resend)
    roster = roster.filter(
      (r) => r.inviteStatus === "pending" || r.inviteStatus === "failed",
    );
  }

  const results: InviteSendResult[] = [];
  for (let i = 0; i < roster.length; i++) {
    const row = roster[i]!;
    results.push(await sendOneInvite(row));
    if (i < roster.length - 1) await sleep(SEND_GAP_MS);
  }

  return { results, roster: await listBatchRoster(batchId) };
}

export async function resendParticipantInvite(
  participantId: string,
): Promise<InviteSendResult> {
  const target = await getParticipantInviteTarget(participantId);
  if (!target) throw new Error("Participant not found or missing email/token");
  const row = {
    participantId: target.participant.id,
    name:
      target.participant.assignedName ??
      target.participant.displayName ??
      target.participant.roleKey,
    email: target.participant.assignedEmail!,
    groupCode: target.session.code,
    sessionId: target.session.id,
    caseSlug: target.session.caseSlug,
    roleKey: target.participant.roleKey,
    joinToken: target.participant.joinToken!,
    inviteStatus: target.participant.inviteStatus,
    invitedAt: target.participant.invitedAt?.toISOString() ?? null,
  };
  return sendOneInvite(row);
}
