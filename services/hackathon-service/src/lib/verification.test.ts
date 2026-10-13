import { describe, expect, it } from "vitest";

import { assertVerificationRules, normalizeWebsite } from "./verification.js";

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
