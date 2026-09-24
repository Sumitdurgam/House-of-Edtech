import { PrismaClient, Priority, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.supportPlan.deleteMany();
  await prisma.supportPlan.createMany({
    data: [
      { studentName: "Maya Thompson", grade: 9, owner: "Ava Patel", concern: "Attendance", goal: "Return to 90% weekly attendance", nextReview: new Date("2026-10-02"), priority: Priority.HIGH, status: Status.ACTIVE, notes: "Family check-in scheduled." },
      { studentName: "Jordan Lee", grade: 11, owner: "Ava Patel", concern: "Belonging", goal: "Join one interest-based club", nextReview: new Date("2026-10-09"), priority: Priority.MEDIUM, status: Status.MONITORING, notes: "Student prefers a small group setting." },
      { studentName: "Sam Rivera", grade: 8, owner: "Noah Williams", concern: "Literacy", goal: "Complete two supported reading sessions weekly", nextReview: new Date("2026-09-29"), priority: Priority.HIGH, status: Status.ACTIVE, notes: "Coordinate with literacy specialist." }
    ]
  });
}

main().finally(() => prisma.$disconnect());
