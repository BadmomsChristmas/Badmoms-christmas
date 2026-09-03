import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};

  if (typeof body.momTexted === "boolean") {
    data.momTexted = body.momTexted;
    data.momTextedAt = body.momTexted ? new Date() : null;
  }
  if (typeof body.momTextedNotes === "string") {
    data.momTextedNotes = body.momTextedNotes;
  }
  if (typeof body.pickupConfirmed === "boolean") {
    data.pickupConfirmed = body.pickupConfirmed;
    data.pickupConfirmedAt = body.pickupConfirmed ? new Date() : null;
  }
  if (body.status && ["ACTIVE", "FLAGGED", "REMOVED"].includes(body.status)) {
    data.status = body.status;
  }

  const family = await prisma.family.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ family });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Hard delete: used for confirmed duplicate submissions. Cascades to
  // children and their claims via the schema's onDelete: Cascade.
  await prisma.family.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
