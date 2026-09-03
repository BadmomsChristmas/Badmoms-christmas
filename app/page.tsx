import { config } from "@/lib/config";

export default function HomePage() {
  return (
    <div>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">{config.orgName}</p>
          <nav className="site-header__nav">
            <a href="/family-form">Submit a Family</a>
            <a href="/claim">Sponsor a Child</a>
          </nav>
        </div>
      </header>
      <main className="page">
        <h1>Christmas Sponsorship</h1>
        <p className="intro">
          Every year, {config.orgName} connects local families with sponsors
          who provide Christmas gifts and, when needed, household support.
        </p>

        <h2>For families</h2>
        <p>
          If you'd like your children considered for sponsorship this year,
          submit your family below. The deadline to submit is{" "}
          {config.submissionDeadline}. No late submissions can be accepted.
        </p>
        <p>
          <a className="btn" href="/family-form">
            Submit your family
          </a>
        </p>

        <h2>For sponsors</h2>
        <p>
          Browse children who still need a sponsor and claim one child, a
          sibling group, or as many as you're able to support. All families
          remain anonymous - you'll see a child's first name and their
          wishlist, nothing more.
        </p>
        <p>
          <a className="btn" href="/claim">
            View children who need sponsors
          </a>
        </p>
      </main>
    </div>
  );
}
