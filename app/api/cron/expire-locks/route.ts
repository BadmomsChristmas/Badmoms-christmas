import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Intended to be hit periodically (e.g. every 5 minutes) by Vercel Cron or
// any external scheduler. See README for setup. Protect it with a shared
// secret so randoms on the internet can't hit it.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expiredClaims = await prisma.claim.findMany({
    where: { status: "PENDING", lockExpiresAt: { lt: now } },
  });

  for (const claim of expiredClaims) {
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: claim.id },
        data: { status: "RELEASED", releasedAt: now },
      }),
      prisma.child.update({
        where: { id: claim.childId },
        data: { status: "UNCLAIMED" },
      }),
    ]);
  }

  return NextResponse.json({ released: expiredClaims.length });
}
