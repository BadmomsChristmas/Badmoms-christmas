import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMomPickupReminder } from "@/lib/email";

// Sends a pickup reminder to every family whose children are all claimed
// (CLAIMED or DROPPED_OFF) - i.e. families who have gifts waiting for them.
export async function POST() {
  const families = await prisma.family.findMany({
    where: { status: "ACTIVE" },
    include: { children: true },
  });

  let sent = 0;
  for (const family of families) {
    const allClaimed = family.children.every(
      (c: { status: string }) => c.status === "CLAIMED" || c.status === "DROPPED_OFF"
    );
    if (allClaimed && family.children.length > 0) {
      await sendMomPickupReminder({
        to: family.momEmail,
        familyCode: family.familyCode,
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
