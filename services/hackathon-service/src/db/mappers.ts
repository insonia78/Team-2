import type { HackathonInsert, HackathonRow, OrganizerFollowupRow } from "./schema.js";
import type { HackathonCreateInput, HackathonUpdateInput } from "../schemas/hackathon.js";

export function toHackathonInsert(payload: HackathonCreateInput): HackathonInsert {
  return {
    eventName: payload.event_name,
    officialWebsite: payload.official_website,
    organizer: payload.organizer,
    registrationLink: payload.registration_link,
    rulesFaqUrl: payload.rules_faq_url,
    city: payload.city,
    stateRegion: payload.state_region,
    country: payload.country,
    venue: payload.venue,
    format: payload.format,
    eventStart: payload.event_start,
    eventEnd: payload.event_end,
    registrationDeadline: payload.registration_deadline
      ? new Date(payload.registration_deadline)
      : undefined,
    registrationStatus: payload.registration_status,
    lastVerifiedDate: payload.last_verified_date,
    studentEligibility: payload.student_eligibility,
    outsideSchoolEligibility: payload.outside_school_eligibility,
    internationalStudentWording: payload.international_student_wording,
    ageRules: payload.age_rules,
    teamSize: payload.team_size,
    soloTeamFormationRules: payload.solo_team_formation_rules,
    registrationFee: payload.registration_fee,
    travelSupport: payload.travel_support,
    lodging: payload.lodging,
    meals: payload.meals,
    reimbursementConditions: payload.reimbursement_conditions,
    technicalTracks: payload.technical_tracks,
    aiPolicy: payload.ai_policy,
    preExistingCodePolicy: payload.pre_existing_code_policy,
    ipTerms: payload.ip_terms,
    judgingCriteria: payload.judging_criteria,
    prizes: payload.prizes,
    sponsorRecruitingBenefits: payload.sponsor_recruiting_benefits,
    applicationRequirements: payload.application_requirements,
    organizerContact: payload.organizer_contact,
    evidenceLinks: payload.evidence_links,
    unresolvedQuestions: payload.unresolved_questions,
    researcherName: payload.researcher_name,
    verifierName: payload.verifier_name,
    status: payload.status,
    confidence: payload.confidence,
    isShortlisted: payload.is_shortlisted,
    shortlistRationale: payload.shortlist_rationale,
  };
}

export function toHackathonUpdate(patch: HackathonUpdateInput): Partial<HackathonInsert> {
  const update: Partial<HackathonInsert> = {};
  if (patch.event_name !== undefined) update.eventName = patch.event_name;
  if (patch.official_website !== undefined) update.officialWebsite = patch.official_website;
  if (patch.organizer !== undefined) update.organizer = patch.organizer;
  if (patch.registration_link !== undefined) update.registrationLink = patch.registration_link;
  if (patch.rules_faq_url !== undefined) update.rulesFaqUrl = patch.rules_faq_url;
  if (patch.city !== undefined) update.city = patch.city;
  if (patch.state_region !== undefined) update.stateRegion = patch.state_region;
  if (patch.country !== undefined) update.country = patch.country;
  if (patch.venue !== undefined) update.venue = patch.venue;
  if (patch.format !== undefined) update.format = patch.format;
  if (patch.event_start !== undefined) update.eventStart = patch.event_start;
  if (patch.event_end !== undefined) update.eventEnd = patch.event_end;
  if (patch.registration_deadline !== undefined) {
    update.registrationDeadline = new Date(patch.registration_deadline);
  }
  if (patch.registration_status !== undefined) update.registrationStatus = patch.registration_status;
  if (patch.last_verified_date !== undefined) update.lastVerifiedDate = patch.last_verified_date;
  if (patch.student_eligibility !== undefined) update.studentEligibility = patch.student_eligibility;
  if (patch.outside_school_eligibility !== undefined) {
    update.outsideSchoolEligibility = patch.outside_school_eligibility;
  }
  if (patch.international_student_wording !== undefined) {
    update.internationalStudentWording = patch.international_student_wording;
  }
  if (patch.age_rules !== undefined) update.ageRules = patch.age_rules;
  if (patch.team_size !== undefined) update.teamSize = patch.team_size;
  if (patch.solo_team_formation_rules !== undefined) {
    update.soloTeamFormationRules = patch.solo_team_formation_rules;
  }
  if (patch.registration_fee !== undefined) update.registrationFee = patch.registration_fee;
  if (patch.travel_support !== undefined) update.travelSupport = patch.travel_support;
  if (patch.lodging !== undefined) update.lodging = patch.lodging;
  if (patch.meals !== undefined) update.meals = patch.meals;
  if (patch.reimbursement_conditions !== undefined) {
    update.reimbursementConditions = patch.reimbursement_conditions;
  }
  if (patch.technical_tracks !== undefined) update.technicalTracks = patch.technical_tracks;
  if (patch.ai_policy !== undefined) update.aiPolicy = patch.ai_policy;
  if (patch.pre_existing_code_policy !== undefined) {
    update.preExistingCodePolicy = patch.pre_existing_code_policy;
  }
  if (patch.ip_terms !== undefined) update.ipTerms = patch.ip_terms;
  if (patch.judging_criteria !== undefined) update.judgingCriteria = patch.judging_criteria;
  if (patch.prizes !== undefined) update.prizes = patch.prizes;
  if (patch.sponsor_recruiting_benefits !== undefined) {
    update.sponsorRecruitingBenefits = patch.sponsor_recruiting_benefits;
  }
  if (patch.application_requirements !== undefined) {
    update.applicationRequirements = patch.application_requirements;
  }
  if (patch.organizer_contact !== undefined) update.organizerContact = patch.organizer_contact;
  if (patch.evidence_links !== undefined) update.evidenceLinks = patch.evidence_links;
  if (patch.unresolved_questions !== undefined) update.unresolvedQuestions = patch.unresolved_questions;
  if (patch.researcher_name !== undefined) update.researcherName = patch.researcher_name;
  if (patch.verifier_name !== undefined) update.verifierName = patch.verifier_name;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.confidence !== undefined) update.confidence = patch.confidence;
  if (patch.is_shortlisted !== undefined) update.isShortlisted = patch.is_shortlisted;
  if (patch.shortlist_rationale !== undefined) update.shortlistRationale = patch.shortlist_rationale;
  return update;
}

export function hackathonToApi(row: HackathonRow) {
  return {
    id: row.id,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    event_name: row.eventName,
    organizer: row.organizer,
    official_website: row.officialWebsite,
    registration_link: row.registrationLink,
    rules_faq_url: row.rulesFaqUrl,
    city: row.city,
    state_region: row.stateRegion,
    country: row.country,
    venue: row.venue,
    format: row.format,
    event_start: row.eventStart,
    event_end: row.eventEnd,
    registration_deadline: row.registrationDeadline,
    registration_status: row.registrationStatus,
    last_verified_date: row.lastVerifiedDate,
    student_eligibility: row.studentEligibility,
    outside_school_eligibility: row.outsideSchoolEligibility,
    international_student_wording: row.internationalStudentWording,
    age_rules: row.ageRules,
    team_size: row.teamSize,
    solo_team_formation_rules: row.soloTeamFormationRules,
    registration_fee: row.registrationFee,
    travel_support: row.travelSupport,
    lodging: row.lodging,
    meals: row.meals,
    reimbursement_conditions: row.reimbursementConditions,
    technical_tracks: row.technicalTracks,
    ai_policy: row.aiPolicy,
    pre_existing_code_policy: row.preExistingCodePolicy,
    ip_terms: row.ipTerms,
    judging_criteria: row.judgingCriteria,
    prizes: row.prizes,
    sponsor_recruiting_benefits: row.sponsorRecruitingBenefits,
    application_requirements: row.applicationRequirements,
    organizer_contact: row.organizerContact,
    evidence_links: row.evidenceLinks,
    unresolved_questions: row.unresolvedQuestions,
    researcher_name: row.researcherName,
    verifier_name: row.verifierName,
    status: row.status,
    confidence: row.confidence,
    is_shortlisted: row.isShortlisted,
    shortlist_rationale: row.shortlistRationale,
  };
}

export function followupToApi(row: OrganizerFollowupRow) {
  return {
    id: row.id,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    hackathon_id: row.hackathonId,
    event_name: row.eventName,
    question: row.question,
    contact_channel: row.contactChannel,
    assigned_member: row.assignedMember,
    sent_date: row.sentDate,
    response_status: row.responseStatus,
    confirmed_answer: row.confirmedAnswer,
  };
}
