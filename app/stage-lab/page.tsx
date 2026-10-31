import { requireStaff } from "@/lib/auth";
import LabEntry from "./lab-entry";
export default async function Page() { await requireStaff(); return <LabEntry />; }
