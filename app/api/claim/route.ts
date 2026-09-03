import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { childIds, sponsorName, sponsorPhone, sponsorEmail } = body;

  if (!Array.isArray(childIds) || childIds.length === 0) {
    return NextResponse.json({ error: "No children selected." }, { status: 400 });
  }
  if (!sponsorName || !sponsorPhone || !sponsorEmail) {
    return NextResponse.json(
      { error: "Name, phone, and email are required." },
      { status: 400 }
    );
  }

  const claimGroupId = nanoid(10);
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + config.claimLockMinutes * 60 * 1000);

  try {
    await prisma.$transaction(async (tx) => {
      // First pass: verify every requested child is actually available.
      for (const childId of childIds) {
        const child = await tx.child.findUnique({
          where: { id: childId },
          include: { claim: true },
        });
        if (!child) {
          throw new Error(`One of the selected children could not be found.`);
        }
        const claim = child.claim;
        const isAvailable =
          !claim ||
          claim.status === "RELEASED" ||
          (claim.status === "PENDING" && claim.lockExpiresAt.getTime() < now.getTime());
        if (!isAvailable) {
          throw new Error(
            `${child.firstName} was just claimed by someone else - please refresh and try again.`
          );
        }
      }

      // Second pass: create/refresh the claim rows.
      for (const childId of childIds) {
        await tx.claim.upsert({
          where: { childId },
          update: {
            sponsorName,
            sponsorPhone,
            sponsorEmail,
            status: "PENDING",
            claimGroupId,
            claimedAt: now,
            lockExpiresAt,
            confirmedAt: null,
            droppedOffAt: null,
            releasedAt: null,
          },
          create: {
            childId,
            sponsorName,
            sponsorPhone,
            sponsorEmail,
            status: "PENDING",
            claimGroupId,
            lockExpiresAt,
          },
        });
        await tx.child.update({
          where: { id: childId },
          data: { status: "PENDING" },
        });
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unable to reserve selection." },
      { status: 409 }
    );
  }

  return NextResponse.json({ claimGroupId }, { status: 201 });
}
