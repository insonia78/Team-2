import type { HackathonCreateInput, HackathonUpdateInput } from "../schemas/hackathon.js";

const VERIFIED_STATUSES = new Set([
  "Verified - Apply Now",
  "Verified - Registration Upcoming",
]);

type HackathonPayload = Partial<HackathonCreateInput> & Partial<HackathonUpdateInput>;

export function assertVerificationRules(payload: HackathonPayload): void {
  if (!payload.status || !VERIFIED_STATUSES.has(payload.status)) {
    return;
  }

  const links = payload.evidence_links ?? [];
  if (links.length === 0) {
    throw new Error("Verified records require at least one evidence link.");
  }

  if (!payload.verifier_name?.trim()) {
    throw new Error("Verified records require verifier_name (must differ from researcher).");
  }

  if (
    payload.researcher_name &&
    payload.verifier_name &&
    payload.researcher_name.trim().toLowerCase() === payload.verifier_name.trim().toLowerCase()
  ) {
    throw new Error("verifier_name must be different from researcher_name.");
  }

  if (payload.confidence === "Low") {
    throw new Error("Low confidence records cannot use a Verified status.");
  }
}

export function normalizeWebsite(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}
