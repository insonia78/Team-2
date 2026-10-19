type PgErrorFields = {
  code?: string;
  constraint?: string;
  cause?: unknown;
};

const CHECK_MESSAGES: Record<string, string> = {
  hackathons_verified_rules:
    "Verified records require at least one evidence link, a verifier different from the researcher, and confidence above Low.",
  hackathons_shortlist_rationale_required: "Shortlisted records require shortlist_rationale.",
  hackathons_evidence_links_array: "evidence_links must be a JSON array.",
  organizer_followups_pending_has_no_answer:
    "Cannot store confirmed_answer while response_status is Pending.",
};

function asPgError(error: unknown): PgErrorFields | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as PgErrorFields;
  if (typeof candidate.code === "string") {
    return candidate;
  }

  if (candidate.cause !== undefined) {
    return asPgError(candidate.cause);
  }

  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return asPgError(error)?.code === "23505";
}

export function mapDatabaseError(error: unknown): { statusCode: number; error: string } | undefined {
  const pgError = asPgError(error);
  if (!pgError?.code) {
    return undefined;
  }

  if (pgError.code === "23505") {
    return { statusCode: 409, error: "Duplicate official_website." };
  }

  if (pgError.code === "23514") {
    const message =
      (pgError.constraint && CHECK_MESSAGES[pgError.constraint]) || "Record violates a database rule.";
    return { statusCode: 400, error: message };
  }

  return undefined;
}
