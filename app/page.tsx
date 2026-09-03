import { config } from "@/lib/config";
import { ChristmasLights, LogoMark, SnowOverlay, TreeIcon } from "@/components/decorations";

export default function HomePage() {
  return (
    <div>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">
            <LogoMark />
            {config.orgName}
          </p>
          <nav className="site-header__nav">
            <a href="/family-form">Submit a Family</a>
            <a href="/claim" className="pill-btn">
              Sponsor a kid
            </a>
          </nav>
        </div>
      </header>
      <ChristmasLights />

      <div className="hero">
        <SnowOverlay />
        <span className="hero__eyebrow">Christmas sponsorship</span>
        <h1>Making Christmas brighter, together</h1>
        <p>
          Every year, {config.orgName} connects local families with sponsors
          who provide Christmas gifts and, when needed, household support.
        </p>
        <div className="hero__deadline">
          <span className="hero__deadline-dot" />
          Family sign-ups close {config.submissionDeadline}
        </div>
      </div>

      <main className="page">
        <div className="step-card" style={{ marginTop: 40 }}>
          <div className="step-card__badge">
            <div className="step-card__badge-stem" />
            <div className="step-card__badge-circle step-card__badge-circle--red">
              <TreeIcon size={22} />
            </div>
          </div>
          <h2>For families</h2>
          <p>
            If you'd like your children considered for sponsorship this year,
            submit your family below. The deadline to submit is{" "}
            {config.submissionDeadline}. No late submissions can be accepted.
          </p>
          <a className="pill-btn" href="/family-form">
            Submit your family
          </a>
        </div>

        <div className="step-card">
          <div className="step-card__badge">
            <div className="step-card__badge-stem" />
            <div className="step-card__badge-circle step-card__badge-circle--green">
              🎁
            </div>
          </div>
          <h2>For sponsors</h2>
          <p>
            Browse children who still need a sponsor and claim one child, a
            sibling group, or as many as you're able to support. All families
            remain anonymous - you'll see a child's first name and their
            wishlist, nothing more.
          </p>
          <a className="pill-btn pill-btn--red" href="/claim">
            View children who need sponsors
          </a>
        </div>
      </main>
    </div>
  );
}
