import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSponsorClaimConfirmation, sendMomFullySponsoredNotice } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { claimGroupId } = body;
  if (!claimGroupId) {
    return NextResponse.json({ error: "Missing claim reference." }, { status: 400 });
  }

  const now = new Date();
  const claims = await prisma.claim.findMany({
    where: { claimGroupId },
    include: { child: { include: { family: true } } },
  });

  if (claims.length === 0) {
    return NextResponse.json({ error: "This reservation could not be found." }, { status: 404 });
  }

  const expired = claims.some(
    (c: { status: string; lockExpiresAt: Date }) =>
      c.status === "PENDING" && c.lockExpiresAt.getTime() < now.getTime()
  );
  if (expired) {
    return NextResponse.json(
      { error: "Your reservation expired. Please select the children again." },
      { status: 410 }
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const claim of claims) {
      await tx.claim.update({
        where: { id: claim.id },
        data: { status: "CONFIRMED", confirmedAt: now },
      });
      await tx.child.update({
        where: { id: claim.childId },
        data: { status: "CLAIMED" },
      });
    }
  });

  const first = claims[0];
  const childLabels = claims.map(
    (c) => `${c.child.family.familyCode} - ${c.child.firstName} (#${c.child.submissionNumber})`
  );

  await sendSponsorClaimConfirmation({
    to: first.sponsorEmail,
    sponsorName: first.sponsorName,
    childLabels,
  });

  // Check each affected family: if every child is now claimed, notify mom.
  const familyIds = Array.from(new Set(claims.map((c) => c.child.familyId)));
  for (const familyId of familyIds) {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { children: true },
    });
    if (!family) continue;
    const allClaimed = family.children.every(
      (c) => c.status === "CLAIMED" || c.status === "DROPPED_OFF"
    );
    if (allClaimed) {
      await sendMomFullySponsoredNotice({
        to: family.momEmail,
        familyCode: family.familyCode,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
