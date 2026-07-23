import * as XLSX from "xlsx";
import {
  isValidEmail,
  normalizeEmail,
  type RosterStudent,
} from "@/lib/group/batch-plan";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}`;
}

function pickColumn(
  row: Record<string, unknown>,
  candidates: string[],
): string {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find((k) => k.trim().toLowerCase() === c);
    if (hit != null && row[hit] != null && String(row[hit]).trim()) {
      return String(row[hit]).trim();
    }
  }
  // fuzzy: any key containing name / email
  for (const c of candidates) {
    const hit = keys.find((k) => k.trim().toLowerCase().includes(c));
    if (hit != null && row[hit] != null && String(row[hit]).trim()) {
      return String(row[hit]).trim();
    }
  }
  return "";
}

export type ParseRosterResult = {
  students: RosterStudent[];
  errors: string[];
};

export function parseRosterArrayBuffer(buf: ArrayBuffer): ParseRosterResult {
  const workbook = XLSX.read(buf, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { students: [], errors: ["File has no sheets"] };
  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return parseRosterRows(rows);
}

export function parseRosterRows(
  rows: Record<string, unknown>[],
): ParseRosterResult {
  const students: RosterStudent[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const name = pickColumn(row, ["name", "full name", "student", "student name"]);
    const emailRaw = pickColumn(row, [
      "email",
      "e-mail",
      "mail",
      "student email",
    ]);
    if (!name && !emailRaw) return;
    if (!name) {
      errors.push(`Row ${i + 2}: missing name`);
      return;
    }
    if (!emailRaw) {
      errors.push(`Row ${i + 2}: missing email (${name})`);
      return;
    }
    if (!isValidEmail(emailRaw)) {
      errors.push(`Row ${i + 2}: invalid email "${emailRaw}"`);
      return;
    }
    const email = normalizeEmail(emailRaw);
    if (seen.has(email)) {
      errors.push(`Row ${i + 2}: duplicate email ${email}`);
      return;
    }
    seen.add(email);
    students.push({ id: newId(), name, email });
  });

  return { students, errors };
}
