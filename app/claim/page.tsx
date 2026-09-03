import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import ClaimClient from "./ClaimClient";

export const dynamic = "force-dynamic"; // always show live claim status, never cache

export default async function ClaimPage() {
  const families = await prisma.family.findMany({
    where: { status: "ACTIVE" },
    orderBy: { familyCode: "asc" },
    select: {
      id: true,
      familyCode: true,
      children: {
        orderBy: { submissionNumber: "asc" },
        select: {
          id: true,
          submissionNumber: true,
          firstName: true,
          gender: true,
          age: true,
          clothingSize: true,
          shoeSize: true,
          clothingNeeds: true,
          wishlist1: true,
          wishlist2: true,
          wishlist3: true,
          additionalComments: true,
          status: true,
          claim: { select: { status: true, lockExpiresAt: true } },
        },
      },
    },
  });

  // Treat expired pending locks as effectively unclaimed for display purposes
  // (the API re-validates this for real at claim time).
  const now = Date.now();
  const shaped = families
    .map((f) => ({
      id: f.id,
      familyCode: f.familyCode,
      children: f.children.map((c) => {
        const expired =
          c.claim?.status === "PENDING" &&
          c.claim.lockExpiresAt.getTime() < now;
        const effectiveStatus = expired ? "UNCLAIMED" : c.status;
        return { ...c, claim: undefined, effectiveStatus };
      }),
    }))
    // Hide families with no children left to show (shouldn't happen, but safe)
    .filter((f) => f.children.length > 0);

  return (
    <div>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">{config.orgName}</p>
          <nav className="site-header__nav">
            <a href="/family-form">Submit a Family</a>
          </nav>
        </div>
      </header>
      <main className="page page--wide">
        <h1>Sponsor a Child</h1>
        <p className="intro">
          Children are grouped by family below. You can sponsor one child, a
          whole sibling group, or as many as you're able. Selections are held
          for {config.claimLockMinutes} minutes while you finish - if you
          don't confirm in that time, the spot opens back up. Drop-off is{" "}
          {config.dropoffDate}, {config.dropoffWindow} at{" "}
          {config.dropoffLocation}.
        </p>
        <ClaimClient families={shaped} />
      </main>
    </div>
  );
}
