import { z } from "zod";

export const hackathonStatusSchema = z.enum([
  "Verified - Apply Now",
  "Verified - Registration Upcoming",
  "Monitor",
  "Needs Confirmation",
  "Not Eligible",
  "Closed/Expired",
  "Rejected as Unreliable",
]);

export const confidenceSchema = z.enum(["High", "Medium", "Low"]);

export const formatSchema = z.enum(["in_person", "virtual", "hybrid"]);

const evidenceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const hackathonCreateSchema = z.object({
  event_name: z.string().min(1),
  official_website: z.string().url(),
  organizer: z.string().optional(),
  registration_link: z.string().url().optional(),
  rules_faq_url: z.string().url().optional(),
  city: z.string().optional(),
  state_region: z.string().optional(),
  country: z.string().optional(),
  venue: z.string().optional(),
  format: formatSchema.optional(),
  event_start: z.string().date().optional(),
  event_end: z.string().date().optional(),
  registration_deadline: z.string().datetime().optional(),
  registration_status: z.string().optional(),
  last_verified_date: z.string().date().optional(),
  student_eligibility: z.string().optional(),
  outside_school_eligibility: z.string().optional(),
  international_student_wording: z.string().optional(),
  age_rules: z.string().optional(),
  team_size: z.string().optional(),
  solo_team_formation_rules: z.string().optional(),
  registration_fee: z.string().optional(),
  travel_support: z.string().optional(),
  lodging: z.string().optional(),
  meals: z.string().optional(),
  reimbursement_conditions: z.string().optional(),
  technical_tracks: z.string().optional(),
  ai_policy: z.string().optional(),
  pre_existing_code_policy: z.string().optional(),
  ip_terms: z.string().optional(),
  judging_criteria: z.string().optional(),
  prizes: z.string().optional(),
  sponsor_recruiting_benefits: z.string().optional(),
  application_requirements: z.string().optional(),
  organizer_contact: z.string().optional(),
  evidence_links: z.array(evidenceLinkSchema).default([]),
  unresolved_questions: z.string().optional(),
  researcher_name: z.string().optional(),
  verifier_name: z.string().optional(),
  status: hackathonStatusSchema.default("Needs Confirmation"),
  confidence: confidenceSchema.default("Low"),
  is_shortlisted: z.boolean().default(false),
  shortlist_rationale: z.string().optional(),
});

export const hackathonUpdateSchema = hackathonCreateSchema.partial();

export const hackathonListQuerySchema = z.object({
  status: hackathonStatusSchema.optional(),
  confidence: confidenceSchema.optional(),
  format: formatSchema.optional(),
  shortlisted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type HackathonCreateInput = z.infer<typeof hackathonCreateSchema>;
export type HackathonUpdateInput = z.infer<typeof hackathonUpdateSchema>;
