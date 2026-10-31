"use server";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import type { AppMode } from "@/lib/mode";
export async function setAppMode(mode: AppMode) { await requireStaff(); redirect(mode === "student" ? "/simulation/leadership-team" : "/professor/simulations"); }
