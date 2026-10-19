import { describe, expect, it } from "vitest";

import {
  assertFollowupRules,
  assertShortlistRules,
  assertVerificationRules,
  normalizeWebsite,
} from "./verification.js";

describe("normalizeWebsite", () => {
  it("lowercases and trims trailing slash", () => {
    expect(normalizeWebsite("HTTPS://Example.com/path/")).toBe("https://example.com/path");
  });
});

describe("assertVerificationRules", () => {
  it("allows draft records without verifier", () => {
    expect(() =>
      assertVerificationRules({
        status: "Needs Confirmation",
        confidence: "Low",
        evidence_links: [],
      }),
    ).not.toThrow();
  });

  it("blocks verified without evidence", () => {
    expect(() =>
      assertVerificationRules({
        status: "Verified - Apply Now",
        confidence: "High",
        researcher_name: "a",
        verifier_name: "b",
        evidence_links: [],
      }),
    ).toThrow(/evidence/i);
  });

  it("blocks same researcher and verifier", () => {
    expect(() =>
      assertVerificationRules({
        status: "Verified - Apply Now",
        confidence: "High",
        researcher_name: "Alex",
        verifier_name: "alex",
        evidence_links: [{ label: "site", url: "https://example.com" }],
      }),
    ).toThrow(/different/i);
  });
});

describe("assertShortlistRules", () => {
  it("requires a written rationale when the row is shortlisted", () => {
    expect(() => assertShortlistRules({ is_shortlisted: false })).not.toThrow();
    expect(() =>
      assertShortlistRules({ is_shortlisted: true, shortlist_rationale: "   " }),
    ).toThrow(/shortlist_rationale/i);
  });
});

describe("assertFollowupRules", () => {
  it("blocks a confirmed answer while the follow-up is pending", () => {
    expect(() =>
      assertFollowupRules({ response_status: "Pending", confirmed_answer: "yes" }),
    ).toThrow(/pending/i);
  });

  it("allows a confirmed answer after a reply", () => {
    expect(() =>
      assertFollowupRules({ response_status: "Replied", confirmed_answer: "Travel is covered." }),
    ).not.toThrow();
  });
});
