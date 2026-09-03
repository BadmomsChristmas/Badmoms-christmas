import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { ChristmasLights, LogoMark, SnowOverlay, ReindeerOrnament } from "@/components/decorations";
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

  const totalKids = shaped.reduce((sum, f) => sum + f.children.length, 0);
  const sponsoredKids = shaped.reduce(
    (sum, f) =>
      sum +
      f.children.filter(
        (c) => c.effectiveStatus === "CLAIMED" || c.effectiveStatus === "DROPPED_OFF"
      ).length,
    0
  );
  const percent = totalKids > 0 ? Math.round((sponsoredKids / totalKids) * 100) : 0;

  return (
    <div>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">
            <LogoMark />
            {config.orgName}
          </p>
          <nav className="site-header__nav">
            <a href="/family-form">Sign up my family</a>
          </nav>
        </div>
      </header>
      <ChristmasLights />

      <div className="hero">
        <SnowOverlay />
        <ReindeerOrnament />
        <div className="hero__flex">
          <div style={{ maxWidth: 560, textAlign: "left" }}>
            <span className="hero__eyebrow">Sponsor a kid</span>
            <h1>Pick a name off the tree</h1>
            <p>
              Take one kiddo, a whole sibling set, or as many as your heart
              allows. We hold your picks for {config.claimLockMinutes} minutes
              while you finish.
            </p>
          </div>
          <div className="hero__stats-card">
            <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
              <span className="hero__stats-count">{sponsoredKids}</span>
              <span className="hero__stats-label">of {totalKids} kids sponsored</span>
            </div>
            <div className="hero__progress-track">
              <div className="hero__progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="hero__stats-meta">
              Drop-off {config.dropoffDate} · {config.dropoffWindow}
              <br />
              {config.dropoffLocation}
            </p>
          </div>
        </div>
      </div>

      <ClaimClient families={shaped} />
    </div>
  );
}
