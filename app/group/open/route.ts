import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getParticipantByToken, joinByToken } from "@/lib/db/group-queries";
import { seatDisplayName } from "@/lib/case/group-roles";
import { SEAT_COOKIE } from "@/lib/group-cookie";

function cleanSeatName(roleKey: string, stored: string | null | undefined) {
  const raw = stored?.trim();
  if (raw && !/^you\b/i.test(raw) && !raw.startsWith("You —")) return raw;
  return seatDisplayName(roleKey);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/professor", request.url));
  }

  try {
    const found = await getParticipantByToken(token);
    if (!found || found.isAi) {
      return new NextResponse("Invalid seat token", { status: 400 });
    }

    const email = `seat-${found.sessionId.slice(0, 8)}-${found.roleKey}@dev.local`;
    const displayName = cleanSeatName(found.roleKey, found.displayName);

    let [guest] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!guest) {
      [guest] = await db
        .insert(profiles)
        .values({ email, name: displayName, role: "student" })
        .returning();
    } else if (
      guest.name &&
      (guest.name.startsWith("You") || /^you\b/i.test(guest.name))
    ) {
      await db
        .update(profiles)
        .set({ name: displayName })
        .where(eq(profiles.id, guest.id));
      guest = { ...guest, name: displayName };
    }

    const participant = await joinByToken({
      profile: guest,
      token,
      displayName,
    });

    const dest = new URL(
      `/group/${participant.sessionId}?t=${encodeURIComponent(token)}`,
      request.url,
    );
    const response = NextResponse.redirect(dest);
    // Store join_token for API seat verification
    response.cookies.set(SEAT_COOKIE, token, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Open failed";
    return new NextResponse(message, { status: 500 });
  }
}
