import { z } from "zod";

export const followupCreateSchema = z.object({
  hackathon_id: z.string().uuid().optional(),
  event_name: z.string().min(1),
  question: z.string().min(1),
  contact_channel: z.string().optional(),
  assigned_member: z.string().optional(),
  sent_date: z.string().date().optional(),
  response_status: z
    .enum(["Pending", "Sent", "Replied", "No response", "Closed"])
    .default("Pending"),
  confirmed_answer: z.string().optional(),
});

export const followupUpdateSchema = followupCreateSchema.partial();
