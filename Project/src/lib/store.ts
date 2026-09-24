import type { SupportPlan, SupportPlanInput } from "./types";

const seed: SupportPlan[] = [
  { id: "sp-1", studentName: "Maya Thompson", grade: 9, owner: "Ava Patel", concern: "Attendance", goal: "Return to 90% weekly attendance", nextReview: "2026-10-02", status: "ACTIVE", priority: "HIGH", notes: "Family check-in scheduled.", createdAt: "2026-09-15T09:00:00.000Z", updatedAt: "2026-09-22T09:00:00.000Z" },
  { id: "sp-2", studentName: "Jordan Lee", grade: 11, owner: "Ava Patel", concern: "Belonging", goal: "Join one interest-based club", nextReview: "2026-10-09", status: "MONITORING", priority: "MEDIUM", notes: "Student prefers a small group setting.", createdAt: "2026-09-12T09:00:00.000Z", updatedAt: "2026-09-20T09:00:00.000Z" },
  { id: "sp-3", studentName: "Sam Rivera", grade: 8, owner: "Noah Williams", concern: "Literacy", goal: "Complete two supported reading sessions weekly", nextReview: "2026-09-29", status: "ACTIVE", priority: "HIGH", notes: "Coordinate with literacy specialist.", createdAt: "2026-09-10T09:00:00.000Z", updatedAt: "2026-09-24T09:00:00.000Z" },
  { id: "sp-4", studentName: "Amara Wilson", grade: 10, owner: "Noah Williams", concern: "Wellbeing", goal: "Build a reliable morning check-in routine", nextReview: "2026-10-14", status: "COMPLETED", priority: "LOW", notes: "Transitioned to light-touch monitoring.", createdAt: "2026-08-18T09:00:00.000Z", updatedAt: "2026-09-18T09:00:00.000Z" }
];

let plans = [...seed];
export function listPlans() { return plans.sort((a, b) => a.nextReview.localeCompare(b.nextReview)); }
export function createPlan(input: SupportPlanInput): SupportPlan { const now = new Date().toISOString(); const plan = { ...input, id: `sp-${Date.now()}`, createdAt: now, updatedAt: now }; plans = [plan, ...plans]; return plan; }
export function updatePlan(id: string, input: SupportPlanInput) { const index = plans.findIndex((plan) => plan.id === id); if (index < 0) return null; plans[index] = { ...plans[index], ...input, updatedAt: new Date().toISOString() }; return plans[index]; }
export function deletePlan(id: string) { const before = plans.length; plans = plans.filter((plan) => plan.id !== id); return plans.length !== before; }
