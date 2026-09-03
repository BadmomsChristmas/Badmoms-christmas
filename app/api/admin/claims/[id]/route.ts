import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  if (body.action === "release") {
    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: params.id },
        data: { status: "RELEASED", releasedAt: new Date() },
      }),
      prisma.child.update({
        where: { id: claim.childId },
        data: { status: "UNCLAIMED" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const data: any = {};
  if (typeof body.sponsorTexted === "boolean") {
    data.sponsorTexted = body.sponsorTexted;
    data.sponsorTextedAt = body.sponsorTexted ? new Date() : null;
  }
  if (typeof body.sponsorTextedNotes === "string") {
    data.sponsorTextedNotes = body.sponsorTextedNotes;
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }

  const claim = await prisma.claim.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ claim });
}
