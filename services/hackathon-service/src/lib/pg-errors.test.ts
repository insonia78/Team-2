import { describe, expect, it } from "vitest";

import { mapDatabaseError } from "./pg-errors.js";

describe("mapDatabaseError", () => {
  it("maps a unique website violation to 409", () => {
    expect(mapDatabaseError({ code: "23505" })).toEqual({
      statusCode: 409,
      error: "Duplicate official_website.",
    });
  });

  it("maps wrapped check violations to the research-rule message", () => {
    const error = {
      message: "query failed",
      cause: { code: "23514", constraint: "hackathons_verified_rules" },
    };

    expect(mapDatabaseError(error)?.statusCode).toBe(400);
    expect(mapDatabaseError(error)?.error).toMatch(/evidence/i);
  });

  it("maps a pending follow-up answer to 400", () => {
    expect(
      mapDatabaseError({
        code: "23514",
        constraint: "organizer_followups_pending_has_no_answer",
      })?.error,
    ).toMatch(/pending/i);
  });
});
