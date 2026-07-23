import { NextResponse } from "next/server";
import { getProfessorActor } from "@/lib/mode";
import {
  getBatchBoardSnapshot,
  getGroupBatch,
} from "@/lib/db/group-queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await getProfessorActor();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const batch = await getGroupBatch(id);
  if (!batch) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const rows = await getBatchBoardSnapshot(id);
  return NextResponse.json({
    batchId: batch.id,
    name: batch.name,
    caseSlug: batch.caseSlug,
    updatedAt: new Date().toISOString(),
    rows,
  });
}
