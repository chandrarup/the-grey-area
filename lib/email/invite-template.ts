import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";

export type InviteEmailPayload = {
  studentName: string;
  intendedEmail: string;
  caseTitle: string;
  roleKey: string;
  groupCode: string;
  joinUrl: string;
};

export function roleOneLiner(roleKey: string): string {
  const brief = GROUP_ROLES[roleKey as SeatKey];
  if (!brief) return `You are playing ${roleKey}.`;
  const stance = brief.initialStance.replace(/\.$/, "");
  return `You are ${brief.name}, ${brief.title} — ${stance}.`;
}

export function buildInviteSubject(payload: InviteEmailPayload): string {
  const brief = GROUP_ROLES[payload.roleKey as SeatKey];
  const character = brief?.name ?? payload.roleKey;
  return `Your seat: ${character} · ${payload.caseTitle} (${payload.groupCode})`;
}

export function buildInviteText(payload: InviteEmailPayload): string {
  const brief = GROUP_ROLES[payload.roleKey as SeatKey];
  const character = brief?.name ?? payload.roleKey;
  const lines = [
    `Hi ${payload.studentName},`,
    "",
    `You have been assigned a seat in The Grey Area — ${payload.caseTitle}.`,
    "",
    roleOneLiner(payload.roleKey),
    "",
    `Group code: ${payload.groupCode}`,
    `Character: ${character}`,
    "",
    `Open your seat (do not share this link):`,
    payload.joinUrl,
    "",
    "Use this link on your own device. It opens your confidential brief and locks you into this character.",
    "",
    "— The Grey Area",
  ];
  return lines.join("\n");
}

/** Dark branded HTML matching the app accent. */
export function buildInviteHtml(payload: InviteEmailPayload): string {
  const brief = GROUP_ROLES[payload.roleKey as SeatKey];
  const character = brief?.name ?? payload.roleKey;
  const title = brief?.title ?? payload.roleKey;
  const blurb = roleOneLiner(payload.roleKey);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(buildInviteSubject(payload))}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0a;color:#f2f0ec;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#161513;border:1px solid #2a2825;">
          <tr>
            <td style="padding:28px 28px 8px;border-left:3px solid #4a6c8c;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9c9893;">The Grey Area</p>
              <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#f2f0ec;line-height:1.25;">${escapeHtml(payload.caseTitle)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#f2f0ec;">Hi ${escapeHtml(payload.studentName)},</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#9c9893;">You have been assigned a seat in this simulation.</p>
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9c9893;">Your character</p>
              <p style="margin:0 0 4px;font-size:18px;color:#f2f0ec;">${escapeHtml(character)}</p>
              <p style="margin:0 0 16px;font-size:13px;color:#9c9893;">${escapeHtml(title)}</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:#f2f0ec;border-left:2px solid #4a6c8c;padding-left:12px;">${escapeHtml(blurb)}</p>
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9c9893;">Group code</p>
              <p style="margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;color:#f2f0ec;">${escapeHtml(payload.groupCode)}</p>
              <a href="${escapeAttr(payload.joinUrl)}" style="display:inline-block;background:#4a6c8c;color:#f5f3ef;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600;">Open your seat</a>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#9c9893;">This link is unique to you — do not share it. It opens your confidential brief for this group.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #2a2825;">
              <p style="margin:0;font-size:11px;color:#6b6863;">If the button does not work, paste this URL into your browser:<br />
              <span style="word-break:break-all;color:#9c9893;">${escapeHtml(payload.joinUrl)}</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
