"use server";
import { redirect } from "next/navigation";
export async function enterAsStudent() { redirect("/group/join"); }
export async function enterAsInstructor() { redirect("/login"); }
