import { NextRequest, NextResponse } from "next/server";
import { deletePlan, updatePlan, listPlans } from "@/lib/store";
import { supportPlanSchema } from "@/lib/validation";
import { UserRole } from "@/lib/types";

function getRole(request: NextRequest): UserRole {
  const role = request.headers.get("x-demo-role") as UserRole;
  if (role === "counselor" || role === "caseworker" || role === "observer") {
    return role;
  }
  return "counselor";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const plans = listPlans();
  const plan = plans.find((p) => p.id === id);

  if (!plan) {
    return NextResponse.json({ error: "Support plan not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: plan });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = getRole(request);

  if (role === "observer") {
    return NextResponse.json(
      {
        error: "Forbidden: Observers have read-only access. Switch role to Lead Counselor or Specialist.",
        code: "PERMISSION_DENIED"
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;

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

    const updated = updatePlan(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: "Support plan not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ data: updated, message: "Support plan updated successfully" });
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload or server error" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = getRole(request);

  // High security constraint: Only Lead Counselors can delete/archive records
  if (role !== "counselor") {
    return NextResponse.json(
      {
        error: "Forbidden: Only Lead Counselors have permission to delete or archive student records.",
        code: "PERMISSION_DENIED"
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const success = deletePlan(id);

  if (!success) {
    return NextResponse.json({ error: "Support plan not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
