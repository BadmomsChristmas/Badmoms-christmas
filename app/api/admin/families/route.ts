import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Without this, Next.js tries to pre-render this route at build time (since
// it takes no request params), which fails because there's no live database
// connection available during the build step.
export const dynamic = "force-dynamic";

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
