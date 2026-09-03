import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSponsorDropoffReminder, SponsoredChildDetail } from "@/lib/email";

// Sends a drop-off reminder to every sponsor with a confirmed (not yet
// dropped-off) claim. Grouped by sponsor email so one person who claimed
// multiple children gets a single email listing all of them.
export async function POST() {
  const claims = await prisma.claim.findMany({
    where: { status: "CONFIRMED" },
    include: { child: { include: { family: true } } },
  });

  const bySponsor = new Map
    string,
    { sponsorName: string; children: SponsoredChildDetail[] }
  >();

  for (const claim of claims) {
    const key = claim.sponsorEmail;
    const detail: SponsoredChildDetail = {
      familyCode: claim.child.family.familyCode,
      firstName: claim.child.firstName,
      submissionNumber: claim.child.submissionNumber,
      age: claim.child.age,
      gender: claim.child.gender,
      clothingSize: claim.child.clothingSize,
      shoeSize: claim.child.shoeSize,
      clothingNeeds: claim.child.clothingNeeds,
      wishlist1: claim.child.wishlist1,
      wishlist2: claim.child.wishlist2,
      wishlist3: claim.child.wishlist3,
      additionalComments: claim.child.additionalComments,
      householdNeeds: claim.child.family.householdNeeds,
    };
    if (!bySponsor.has(key)) {
      bySponsor.set(key, { sponsorName: claim.sponsorName, children: [detail] });
    } else {
      bySponsor.get(key)!.children.push(detail);
    }
  }

  for (const [email, { sponsorName, children }] of bySponsor) {
    await sendSponsorDropoffReminder({
      to: email,
      sponsorName,
      children,
    });
  }

  return NextResponse.json({ sent: bySponsor.size });
}