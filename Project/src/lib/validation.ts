import { z } from "zod";

// Robust HTML & script sanitization to prevent Stored XSS attacks in educational data fields
function sanitizeText(value: string): string {
  return value
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // strip whole script tags & content
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")   // strip whole style tags & content
    .replace(/<[^>]+>/g, "")                               // strip all remaining html tags
    .replace(/javascript:/gi, "")
    .trim();
}

export const supportPlanSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Student name must be at least 2 characters")
    .max(80, "Student name cannot exceed 80 characters")
    .transform(sanitizeText),
  grade: z.coerce
    .number()
    .int("Grade must be a whole number")
    .min(6, "Grade must be between 6 and 12")
    .max(12, "Grade must be between 6 and 12"),
  owner: z
    .string()
    .trim()
    .min(2, "Case owner must be specified")
    .max(80, "Case owner cannot exceed 80 characters")
    .transform(sanitizeText),
  concern: z
    .string()
    .trim()
    .min(2, "Focus area/concern must be at least 2 characters")
    .max(80, "Focus area cannot exceed 80 characters")
    .transform(sanitizeText),
  goal: z
    .string()
    .trim()
    .min(5, "Observable goal must be at least 5 characters")
    .max(250, "Goal cannot exceed 250 characters")
    .transform(sanitizeText),
  nextReview: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Review date must be in YYYY-MM-DD format"),
  status: z.enum(["ACTIVE", "MONITORING", "COMPLETED", "ARCHIVED"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .default("")
    .transform(sanitizeText),
});

export type SupportPlanSchemaType = z.infer<typeof supportPlanSchema>;
