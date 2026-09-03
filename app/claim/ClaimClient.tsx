"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SleighIcon } from "@/components/decorations";

type Child = {
  id: string;
  submissionNumber: number;
  firstName: string;
  gender: string;
  age: number;
  clothingSize: string;
  shoeSize: string;
  clothingNeeds: string | null;
  wishlist1: string;
  wishlist2: string;
  wishlist3: string;
  additionalComments: string | null;
  effectiveStatus: string;
};

type Family = {
  id: string;
  familyCode: string;
  children: Child[];
};

const AGE_BRACKETS = [
  { value: "ALL", label: "All ages", min: 0, max: 18 },
  { value: "0-3", label: "0-3", min: 0, max: 3 },
  { value: "4-7", label: "4-7", min: 4, max: 7 },
  { value: "8-11", label: "8-11", min: 8, max: 11 },
  { value: "12-15", label: "12-15", min: 12, max: 15 },
  { value: "16-18", label: "16-18", min: 16, max: 18 },
];

const BALL_COLORS = [
  "radial-gradient(circle at 32% 28%,#f07a72,#e0483f 60%,#a82a24)",
  "radial-gradient(circle at 32% 28%,#a98ce0,#7a5cc4 60%,#523791)",
  "radial-gradient(circle at 32% 28%,#7fd9f2,#3f9dc2 60%,#22637d)",
  "radial-gradient(circle at 32% 28%,#f7a9b8,#e0708c 60%,#a83c58)",
];

const WISH_NUMBER_CLASSES = ["wish-number--1", "wish-number--2", "wish-number--3"];

function formatCountdown(ms: number) {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ClaimClient({ families }: { families: Family[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorPhone, setSponsorPhone] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [step, setStep] = useState<"select" | "reserved" | "confirmed">("select");
  const [claimGroupId, setClaimGroupId] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [siblingsTogether, setSiblingsTogether] = useState(false);
  const [sortFewestFirst, setSortFewestFirst] = useState(false);

  // Tick every second so the reservation countdown stays live.
  useEffect(() => {
    if (step !== "reserved") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  function toggleSelect(childId: string, available: boolean) {
    if (!available) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
      return next;
    });
  }

  function selectWholeFamily(family: Family) {
    setSelected((prev) => {
      const next = new Set(prev);
      family.children.forEach((c) => {
        if (c.effectiveStatus === "UNCLAIMED") next.add(c.id);
      });
      return next;
    });
  }

  async function handleReserve() {
    setError(null);
    if (!sponsorName || !sponsorPhone || !sponsorEmail) {
      setError("Please fill out your name, phone, and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childIds: Array.from(selected),
          sponsorName,
          sponsorPhone,
          sponsorEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        router.refresh();
        return;
      }
      setClaimGroupId(data.claimGroupId);
      // 30 minutes from now, matching the server's lock window.
      setLockExpiresAt(Date.now() + 30 * 60 * 1000);
      setNow(Date.now());
      setStep("reserved");
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!claimGroupId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/claim/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimGroupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStep("confirmed");
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeBracket = AGE_BRACKETS.find((b) => b.value === ageFilter)!;

  const visibleFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();

    const shaped = families.map((family) => {
      const sponsoredCount = family.children.filter(
        (c) => c.effectiveStatus === "CLAIMED" || c.effectiveStatus === "DROPPED_OFF"
      ).length;
      const hasUnclaimed = family.children.some((c) => c.effectiveStatus === "UNCLAIMED");

      const matchingChildren = family.children.filter((c) => {
        const genderOk = genderFilter === "ALL" || c.gender === genderFilter;
        const ageOk = c.age >= activeBracket.min && c.age <= activeBracket.max;
        const searchOk =
          !q ||
          c.firstName.toLowerCase().includes(q) ||
          c.wishlist1.toLowerCase().includes(q) ||
          c.wishlist2.toLowerCase().includes(q) ||
          c.wishlist3.toLowerCase().includes(q) ||
          (c.additionalComments || "").toLowerCase().includes(q);
        return genderOk && ageOk && searchOk;
      });

      return { ...family, matchingChildren, sponsoredCount, hasUnclaimed };
    });

    const filtered = shaped
      .filter((f) => f.matchingChildren.length > 0)
      .filter((f) => !siblingsTogether || f.hasUnclaimed);

    if (sortFewestFirst) {
      filtered.sort((a, b) => a.sponsoredCount - b.sponsoredCount);
    }

    return filtered;
  }, [families, search, genderFilter, activeBracket, siblingsTogether, sortFewestFirst]);

  const totalMatchingKids = visibleFamilies.reduce((s, f) => s + f.matchingChildren.length, 0);

  const cartNames = families
    .flatMap((f) => f.children)
    .filter((c) => selected.has(c.id))
    .map((c) => c.firstName);

  if (step === "confirmed") {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <div className="alert alert--success">
          Thank you, {sponsorName}! Your sponsorship is confirmed. Check your
          email for the full shopping list and drop-off details.
        </div>
      </div>
    );
  }

  const remainingMs = lockExpiresAt ? lockExpiresAt - now : 0;

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-search">
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              border: "2.5px solid #9dbccb",
              flex: "none",
            }}
          />
          <input
            type="text"
            placeholder='Search a wish - "boots", "Lego", "bike"…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="segmented">
          <button
            type="button"
            className={genderFilter === "ALL" ? "active" : ""}
            onClick={() => setGenderFilter("ALL")}
          >
            All
          </button>
          <button
            type="button"
            className={genderFilter === "Female" ? "active" : ""}
            onClick={() => setGenderFilter("Female")}
          >
            Girls
          </button>
          <button
            type="button"
            className={genderFilter === "Male" ? "active" : ""}
            onClick={() => setGenderFilter("Male")}
          >
            Boys
          </button>
        </div>

        <div className="age-pills">
          {AGE_BRACKETS.map((b) => (
            <button
              key={b.value}
              type="button"
              className={`age-pill ${ageFilter === b.value ? "active" : ""}`}
              onClick={() => setAgeFilter(b.value)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="switch-field">
          <button
            type="button"
            className={`switch ${siblingsTogether ? "on" : ""}`}
            onClick={() => setSiblingsTogether((v) => !v)}
            aria-pressed={siblingsTogether}
          >
            <span className="switch__knob" />
          </button>
          <span className="switch-field__label">Only families still needing sponsors</span>
        </div>
      </div>

      <div className="results-bar">
        <span className="results-bar__count">
          <span className="results-bar__dot" />
          {totalMatchingKids} {totalMatchingKids === 1 ? "kid" : "kids"} ·{" "}
          {visibleFamilies.length} {visibleFamilies.length === 1 ? "family" : "families"} shown
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#7fa3b3" }}>Sort</span>
          <select
            value={sortFewestFirst ? "fewest" : "default"}
            onChange={(e) => setSortFewestFirst(e.target.value === "fewest")}
          >
            <option value="default">Family code</option>
            <option value="fewest">Fewest sponsors first</option>
          </select>
        </div>
      </div>

      <div className="claim-body">
        {visibleFamilies.length === 0 && (
          <div className="alert alert--info">
            No children match these filters right now - try widening your
            search.
          </div>
        )}

        {visibleFamilies.map((family) => (
          <div className="family-group" key={family.id}>
            <div className="family-group__header">
              <h3>{family.familyCode}</h3>
              <span
                className={`family-badge ${family.sponsoredCount === 0 ? "family-badge--red" : "family-badge--gold"}`}
              >
                {family.children.length} kids ·{" "}
                {family.sponsoredCount === 0
                  ? "nobody yet"
                  : `${family.sponsoredCount} sponsored`}
              </span>
              <div className="family-group__progress">
                <div
                  style={{
                    width: `${(family.sponsoredCount / family.children.length) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                  }}
                />
              </div>
              {family.hasUnclaimed && step === "select" && (
                <button
                  type="button"
                  className="pill-btn pill-btn--green pill-btn--small"
                  onClick={() => selectWholeFamily(family)}
                >
                  Take the whole family
                </button>
              )}
            </div>

            <div className="child-grid">
              {family.matchingChildren.map((child, idx) => {
                const inCart = selected.has(child.id);
                const alreadyGone =
                  !inCart &&
                  child.effectiveStatus !== "UNCLAIMED";
                const cardClass = alreadyGone
                  ? "ornament-card ornament-card--claimed"
                  : inCart
                  ? "ornament-card ornament-card--in-cart"
                  : "ornament-card";
                const ballBackground = alreadyGone
                  ? "#cfd8d5"
                  : inCart
                  ? "radial-gradient(circle at 32% 28%,#4fc79a,#2f8f6f 60%,#1c6349)"
                  : BALL_COLORS[idx % BALL_COLORS.length];

                return (
                  <div className={cardClass} key={child.id}>
                    <div
                      className="ornament-card__ball"
                      style={{
                        background: ballBackground,
                        borderColor: alreadyGone ? "#9fb2ad" : "#0f3f3a",
                      }}
                    />
                    {alreadyGone && (
                      <div className="ornament-card__sponsored-tag">Sponsored!</div>
                    )}
                    <div
                      className="ornament-card__head"
                      style={{
                        background: alreadyGone ? "#e6e8e4" : "#dff0f8",
                        borderColor: alreadyGone ? "#9fb2ad" : "#0f3f3a",
                      }}
                    >
                      <div>
                        <div className="ornament-card__name">{child.firstName}</div>
                        <div className="ornament-card__meta">
                          {child.gender === "Female" ? "Girl" : "Boy"} · age {child.age}
                        </div>
                      </div>
                      <span
                        className="ornament-card__id"
                        style={{ background: alreadyGone ? "#6d817c" : "#2b6d84" }}
                      >
                        #{child.submissionNumber}
                      </span>
                    </div>
                    <div className="ornament-card__body">
                      <div className="tag-row">
                        <span className="info-tag">clothes {child.clothingSize}</span>
                        <span className="info-tag">shoe {child.shoeSize}</span>
                      </div>

                      {alreadyGone ? (
                        <p className="note-box">
                          Wish list is tucked away - {child.firstName} already
                          has a sponsor. Thank you!
                        </p>
                      ) : (
                        <>
                          <div>
                            <div className="wishlist-heading">
                              <span className="wishlist-heading__dot" />
                              <span className="wishlist-heading__text">Wish list</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[child.wishlist1, child.wishlist2, child.wishlist3].map(
                                (wish, wIdx) => (
                                  <div className="wish-item" key={wIdx}>
                                    <span className={`wish-number ${WISH_NUMBER_CLASSES[wIdx]}`}>
                                      {wIdx + 1}
                                    </span>
                                    {wish}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          {child.additionalComments && (
                            <p className="note-box">{child.additionalComments}</p>
                          )}
                        </>
                      )}

                      {step === "select" && (
                        <button
                          type="button"
                          className={`pill-btn pill-btn--block ${
                            alreadyGone ? "" : inCart ? "" : "pill-btn--red"
                          }`}
                          style={
                            alreadyGone
                              ? { background: "#dfe3df", color: "#8d9e99", boxShadow: "none", cursor: "not-allowed" }
                              : inCart
                              ? { background: "#dff0e8", color: "#1c6349", border: "3px solid #2f8f6f", boxShadow: "none" }
                              : undefined
                          }
                          disabled={alreadyGone}
                          onClick={() => toggleSelect(child.id, !alreadyGone)}
                        >
                          {alreadyGone
                            ? "Already sponsored"
                            : inCart
                            ? "Take out of sleigh"
                            : `Sponsor ${child.firstName}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {step === "select" && showForm && (
        <div className="page" style={{ maxWidth: 560 }}>
          <div className="step-card" style={{ marginTop: 0 }}>
            <h2 style={{ margin: "0 0 16px" }}>Your information</h2>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
              />
            </div>
            <div className="two-col">
              <div className="field">
                <label>Phone number</label>
                <input
                  type="tel"
                  value={sponsorPhone}
                  onChange={(e) => setSponsorPhone(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  value={sponsorEmail}
                  onChange={(e) => setSponsorEmail(e.target.value)}
                />
              </div>
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <button onClick={handleReserve} disabled={submitting}>
              {submitting
                ? "Reserving..."
                : `Reserve ${selected.size} ${selected.size === 1 ? "kid" : "kids"}`}
            </button>
          </div>
        </div>
      )}

      {step === "reserved" && (
        <div className="page" style={{ maxWidth: 560 }}>
          {error && <div className="alert alert--error">{error}</div>}
        </div>
      )}

      {step === "select" && selected.size > 0 && (
        <div className="sleigh-bar">
          <div className="sleigh-bar__info">
            <SleighIcon />
            <div>
              <div className="sleigh-bar__count">
                {selected.size} {selected.size === 1 ? "kid" : "kids"} in your sleigh
              </div>
              <div className="sleigh-bar__meta">{cartNames.join(", ")}</div>
            </div>
          </div>
          <div className="sleigh-bar__actions">
            {showForm ? (
              <button
                type="button"
                className="pill-btn pill-btn--ghost"
                onClick={() => setShowForm(false)}
              >
                Back to browsing
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="pill-btn pill-btn--ghost"
                  onClick={() => setSelected(new Set())}
                >
                  Clear sleigh
                </button>
                <button type="button" className="pill-btn" onClick={() => setShowForm(true)}>
                  Confirm sponsorship
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "reserved" && (
        <div className="sleigh-bar">
          <div className="sleigh-bar__info">
            <SleighIcon />
            <div>
              <div className="sleigh-bar__count">
                {selected.size} {selected.size === 1 ? "kid" : "kids"} in your sleigh
              </div>
              <div className="sleigh-bar__meta">
                Held for {formatCountdown(remainingMs)} - {cartNames.join(", ")}
              </div>
            </div>
          </div>
          <div className="sleigh-bar__actions">
            <button type="button" className="pill-btn" onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Confirming..." : "Confirm sponsorship"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
