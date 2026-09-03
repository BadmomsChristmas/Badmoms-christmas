import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSponsorDropoffReminder } from "@/lib/email";

// Sends a drop-off reminder to every sponsor with a confirmed (not yet
// dropped-off) claim. Grouped by sponsor email so one person who claimed
// multiple children gets a single email listing all of them.
export async function POST() {
  const claims = await prisma.claim.findMany({
    where: { status: "CONFIRMED" },
    include: { child: { include: { family: true } } },
  });

  const bySponsor = new Map<
    string,
    { sponsorName: string; labels: string[] }
  >();

  for (const claim of claims) {
    const key = claim.sponsorEmail;
    const label = `${claim.child.family.familyCode} - ${claim.child.firstName} (#${claim.child.submissionNumber})`;
    if (!bySponsor.has(key)) {
      bySponsor.set(key, { sponsorName: claim.sponsorName, labels: [label] });
    } else {
      bySponsor.get(key)!.labels.push(label);
    }
  }

  for (const [email, { sponsorName, labels }] of bySponsor) {
    await sendSponsorDropoffReminder({
      to: email,
      sponsorName,
      childLabels: labels,
    });
  }

  return NextResponse.json({ sent: bySponsor.size });
}
