export type PlanStatus = "ACTIVE" | "MONITORING" | "COMPLETED" | "ARCHIVED";
export type PlanPriority = "HIGH" | "MEDIUM" | "LOW";

export type UserRole = "counselor" | "caseworker" | "observer";

export type RoleConfig = {
  role: UserRole;
  label: string;
  badge: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  description: string;
};

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  counselor: {
    role: "counselor",
    label: "Lead Counselor",
    badge: "Admin / Full Access",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    description: "Full clinical authority: create, update, delete, and archive support plans."
  },
  caseworker: {
    role: "caseworker",
    label: "Support Specialist",
    badge: "Read & Update",
    canCreate: true,
    canEdit: true,
    canDelete: false,
    description: "Can record observations and edit existing goals. Deletions restricted to Lead."
  },
  observer: {
    role: "observer",
    label: "Teacher / Observer",
    badge: "Read Only",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    description: "View caseload and review timelines. Direct record mutations disabled."
  }
};

export type SupportPlan = {
  id: string;
  studentName: string;
  grade: number;
  owner: string;
  concern: string;
  goal: string;
  nextReview: string;
  status: PlanStatus;
  priority: PlanPriority;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportPlanInput = Omit<SupportPlan, "id" | "createdAt" | "updatedAt">;

export type AiSuggestion = {
  source: string;
  suggestedGoal: string;
  interventions: string[];
  recommendedPriority: PlanPriority;
  rationale: string;
};
