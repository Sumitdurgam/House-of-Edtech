import { NextRequest, NextResponse } from "next/server";
import { createPlan, listPlans } from "@/lib/store";
import { supportPlanSchema } from "@/lib/validation";
import { UserRole } from "@/lib/types";

function getRole(request: NextRequest): UserRole {
  const role = request.headers.get("x-demo-role") as UserRole;
  if (role === "counselor" || role === "caseworker" || role === "observer") {
    return role;
  }
  // Default to counselor for local developer convenience if header missing
  return "counselor";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get("status");
  const query = searchParams.get("q");

  let plans = listPlans();

  if (statusFilter && statusFilter !== "ALL") {
    plans = plans.filter((p) => p.status === statusFilter);
  }

  if (query) {
    const q = query.toLowerCase();
    plans = plans.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.concern.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    data: plans,
    meta: {
      total: plans.length,
      timestamp: new Date().toISOString()
    }
  });
}

export async function POST(request: NextRequest) {
  const role = getRole(request);

  // Authorization check: Observers have read-only permissions
  if (role === "observer") {
    return NextResponse.json(
      {
        error: "Forbidden: Observers have read-only access. Switch role to Lead Counselor or Specialist.",
        code: "PERMISSION_DENIED"
      },
      { status: 403 }
    );
  }

  try {
    const rawBody = await request.json();
    const result = supportPlanSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed: please check highlighted fields",
          details: result.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const newPlan = createPlan(result.data);
    return NextResponse.json({ data: newPlan, message: "Support plan created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload or server error" }, { status: 400 });
  }
}
