import {
  boolean,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const hackathons = pgTable("hackathons", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  eventName: text("event_name").notNull(),
  organizer: text("organizer"),
  officialWebsite: text("official_website").notNull(),
  registrationLink: text("registration_link"),
  rulesFaqUrl: text("rules_faq_url"),

  city: text("city"),
  stateRegion: text("state_region"),
  country: text("country"),
  venue: text("venue"),
  format: text("format"),

  eventStart: date("event_start"),
  eventEnd: date("event_end"),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  registrationStatus: text("registration_status"),
  lastVerifiedDate: date("last_verified_date"),

  studentEligibility: text("student_eligibility"),
  outsideSchoolEligibility: text("outside_school_eligibility"),
  internationalStudentWording: text("international_student_wording"),
  ageRules: text("age_rules"),
  teamSize: text("team_size"),
  soloTeamFormationRules: text("solo_team_formation_rules"),

  registrationFee: text("registration_fee"),
  travelSupport: text("travel_support"),
  lodging: text("lodging"),
  meals: text("meals"),
  reimbursementConditions: text("reimbursement_conditions"),

  technicalTracks: text("technical_tracks"),
  aiPolicy: text("ai_policy"),
  preExistingCodePolicy: text("pre_existing_code_policy"),
  ipTerms: text("ip_terms"),
  judgingCriteria: text("judging_criteria"),
  prizes: text("prizes"),
  sponsorRecruitingBenefits: text("sponsor_recruiting_benefits"),
  applicationRequirements: text("application_requirements"),
  organizerContact: text("organizer_contact"),

  evidenceLinks: jsonb("evidence_links").$type<Array<{ label: string; url: string }>>().notNull().default([]),
  unresolvedQuestions: text("unresolved_questions"),

  researcherName: text("researcher_name"),
  verifierName: text("verifier_name"),

  status: text("status").notNull().default("Needs Confirmation"),
  confidence: text("confidence").notNull().default("Low"),

  isShortlisted: boolean("is_shortlisted").notNull().default(false),
  shortlistRationale: text("shortlist_rationale"),
});

export const organizerFollowups = pgTable("organizer_followups", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  hackathonId: uuid("hackathon_id").references(() => hackathons.id, { onDelete: "set null" }),
  eventName: text("event_name").notNull(),
  question: text("question").notNull(),
  contactChannel: text("contact_channel"),
  assignedMember: text("assigned_member"),
  sentDate: date("sent_date"),
  responseStatus: text("response_status").notNull().default("Pending"),
  confirmedAnswer: text("confirmed_answer"),
});

export type HackathonRow = typeof hackathons.$inferSelect;
export type HackathonInsert = typeof hackathons.$inferInsert;
export type OrganizerFollowupRow = typeof organizerFollowups.$inferSelect;
export type OrganizerFollowupInsert = typeof organizerFollowups.$inferInsert;
