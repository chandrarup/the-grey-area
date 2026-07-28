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
import type { InviteEnvCheck } from "@/lib/email/types";
import {
  appBaseUrlServer,
  checkInviteEnv,
  emailFromAddress,
  emailTestTo,
  getResend,
} from "@/lib/email/resend";

const SEND_GAP_MS = 350;

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
    groupDisplayName: row.groupDisplayName,
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

function formatResendError(error: unknown): string {
  if (!error) return "Unknown Resend error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const e = error as { message?: string; name?: string; statusCode?: number };
    const parts = [
      e.name,
      e.statusCode ? `HTTP ${e.statusCode}` : null,
      e.message,
    ].filter(Boolean);
    if (parts.length) return parts.join(": ");
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

async function sendOneInvite(
  row: BatchRosterResultRow,
  opts?: { overrideTo?: string | null; persistStatus?: boolean },
): Promise<InviteSendResult> {
  const payload = payloadForRow(row);
  const overrideTo = opts?.overrideTo?.trim() || null;
  /** Global EMAIL_TEST_TO redirects class mail; explicit override is for "Send test to myself". */
  const testTo = overrideTo || emailTestTo();
  const deliveredTo = testTo || row.email;
  const persistStatus = opts?.persistStatus !== false && !overrideTo;

  if (testTo) {
    console.info(
      `[invite] → ${testTo} (intended ${row.email}) participant=${row.participantId} role=${row.roleKey} group=${row.groupDisplayName || row.groupCode}`,
    );
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
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
      const message = formatResendError(error);
      console.error(`[invite] FAILED intended=${row.email}`, error);
      if (persistStatus) {
        await setParticipantInviteStatus(row.participantId, "failed", message);
      }
      return {
        participantId: row.participantId,
        intendedEmail: row.email,
        deliveredTo,
        status: "failed",
        error: message,
      };
    }
    console.info(
      `[invite] SENT id=${data?.id ?? "?"} intended=${row.email} to=${deliveredTo}`,
    );
    if (persistStatus) {
      await setParticipantInviteStatus(row.participantId, "sent", null);
    }
    return {
      participantId: row.participantId,
      intendedEmail: row.email,
      deliveredTo,
      status: "sent",
    };
  } catch (err) {
    const message = formatResendError(err);
    console.error(`[invite] EXCEPTION intended=${row.email}`, err);
    if (persistStatus) {
      await setParticipantInviteStatus(row.participantId, "failed", message);
    }
    return {
      participantId: row.participantId,
      intendedEmail: row.email,
      deliveredTo,
      status: "failed",
      error: message,
    };
  }
}

export function getInvitePreflight(): InviteEnvCheck {
  return checkInviteEnv();
}

export async function sendBatchInvites(
  batchId: string,
  opts?: { onlyFailed?: boolean; participantIds?: string[] },
): Promise<{
  results: InviteSendResult[];
  roster: BatchRosterResultRow[];
  preflight: InviteEnvCheck;
}> {
  const preflight = checkInviteEnv();
  if (!preflight.ok) {
    throw new Error(preflight.message ?? "Email is not configured.");
  }

  const batch = await getGroupBatch(batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.status === "draft") {
    throw new Error("Confirm groups first — this batch has no sessions yet.");
  }

  let roster = await listBatchRoster(batchId);
  roster = roster.filter((r) => r.email.trim().length > 0);

  if (opts?.participantIds?.length) {
    const set = new Set(opts.participantIds);
    roster = roster.filter((r) => set.has(r.participantId));
  } else if (opts?.onlyFailed) {
    roster = roster.filter((r) => r.inviteStatus === "failed");
  } else {
    roster = roster.filter(
      (r) => r.inviteStatus === "pending" || r.inviteStatus === "failed",
    );
  }

  if (roster.length === 0) {
    return {
      results: [],
      roster: await listBatchRoster(batchId),
      preflight,
    };
  }

  const results: InviteSendResult[] = [];
  for (let i = 0; i < roster.length; i++) {
    const row = roster[i]!;
    results.push(await sendOneInvite(row, { persistStatus: true }));
    if (i < roster.length - 1) await sleep(SEND_GAP_MS);
  }

  return {
    results,
    roster: await listBatchRoster(batchId),
    preflight,
  };
}

export async function resendParticipantInvite(
  participantId: string,
): Promise<InviteSendResult> {
  const preflight = checkInviteEnv();
  if (!preflight.ok) {
    throw new Error(preflight.message ?? "Email is not configured.");
  }
  const target = await getParticipantInviteTarget(participantId);
  if (!target) throw new Error("Participant not found or missing email/token");
  const row: BatchRosterResultRow = {
    participantId: target.participant.id,
    name:
      target.participant.assignedName ??
      target.participant.displayName ??
      target.participant.roleKey,
    email: target.participant.assignedEmail!,
    groupCode: target.session.code,
    groupDisplayName:
      target.session.displayName?.trim() || target.session.code,
    sessionId: target.session.id,
    caseSlug: target.session.caseSlug,
    roleKey: target.participant.roleKey,
    joinToken: target.participant.joinToken!,
    inviteStatus: target.participant.inviteStatus,
    inviteError: target.participant.inviteError ?? null,
    invitedAt: target.participant.invitedAt?.toISOString() ?? null,
  };
  return sendOneInvite(row, { persistStatus: true });
}

/**
 * Send one invite payload to a test inbox (EMAIL_TEST_TO or override),
 * using the first human seat in the batch as the template.
 * Does not update that seat's invite_status.
 */
export async function sendTestInvite(
  batchId: string,
  toAddress?: string | null,
): Promise<InviteSendResult & { preflight: InviteEnvCheck }> {
  const preflight = checkInviteEnv();
  if (!preflight.ok) {
    throw new Error(preflight.message ?? "Email is not configured.");
  }
  const to = toAddress?.trim() || emailTestTo();
  if (!to) {
    throw new Error(
      "No test address. Set EMAIL_TEST_TO or type an address in the test field.",
    );
  }

  const roster = (await listBatchRoster(batchId)).filter(
    (r) => r.email.trim().length > 0,
  );
  if (roster.length === 0) {
    throw new Error("No roster seats with email to use as a test template.");
  }
  const row = roster[0]!;
  const result = await sendOneInvite(row, {
    overrideTo: to,
    persistStatus: false,
  });
  return { ...result, preflight };
}
