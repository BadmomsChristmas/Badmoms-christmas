import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const families = await prisma.family.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      children: {
        orderBy: { submissionNumber: "asc" },
        include: { claim: true },
      },
    },
  });
  return NextResponse.json({ families });
}
