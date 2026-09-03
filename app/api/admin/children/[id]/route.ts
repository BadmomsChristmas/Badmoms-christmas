import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};

  if (typeof body.droppedOff === "boolean") {
    data.droppedOff = body.droppedOff;
    data.droppedOffAt = body.droppedOff ? new Date() : null;
    data.status = body.droppedOff ? "DROPPED_OFF" : "CLAIMED";

    // Keep the claim record in sync so the sponsor-facing status matches.
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: { claim: true },
    });
    if (child?.claim) {
      await prisma.claim.update({
        where: { id: child.claim.id },
        data: {
          status: body.droppedOff ? "DROPPED_OFF" : "CONFIRMED",
          droppedOffAt: body.droppedOff ? new Date() : null,
        },
      });
    }
  }

  const child = await prisma.child.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ child });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Removes a single child submission (e.g. one duplicate entry within an
  // otherwise-valid family), rather than the whole family.
  await prisma.child.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
