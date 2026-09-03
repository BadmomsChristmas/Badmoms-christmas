"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { ChristmasLights, LogoMark, SnowOverlay, TreeIcon } from "@/components/decorations";

type ChildDraft = {
  firstName: string;
  gender: string;
  age: string;
  clothingSize: string;
  shoeSize: string;
  clothingNeeds: string;
  wishlist1: string;
  wishlist2: string;
  wishlist3: string;
  additionalComments: string;
};

function emptyChild(): ChildDraft {
  return {
    firstName: "",
    gender: "",
    age: "",
    clothingSize: "",
    shoeSize: "",
    clothingNeeds: "",
    wishlist1: "",
    wishlist2: "",
    wishlist3: "",
    additionalComments: "",
  };
}

export default function FamilyFormPage() {
  const [momName, setMomName] = useState("");
  const [momPhone, setMomPhone] = useState("");
  const [momEmail, setMomEmail] = useState("");
  const [householdNeeds, setHouseholdNeeds] = useState("");
  const [wantsDinner, setWantsDinner] = useState<"yes" | "no" | "">("");
  const [wantsWrappingPaper, setWantsWrappingPaper] = useState<"yes" | "no" | "">("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild()]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { type: "success"; familyCode: string }
    | { type: "error"; message: string }
    | null
  >(null);

  function updateChild(index: number, field: keyof ChildDraft, value: string) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function addChild() {
    setChildren((prev) => [...prev, emptyChild()]);
  }

  function removeChild(index: number) {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!acknowledged) {
      setResult({
        type: "error",
        message: "Please acknowledge the sponsorship notification requirement before submitting.",
      });
      return;
    }
    if (children.length === 0) {
      setResult({ type: "error", message: "Please add at least one child." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          momName,
          momPhone,
          momEmail,
          householdNeeds,
          wantsDinner: wantsDinner === "yes",
          wantsWrappingPaper: wantsWrappingPaper === "yes",
          acknowledgedSponsoredElsewhere: acknowledged,
          children: children.map((c) => ({
            ...c,
            age: parseInt(c.age, 10),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Something went wrong." });
      } else {
        setResult({ type: "success", familyCode: data.familyCode });
      }
    } catch {
      setResult({ type: "error", message: "Network error - please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.type === "success") {
    return (
      <div>
        <header className="site-header">
          <div className="site-header__inner">
            <p className="site-header__title">
              <LogoMark />
              {config.orgName}
            </p>
          </div>
        </header>
        <ChristmasLights />
        <div className="page" style={{ textAlign: "center" }}>
          <h1>🎄 Thank you!</h1>
          <div className="alert alert--success">
            Your family has been submitted successfully. Your reference code
            is <strong>{result.familyCode}</strong>. Please keep this for your
            records in case you need to contact us.
          </div>
          <p>
            Pickup day is {config.dropoffDate}, {config.pickupWindow} at{" "}
            {config.dropoffLocation}. We'll be in touch as sponsors are
            matched to your family.
          </p>
        </div>
      </div>
    );
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
        <h1>Tell us about your kids!</h1>
        <p>
          One form per family - add every kiddo you'd like considered.
          Sponsors never see your name or number, only the wishes.
        </p>
        <div className="hero__deadline">
          <span className="hero__deadline-dot" />
          Sign-ups close {config.submissionDeadline}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 30 }}>
          <TreeIcon size={56} />
          <TreeIcon size={40} />
          <TreeIcon size={64} />
        </div>
      </div>

      <div className="page">
        <form onSubmit={handleSubmit}>
          <div className="step-card">
            <div className="step-card__badge">
              <div className="step-card__badge-stem" />
              <div className="step-card__badge-circle step-card__badge-circle--red">01</div>
            </div>
            <h2>About you</h2>
            <div className="two-col">
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="momName">Your name</label>
                <input
                  id="momName"
                  type="text"
                  required
                  placeholder="Jamie Whitaker"
                  value={momName}
                  onChange={(e) => setMomName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="momPhone">Phone number</label>
                <input
                  id="momPhone"
                  type="tel"
                  required
                  placeholder="(205) 555-0134"
                  value={momPhone}
                  onChange={(e) => setMomPhone(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="momEmail">Email address</label>
                <input
                  id="momEmail"
                  type="email"
                  required
                  placeholder="jamie@email.com"
                  value={momEmail}
                  onChange={(e) => setMomEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-card__badge">
              <div className="step-card__badge-stem" />
              <div className="step-card__badge-circle step-card__badge-circle--green">02</div>
            </div>
            <h2>Your household</h2>
            <div className="field">
              <label htmlFor="householdNeeds">Household needs</label>
              <span className="field__hint">
                Paper goods, groceries, bedding - not guaranteed, but we pass
                wishes along when we can.
              </span>
              <textarea
                id="householdNeeds"
                placeholder="Twin sheet set, paper towels, laundry soap…"
                value={householdNeeds}
                onChange={(e) => setHouseholdNeeds(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>

            <div className="toggle-row toggle-row--mint">
              <span className="toggle-row__label">
                We'd love help with Christmas dinner
              </span>
              <div className="toggle-pair toggle-pair--mint">
                <button
                  type="button"
                  className={`toggle-option ${wantsDinner === "yes" ? "toggle-option--active-green" : ""}`}
                  onClick={() => setWantsDinner("yes")}
                >
                  Yes!
                </button>
                <button
                  type="button"
                  className="toggle-option"
                  onClick={() => setWantsDinner("no")}
                  style={wantsDinner === "no" ? { color: "#12495c" } : undefined}
                >
                  No
                </button>
              </div>
            </div>

            <div className="toggle-row toggle-row--red">
              <span className="toggle-row__label">
                Send wrapping paper &amp; tape, please
              </span>
              <div className="toggle-pair toggle-pair--red">
                <button
                  type="button"
                  className={`toggle-option ${wantsWrappingPaper === "yes" ? "toggle-option--active-red" : ""}`}
                  onClick={() => setWantsWrappingPaper("yes")}
                >
                  Yes!
                </button>
                <button
                  type="button"
                  className="toggle-option"
                  onClick={() => setWantsWrappingPaper("no")}
                  style={wantsWrappingPaper === "no" ? { color: "#12495c" } : undefined}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-card__badge">
              <div className="step-card__badge-stem" />
              <div className="step-card__badge-circle step-card__badge-circle--purple">03</div>
            </div>
            <div className="step-card__header-row">
              <h2>The kids</h2>
              <span className="count-badge">
                {children.length} added
              </span>
            </div>

            {children.map((child, i) => (
              <div className="child-block" key={i}>
                <div className="child-block__header">
                  <span>Kiddo {i + 1}</span>
                  {children.length > 1 && (
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => removeChild(i)}
                    >
                      Remove
                    </span>
                  )}
                </div>
                <div className="child-block__body">
                  <div className="field">
                    <label>First name</label>
                    <input
                      type="text"
                      required
                      placeholder="Carter"
                      value={child.firstName}
                      onChange={(e) => updateChild(i, "firstName", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Age</label>
                    <input
                      type="number"
                      min={0}
                      max={18}
                      required
                      placeholder="9"
                      value={child.age}
                      onChange={(e) => updateChild(i, "age", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Gender</label>
                    <div className="toggle-pair toggle-pair--ice" style={{ alignSelf: "stretch" }}>
                      <button
                        type="button"
                        className={`toggle-option ${child.gender === "Female" ? "toggle-option--active-ice" : "toggle-option--inactive"}`}
                        style={{ flex: 1 }}
                        onClick={() => updateChild(i, "gender", "Female")}
                      >
                        Girl
                      </button>
                      <button
                        type="button"
                        className={`toggle-option ${child.gender === "Male" ? "toggle-option--active-ice" : "toggle-option--inactive"}`}
                        style={{ flex: 1 }}
                        onClick={() => updateChild(i, "gender", "Male")}
                      >
                        Boy
                      </button>
                    </div>
                  </div>
                  <div className="field">
                    <label>Clothing size(s)</label>
                    <input
                      type="text"
                      required
                      placeholder="YL or 10/12"
                      value={child.clothingSize}
                      onChange={(e) => updateChild(i, "clothingSize", e.target.value)}
                    />
                  </div>
                  <div className="field child-block__span-2">
                    <label>
                      Shoe size <span className="field__hint">(and what kind)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Youth 5, sneakers"
                      value={child.shoeSize}
                      onChange={(e) => updateChild(i, "shoeSize", e.target.value)}
                    />
                  </div>
                  <div className="field child-block__span-3">
                    <label>
                      Favorite colors or styles{" "}
                      <span className="field__hint">- optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Loves blue, always in a hoodie"
                      value={child.clothingNeeds}
                      onChange={(e) => updateChild(i, "clothingNeeds", e.target.value)}
                    />
                  </div>

                  <div className="wishlist-box child-block__span-3">
                    <div className="wishlist-box__title">Three Christmas wishes</div>
                    <div className="wishlist-box__row">
                      <span className="wish-number wish-number--1">1</span>
                      <input
                        type="text"
                        required
                        placeholder="Remote control monster truck"
                        value={child.wishlist1}
                        onChange={(e) => updateChild(i, "wishlist1", e.target.value)}
                      />
                    </div>
                    <div className="wishlist-box__row">
                      <span className="wish-number wish-number--2">2</span>
                      <input
                        type="text"
                        required
                        placeholder="Basketball"
                        value={child.wishlist2}
                        onChange={(e) => updateChild(i, "wishlist2", e.target.value)}
                      />
                    </div>
                    <div className="wishlist-box__row">
                      <span className="wish-number wish-number--3">3</span>
                      <input
                        type="text"
                        required
                        placeholder="Lego City set"
                        value={child.wishlist3}
                        onChange={(e) => updateChild(i, "wishlist3", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field child-block__span-3">
                    <label>
                      Additional comments/requests{" "}
                      <span className="field__hint">(optional)</span>
                    </label>
                    <textarea
                      value={child.additionalComments}
                      onChange={(e) => updateChild(i, "additionalComments", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="add-child-btn" onClick={addChild}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>Add another
              kiddo
            </div>
          </div>

          <div className="consent-card">
            <div className="consent-card__lights">
              {Array.from({ length: 7 }).map((_, i) => {
                const colors = ["#e0483f", "#fdd85f", "#a8e0d0", "#7a5cc4"];
                const c = colors[i % colors.length];
                return (
                  <span
                    key={i}
                    style={{
                      width: 9,
                      height: 11,
                      borderRadius: "0 0 6px 6px",
                      background: c,
                      boxShadow: `0 3px 10px ${c}`,
                      animation: "twinkle 2s ease-in-out infinite",
                      animationDelay: `${(i % 5) * 0.4}s`,
                    }}
                  />
                );
              })}
            </div>
            <div className="consent-card__row">
              <button
                type="button"
                className="consent-card__checkbox"
                onClick={() => setAcknowledged((v) => !v)}
                aria-pressed={acknowledged}
              >
                {acknowledged ? "✓" : ""}
              </button>
              <p className="consent-card__text">
                I understand that if my child is being sponsored by another
                organization, I'll tell an admin right away - so no kid gets
                doubled up while another waits.
              </p>
            </div>
            {result?.type === "error" && (
              <div className="alert alert--error" style={{ marginTop: 16, marginBottom: 0 }}>
                {result.message}
              </div>
            )}
            <div className="consent-card__footer">
              <span className="consent-card__note">
                Your contact info is never shown to sponsors
              </span>
              <button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send our list"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
