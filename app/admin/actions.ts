"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateCaseStatus, updateProfileRole } from "@/lib/db/queries";

export async function setCaseStatus(
  caseId: string,
  status: "draft" | "published" | "archived",
) {
  const profile = await requireAdmin();
  await updateCaseStatus(profile, caseId, status);
  revalidatePath("/admin");
}

export async function setUserRole(
  userId: string,
  role: "student" | "professor" | "admin",
) {
  const profile = await requireAdmin();
  await updateProfileRole(profile, userId, role);
  revalidatePath("/admin");
}
