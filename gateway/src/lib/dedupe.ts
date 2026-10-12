import { normalizeWebsite } from "./verification.js";

export function findDuplicateByWebsite<T extends { id?: string; official_website: string }>(
  rows: T[],
  website: string,
  excludeId?: string,
): T | undefined {
  const normalized = normalizeWebsite(website);
  return rows.find(
    (row) => row.id !== excludeId && normalizeWebsite(row.official_website) === normalized,
  );
}
