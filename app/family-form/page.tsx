import { config } from "@/lib/config";
import { getSubmissionsOpen } from "@/lib/settings";
import { ChristmasLights, LogoMark, SnowOverlay } from "@/components/decorations";
import FamilyForm from "./FamilyForm";

export const dynamic = "force-dynamic"; // check open/closed on every visit

export default async function FamilyFormPage() {
  const open = await getSubmissionsOpen();

  if (open) {
    return <FamilyForm />;
  }

  return (
    <div>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">
            <LogoMark />
            {config.orgName}
          </p>
          <nav className="site-header__nav">
            <a href="/claim" className="pill-btn">
              Sponsor a kid
            </a>
          </nav>
        </div>
      </header>
      <ChristmasLights />
      <div className="hero">
        <SnowOverlay />
        <span className="hero__eyebrow">Family sign-up</span>
        <h1>Sign-ups are closed</h1>
        <p>
          Family submissions for this year are now closed. Thank you to every
          family who applied - we can't wait to match your kids with sponsors.
        </p>
      </div>
      <div className="page" style={{ textAlign: "center" }}>
        <p>
          Already submitted? Sit tight - we'll be in touch as sponsors are
          matched. Pickup is {config.dropoffDate}, {config.pickupWindow} at{" "}
          {config.dropoffLocation}.
        </p>
      </div>
    </div>
  );
}
