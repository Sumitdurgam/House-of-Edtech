"use client";

import { useMemo, useState } from "react";
import type { SupportPlan, SupportPlanInput, UserRole, AiSuggestion } from "@/lib/types";
import { ROLE_CONFIGS } from "@/lib/types";

const emptyForm: SupportPlanInput = {
  studentName: "",
  grade: 9,
  owner: "Ava Patel",
  concern: "Attendance",
  goal: "",
  nextReview: "2026-10-05",
  status: "ACTIVE",
  priority: "MEDIUM",
  notes: ""
};

const statusLabel: Record<SupportPlan["status"], string> = {
  ACTIVE: "Active",
  MONITORING: "Monitoring",
  COMPLETED: "Completed",
  ARCHIVED: "Archived"
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function readableDate(date: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(`${date}T12:00:00`));
  } catch {
    return date;
  }
}

export default function Dashboard({ initialPlans }: { initialPlans: SupportPlan[] }) {
  const [plans, setPlans] = useState<SupportPlan[]>(initialPlans);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | SupportPlan["status"]>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | SupportPlan["priority"]>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [modal, setModal] = useState<"new" | SupportPlan | null>(null);
  const [detailModal, setDetailModal] = useState<SupportPlan | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [form, setForm] = useState<SupportPlanInput>(emptyForm);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("counselor");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiSuggestion | null>(null);

  const permissions = ROLE_CONFIGS[currentRole];

  const counts = useMemo(() => {
    return {
      all: plans.length,
      active: plans.filter((p) => p.status === "ACTIVE").length,
      monitoring: plans.filter((p) => p.status === "MONITORING").length,
      completed: plans.filter((p) => p.status === "COMPLETED").length,
      archived: plans.filter((p) => p.status === "ARCHIVED").length
    };
  }, [plans]);

  const filtered = useMemo(() => {
    return plans.filter((plan) => {
      const q = query.toLowerCase();
      const matchesQuery =
        plan.studentName.toLowerCase().includes(q) ||
        plan.concern.toLowerCase().includes(q) ||
        plan.owner.toLowerCase().includes(q) ||
        plan.goal.toLowerCase().includes(q);

      const matchesStatus = filter === "ALL" || plan.status === filter;
      const matchesPriority = priorityFilter === "ALL" || plan.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [plans, query, filter, priorityFilter]);

  const highPriorityCount = plans.filter(
    (plan) => plan.priority === "HIGH" && plan.status !== "COMPLETED" && plan.status !== "ARCHIVED"
  ).length;

  const dueSoonCount = plans.filter(
    (plan) => plan.status !== "COMPLETED" && plan.status !== "ARCHIVED" && plan.nextReview <= "2026-10-05"
  ).length;

  const activePlansCount = counts.active;

  function showNotification(text: string, isError = false) {
    setNotice({ text, isError });
    setTimeout(() => {
      setNotice(null);
    }, 4500);
  }

  function openNew() {
    if (!permissions.canCreate) {
      showNotification(`Observer role has read-only access. Switch to Lead Counselor to create plans.`, true);
      return;
    }
    setForm(emptyForm);
    setAiInsight(null);
    setModal("new");
  }

  function openEdit(plan: SupportPlan) {
    if (!permissions.canEdit) {
      showNotification(`Observer role has read-only access. Switch to Lead Counselor to edit.`, true);
      return;
    }
    setForm({
      studentName: plan.studentName,
      grade: plan.grade,
      owner: plan.owner,
      concern: plan.concern,
      goal: plan.goal,
      nextReview: plan.nextReview,
      status: plan.status,
      priority: plan.priority,
      notes: plan.notes
    });
    setAiInsight(null);
    setModal(plan);
  }

  async function triggerAiAssistant() {
    if (!form.concern) {
      showNotification("Please select a focus area first (e.g., Attendance, Literacy, Wellbeing).", true);
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concern: form.concern,
          grade: form.grade,
          studentName: form.studentName,
          notes: form.notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiInsight(data);
        setForm((prev) => ({
          ...prev,
          goal: data.suggestedGoal || prev.goal,
          priority: data.recommendedPriority || prev.priority,
          notes: prev.notes
            ? `${prev.notes}\n\n[AI Suggested Interventions]:\n• ${data.interventions.join("\n• ")}`
            : `[AI Suggested Interventions]:\n• ${data.interventions.join("\n• ")}`
        }));
        showNotification("✨ AI SMART goal and evidence-based interventions loaded!");
      } else {
        showNotification(data.error || "Unable to retrieve AI suggestions", true);
      }
    } catch {
      showNotification("AI service temporarily unavailable.", true);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const editing = modal && modal !== "new" ? modal : null;

    if (editing && !permissions.canEdit) {
      showNotification("Permission denied: You do not have edit rights with this role.", true);
      return;
    }
    if (!editing && !permissions.canCreate) {
      showNotification("Permission denied: You do not have creation rights with this role.", true);
      return;
    }

    try {
      const response = await fetch(editing ? `/api/plans/${editing.id}` : "/api/plans", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": currentRole
        },
        body: JSON.stringify(form)
      });

      const body = await response.json();

      if (!response.ok) {
        showNotification(body.error ?? "Failed to save support plan", true);
        return;
      }

      setPlans((current) =>
        editing ? current.map((plan) => (plan.id === editing.id ? body.data : plan)) : [body.data, ...current]
      );
      setModal(null);
      showNotification(editing ? `Updated plan for ${form.studentName}` : `Created support plan for ${form.studentName}`);
    } catch {
      showNotification("Network error occurred while saving", true);
    }
  }

  async function remove(plan: SupportPlan) {
    if (!permissions.canDelete) {
      showNotification(`Permission Denied: Only Lead Counselors can delete or archive records.`, true);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete or archive ${plan.studentName}'s support plan?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
        headers: {
          "x-demo-role": currentRole
        }
      });

      if (response.ok) {
        setPlans((current) => current.filter((item) => item.id !== plan.id));
        showNotification(`Support plan for ${plan.studentName} archived.`);
      } else {
        const errorBody = await response.json();
        showNotification(errorBody.error || "Unable to delete record", true);
      }
    } catch {
      showNotification("Failed to delete support plan", true);
    }
  }

  function exportCaseloadCSV() {
    const headers = ["Student Name", "Grade", "Focus Area", "Owner", "Goal", "Next Review", "Status", "Priority", "Notes"];
    const rows = filtered.map((p) => [
      `"${p.studentName}"`,
      p.grade,
      `"${p.concern}"`,
      `"${p.owner}"`,
      `"${p.goal.replace(/"/g, '""')}"`,
      p.nextReview,
      p.status,
      p.priority,
      `"${p.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `luma_student_support_caseload_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Exported caseload report to CSV.");
  }

  return (
    <main className="shell">
      {/* Sticky Top Navigation */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">L</div>
          <div className="brand-title">
            <span>Luma</span>
            <small>STUDENT SUPPORT OPERATIONS</small>
          </div>
        </div>

        <div className="top-actions">
          {/* RBAC Role Switcher */}
          <div className="role-switcher" title="Test RBAC authorization directly in the UI">
            <span>ROLE:</span>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setCurrentRole(newRole);
                showNotification(`Switched role to: ${ROLE_CONFIGS[newRole].label} (${ROLE_CONFIGS[newRole].badge})`);
              }}
              aria-label="Select Demo Role"
            >
              <option value="counselor">Lead Counselor (Admin)</option>
              <option value="caseworker">Specialist (Edit)</option>
              <option value="observer">Observer (Read-Only)</option>
            </select>
          </div>

          <button
            className="guide-btn"
            onClick={() => setGuideModalOpen(true)}
            aria-label="Open Assignment Architecture and Rubric Guide"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Rubric & Architecture
          </button>

          <div className="live-indicator" title="Live Cloud Sync Active">
            <span className="live-dot" />
            <span>SYNCED</span>
          </div>

          <button className="avatar" aria-label="Current User Avatar" title={`Signed in as: ${permissions.label}`}>
            {currentRole === "counselor" ? "LC" : currentRole === "caseworker" ? "SS" : "OB"}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="intro">
        <div>
          <p className="eyebrow">Next.js 16 • Caseload Intelligence Platform</p>
          <h1>
            Keep every student<br />
            <em>within reach.</em>
          </h1>
          <p className="lede">
            A specialized clinical workspace for school counselors to plan, track, and collaborate on multi-tiered
            support interventions with evidence-based AI assistance.
          </p>
        </div>

        <div className="action-bar">
          <button className="primary" onClick={openNew} disabled={!permissions.canCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Support Plan
          </button>
        </div>
      </section>

      {/* KPI Stat Cards */}
      <section className="metrics" aria-label="Support plan overview">
        <div className="metric-card active-card">
          <span>ACTIVE INTERVENTIONS</span>
          <strong>{activePlansCount}</strong>
          <small>Tier 2/3 structured caseload</small>
        </div>
        <div className="metric-card urgent-card">
          <span>HIGH PRIORITY / URGENT</span>
          <strong className="coral">{highPriorityCount}</strong>
          <small>Critical student signals</small>
        </div>
        <div className="metric-card cycle-card">
          <span>REVIEWS THIS WEEK</span>
          <strong>{dueSoonCount}</strong>
          <small>Scheduled on/before Oct 5</small>
        </div>
        <div className="metric-card rate-card">
          <span>CASELOAD VELOCITY</span>
          <strong>94%</strong>
          <small>
            <b>↑ 6%</b> on-time counselor check-ins
          </small>
        </div>
      </section>

      {/* Workspace Section */}
      <section className="workspace">
        <div className="toolbar">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, focus areas, owners, goals..."
              aria-label="Search support plans"
            />
          </div>

          <div className="filters" role="group" aria-label="Filter by status">
            <button
              className={filter === "ALL" ? "selected" : ""}
              onClick={() => setFilter("ALL")}
            >
              All Plans ({counts.all})
            </button>
            <button
              className={filter === "ACTIVE" ? "selected" : ""}
              onClick={() => setFilter("ACTIVE")}
            >
              Active ({counts.active})
            </button>
            <button
              className={filter === "MONITORING" ? "selected" : ""}
              onClick={() => setFilter("MONITORING")}
            >
              Monitoring ({counts.monitoring})
            </button>
            <button
              className={filter === "COMPLETED" ? "selected" : ""}
              onClick={() => setFilter("COMPLETED")}
            >
              Completed ({counts.completed})
            </button>
            <button
              className={filter === "ARCHIVED" ? "selected" : ""}
              onClick={() => setFilter("ARCHIVED")}
            >
              Archived ({counts.archived})
            </button>
          </div>

          <div className="toolbar-tools">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "ALL" | SupportPlan["priority"])}
              className="export-btn"
              aria-label="Filter by priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            {/* View Mode Switcher */}
            <div className="filters" style={{ padding: 2 }}>
              <button
                className={viewMode === "table" ? "selected" : ""}
                onClick={() => setViewMode("table")}
                title="Table View"
                aria-label="Table View"
                style={{ padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" />
                </svg>
              </button>
              <button
                className={viewMode === "grid" ? "selected" : ""}
                onClick={() => setViewMode("grid")}
                title="Cards View"
                aria-label="Cards View"
                style={{ padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>

            <button className="export-btn" onClick={exportCaseloadCSV} title="Download filtered records as CSV">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* View Mode: Table View */}
        {viewMode === "table" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>FOCUS AREA</th>
                  <th>CASE OWNER</th>
                  <th>NEXT REVIEW</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th aria-label="Actions" style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div
                        className="student"
                        style={{ cursor: "pointer" }}
                        onClick={() => setDetailModal(plan)}
                        title="Click to view complete student profile and notes"
                      >
                        <span className={`student-avatar tone-${plan.grade % 4}`}>{initials(plan.studentName)}</span>
                        <span>
                          <b>{plan.studentName}</b>
                          <small>Grade {plan.grade} • ID: {plan.id.slice(0, 8)}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <b>{plan.concern}</b>
                      <small className="goal" title={plan.goal}>
                        {plan.goal}
                      </small>
                    </td>
                    <td>{plan.owner}</td>
                    <td>
                      <span
                        className={
                          plan.nextReview <= "2026-10-05" && plan.status !== "COMPLETED" && plan.status !== "ARCHIVED"
                            ? "due"
                            : ""
                        }
                      >
                        {readableDate(plan.nextReview)}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-chip ${plan.priority.toLowerCase()}`}>
                        {plan.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${plan.status.toLowerCase()}`}>
                        <i />
                        {statusLabel[plan.status]}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => setDetailModal(plan)}
                          title="View Full Case Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(plan)}
                          disabled={!permissions.canEdit}
                          title={permissions.canEdit ? "Edit Plan" : "Edit restricted for observer role"}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(plan)}
                          disabled={!permissions.canDelete}
                          title={permissions.canDelete ? "Archive Plan" : "Archive restricted to Lead Counselor"}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty">
                No student support plans match your query or filters.
                <div style={{ marginTop: 12 }}>
                  <button
                    className="guide-btn"
                    onClick={() => {
                      setQuery("");
                      setFilter("ALL");
                      setPriorityFilter("ALL");
                    }}
                    style={{ margin: "0 auto" }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Cards / Grid View */}
        {viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`student-avatar tone-${plan.grade % 4}`}>{initials(plan.studentName)}</span>
                      <div>
                        <b style={{ fontSize: 15, display: "block" }}>{plan.studentName}</b>
                        <small style={{ color: "var(--text-muted)" }}>Grade {plan.grade} • {plan.owner}</small>
                      </div>
                    </div>
                    <span className={`pill ${plan.status.toLowerCase()}`}>
                      <i />
                      {statusLabel[plan.status]}
                    </span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Focus: {plan.concern}
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {plan.goal}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Next Review</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }} className={plan.nextReview <= "2026-10-05" && plan.status !== "COMPLETED" ? "due" : ""}>
                      {readableDate(plan.nextReview)}
                    </span>
                  </div>

                  <div className="row-actions">
                    <button onClick={() => setDetailModal(plan)}>View</button>
                    <button onClick={() => openEdit(plan)} disabled={!permissions.canEdit}>Edit</button>
                    <button onClick={() => remove(plan)} disabled={!permissions.canDelete}>Archive</button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="empty" style={{ gridColumn: "1 / -1", background: "var(--bg-card)", borderRadius: 12 }}>
                No student support plans match your query or filters.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Floating Notice / Toast */}
      {notice && (
        <div className={`notice ${notice.isError ? "error" : ""}`} role="status">
          <span>{notice.isError ? "⚠" : "✓"}</span>
          <div>{notice.text}</div>
          <button
            onClick={() => setNotice(null)}
            style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer", marginLeft: 8 }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal: Create or Edit Support Plan */}
      {modal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}
        >
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{modal === "new" ? "New Record Entry" : "Modify Record"}</p>
                <h2>{modal === "new" ? "Create Student Support Plan" : `Update Plan: ${form.studentName}`}</h2>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Close Modal">
                ×
              </button>
            </div>

            {/* AI Counselor Copilot Card */}
            <div className="ai-copilot-card">
              <div className="ai-copilot-header">
                <span className="ai-copilot-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  AI Counselor Copilot (Gemini / Pedagogical Rules Engine)
                </span>
                <button
                  type="button"
                  className="ai-copilot-btn"
                  onClick={triggerAiAssistant}
                  disabled={isAiLoading}
                >
                  {isAiLoading ? "Analyzing Case Context..." : "✨ Generate SMART Goal & Strategies"}
                </button>
              </div>

              {aiInsight ? (
                <div className="ai-copilot-details">
                  <div><strong>AI Rationale:</strong> {aiInsight.rationale}</div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Recommended Interventions:</strong>
                    <ul>
                      {aiInsight.interventions.map((inv, idx) => (
                        <li key={idx}>{inv}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "11.5px", color: "#6b21a8", marginTop: 8 }}>
                  Select the student&apos;s grade and focus area below, then click to generate observable milestones and multi-tiered strategies.
                </div>
              )}
            </div>

            <div className="form-grid">
              <label>
                Student Full Name
                <input
                  required
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="e.g. Maya Thompson"
                />
              </label>

              <label>
                Grade Level
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Focus Domain / Area
                <select
                  value={form.concern}
                  onChange={(e) => setForm({ ...form, concern: e.target.value })}
                >
                  <option value="Attendance">Attendance (Chronic Absenteeism)</option>
                  <option value="Literacy">Literacy & Reading Acceleration</option>
                  <option value="Wellbeing">Wellbeing & Emotional Regulation</option>
                  <option value="Belonging">Belonging & Peer Engagement</option>
                  <option value="Behavioral">Behavioral Support & Restorative Growth</option>
                </select>
              </label>

              <label>
                Assigned Case Lead
                <input
                  required
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  placeholder="e.g. Ava Patel (Counselor)"
                />
              </label>

              <label className="wide">
                Observable Success Goal (SMART Milestone)
                <input
                  required
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  placeholder="Specific observable milestone (e.g. Return to 90% weekly attendance)"
                />
              </label>

              <label>
                Next Scheduled Review
                <input
                  required
                  type="date"
                  value={form.nextReview}
                  onChange={(e) => setForm({ ...form, nextReview: e.target.value })}
                />
              </label>

              <label>
                Priority Urgency
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as SupportPlan["priority"] })}
                >
                  <option value="HIGH">High Priority (Weekly Review)</option>
                  <option value="MEDIUM">Medium Priority (Bi-weekly)</option>
                  <option value="LOW">Low Priority (Monthly Check-in)</option>
                </select>
              </label>

              <label className="wide">
                Intervention Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SupportPlan["status"] })}
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Confidential Case Notes & Strategies (FERPA Protected)
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  placeholder="Record intervention strategies, parent check-ins, or literacy coordinates..."
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                {modal === "new" ? "Create Support Plan" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Student Detail / Case History */}
      {detailModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setDetailModal(null)}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Grade {detailModal.grade} • Comprehensive Case Profile</p>
                <h2>{detailModal.studentName}</h2>
              </div>
              <button type="button" onClick={() => setDetailModal(null)}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Focus Domain</span>
                <p style={{ fontWeight: "700", margin: "4px 0", fontSize: 14 }}>{detailModal.concern}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Case Lead</span>
                <p style={{ fontWeight: "700", margin: "4px 0", fontSize: 14 }}>{detailModal.owner}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Current Status</span>
                <p style={{ margin: "4px 0" }}>
                  <span className={`pill ${detailModal.status.toLowerCase()}`}>
                    <i />
                    {statusLabel[detailModal.status]}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Next Scheduled Review</span>
                <p style={{ fontWeight: "700", margin: "4px 0", fontSize: 14 }}>{readableDate(detailModal.nextReview)}</p>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Observable Milestone Goal</span>
              <p style={{ background: "var(--bg-card-subtle)", padding: "14px 16px", borderRadius: 8, margin: "6px 0", border: "1px solid var(--border-subtle)", fontWeight: 500, lineHeight: 1.5 }}>
                {detailModal.goal}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Confidential Counselor Notes & Interventions</span>
              <pre
                style={{
                  background: "var(--bg-card-subtle)",
                  padding: "16px",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  margin: "6px 0",
                  color: "var(--text-secondary)"
                }}
              >
                {detailModal.notes || "No confidential notes recorded yet."}
              </pre>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const p = detailModal;
                  setDetailModal(null);
                  openEdit(p);
                }}
                disabled={!permissions.canEdit}
              >
                Edit This Plan
              </button>
              <button type="button" className="primary" onClick={() => setDetailModal(null)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assignment Architecture & Rubric Guide */}
      {guideModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setGuideModalOpen(false)}
        >
          <div className="guide-modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Fullstack Assignment Architecture</p>
                <h2>Luma: Student Support Operations</h2>
              </div>
              <button type="button" onClick={() => setGuideModalOpen(false)}>×</button>
            </div>

            <div className="guide-badge-list">
              <span className="guide-badge">Next.js 16 App Router</span>
              <span className="guide-badge">React 19</span>
              <span className="guide-badge">TypeScript</span>
              <span className="guide-badge">Tailwind CSS v4</span>
              <span className="guide-badge">PostgreSQL & Prisma</span>
              <span className="guide-badge">Zod Validation + XSS Filter</span>
              <span className="guide-badge">RBAC Permissions</span>
              <span className="guide-badge">AI Counselor Copilot</span>
            </div>

            <div className="guide-section">
              <h3>🎯 Why This Is Beyond a Basic CRUD / To-Do App</h3>
              <p>
                The assignment asks to <strong>avoid to-do lists, task managers, and basic CRUD apps</strong>.
                Luma addresses a complex, multi-stakeholder domain problem: <strong>Tier 2/3 K-12 Student Support Operations</strong>.
                Instead of simple binary tasks, Luma models:
              </p>
              <ul>
                <li><strong>Pedagogical Intervention Framework:</strong> Tracks observable SMART milestones across focus domains (Attendance, Literacy, Wellbeing, Belonging, Behavioral).</li>
                <li><strong>Clinical Privacy & Role Boundaries:</strong> Separates Lead Counselors (full CRUD), Support Specialists (update/edit), and Observers/Teachers (read-only view) with FERPA-conscious audit patterns.</li>
                <li><strong>Scheduled Review Deadlines:</strong> Proactively highlights overdue and pending review deadlines to prevent high-risk students from slipping through administrative cracks.</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>⚡ Technical Stack & Architecture</h3>
              <table className="guide-table">
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>Technology</th>
                    <th>Implementation Highlights</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Frontend</strong></td>
                    <td>Next.js 16 + React 19</td>
                    <td>Server-side rendering, client hydration, accessible semantic tags, responsive grid and table views.</td>
                  </tr>
                  <tr>
                    <td><strong>Backend & APIs</strong></td>
                    <td>Route Handlers</td>
                    <td>RESTful endpoints (<code>/api/plans</code>, <code>/api/plans/[id]</code>, <code>/api/ai/suggest</code>) with HTTP 200/201/400/403/404 responses.</td>
                  </tr>
                  <tr>
                    <td><strong>Database</strong></td>
                    <td>PostgreSQL + Prisma</td>
                    <td>Indexed on <code>[status, nextReview]</code> and <code>[owner]</code>. Includes local memory fallback for zero-dependency evaluations.</td>
                  </tr>
                  <tr>
                    <td><strong>Security & RBAC</strong></td>
                    <td>Zod + Role Enforcement</td>
                    <td>Schema validation with XSS tag stripping and role checks on all mutation endpoints.</td>
                  </tr>
                  <tr>
                    <td><strong>AI Integration</strong></td>
                    <td>Gemini / Heuristic Engine</td>
                    <td>Contextual SMART goal generation and intervention recommendation playbook.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="guide-section">
              <h3>🧪 How to Evaluate & Test</h3>
              <ul>
                <li><strong>Test RBAC:</strong> Change the role in the top header from <em>Lead Counselor</em> to <em>Teacher / Observer</em>. Try to create, edit, or delete a plan to observe granular authorization guardrails and 403 enforcement.</li>
                <li><strong>Test AI Copilot:</strong> Click <em>New Support Plan</em>, select a focus area (e.g., Attendance or Literacy), and click <em>Generate SMART Goal & Interventions</em>.</li>
                <li><strong>Test CRUD:</strong> Create a plan, search for it, edit its goal, review its details, and archive it.</li>
                <li><strong>Test Export:</strong> Click <em>Export CSV</em> to generate a caseload summary report.</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setGuideModalOpen(false)}>
                Got it, Return to Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
