"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const STATUS_LABEL: Record<string, string> = {
  UNCLAIMED: "needs a sponsor",
  PENDING: "being claimed",
  CLAIMED: "claimed",
  DROPPED_OFF: "claimed",
  RELEASED: "needs a sponsor",
};

const AGE_BRACKETS = [
  { value: "ALL", label: "All ages", min: 0, max: 18 },
  { value: "0-3", label: "0-3", min: 0, max: 3 },
  { value: "4-7", label: "4-7", min: 4, max: 7 },
  { value: "8-11", label: "8-11", min: 8, max: 11 },
  { value: "12-15", label: "12-15", min: 12, max: 15 },
  { value: "16-18", label: "16-18", min: 16, max: 18 },
];

export default function ClaimClient({ families }: { families: Family[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorPhone, setSponsorPhone] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [step, setStep] = useState<"select" | "reserved" | "confirmed">("select");
  const [claimGroupId, setClaimGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [wholeFamilyOnly, setWholeFamilyOnly] = useState(false);

  function toggle(childId: string, available: boolean) {
    if (!available) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
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

  if (step === "confirmed") {
    return (
      <div className="alert alert--success">
        Thank you, {sponsorName}! Your sponsorship is confirmed. Check your
        email for drop-off details.
      </div>
    );
  }

  const activeBracket = AGE_BRACKETS.find((b) => b.value === ageFilter)!;

  const visibleFamilies = families
    .map((family) => {
      const wholeFamilyAvailable = family.children.every(
        (c) => c.effectiveStatus === "UNCLAIMED"
      );
      const matchingChildren = family.children.filter((c) => {
        const genderOk = genderFilter === "ALL" || c.gender === genderFilter;
        const ageOk = c.age >= activeBracket.min && c.age <= activeBracket.max;
        return genderOk && ageOk;
      });
      return { ...family, matchingChildren, wholeFamilyAvailable };
    })
    .filter((f) => f.matchingChildren.length > 0)
    .filter((f) => !wholeFamilyOnly || f.wholeFamilyAvailable);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-bar__field">
          <label htmlFor="genderFilter">Gender</label>
          <select
            id="genderFilter"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>
        <div className="filter-bar__field">
          <label htmlFor="ageFilter">Age range</label>
          <select
            id="ageFilter"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
          >
            {AGE_BRACKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <label className="filter-bar__toggle">
          <input
            type="checkbox"
            checked={wholeFamilyOnly}
            onChange={(e) => setWholeFamilyOnly(e.target.checked)}
          />
          Only show whole families still needing a sponsor
        </label>
      </div>

      {visibleFamilies.length === 0 && (
        <div className="alert alert--info">
          No children match these filters right now - try widening your
          search.
        </div>
      )}

      {visibleFamilies.map((family) => (
        <div className="family-card" key={family.id}>
          <div className="family-card__header">
            <h3>
              {family.familyCode}
              {family.wholeFamilyAvailable && (
                <span className="whole-family-badge">
                  Whole family needs a sponsor
                </span>
              )}
            </h3>
          </div>
          <div className="family-card__body">
            {family.matchingChildren.map((child) => {
              const available = child.effectiveStatus === "UNCLAIMED";
              const isSelected = selected.has(child.id);
              return (
                <div className="child-row" key={child.id}>
                  <div className="child-row__info">
                    <div className="child-row__name">
                      {child.firstName} <span>#{child.submissionNumber}</span>
                    </div>
                    <div className="child-row__meta">
                      {child.gender}, age {child.age} · clothing{" "}
                      {child.clothingSize} · shoe {child.shoeSize}
                      {child.clothingNeeds ? ` · ${child.clothingNeeds}` : ""}
                    </div>
                    <ul className="child-row__wishlist">
                      <li>{child.wishlist1}</li>
                      <li>{child.wishlist2}</li>
                      <li>{child.wishlist3}</li>
                    </ul>
                    {child.additionalComments && (
                      <p className="field__hint">{child.additionalComments}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 120 }}>
                    <span className={`badge badge--${child.effectiveStatus.toLowerCase()}`}>
                      {STATUS_LABEL[child.effectiveStatus] || child.effectiveStatus}
                    </span>
                    <br />
                    {step === "select" && (
                      <label
                        className="checkbox-inline"
                        style={{ justifyContent: "flex-end", marginTop: 8 }}
                      >
                        <input
                          type="checkbox"
                          disabled={!available}
                          checked={isSelected}
                          onChange={() => toggle(child.id, available)}
                        />
                        Select
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {step === "select" && selected.size > 0 && !showForm && (
        <div className="alert alert--info">
          {selected.size} {selected.size === 1 ? "child" : "children"}{" "}
          selected.{" "}
          <button className="btn btn--small" onClick={() => setShowForm(true)}>
            Continue
          </button>
        </div>
      )}

      {step === "select" && showForm && (
        <fieldset>
          <legend>Your information</legend>
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
            {submitting ? "Reserving..." : `Reserve ${selected.size} ${selected.size === 1 ? "child" : "children"}`}
          </button>
        </fieldset>
      )}

      {step ===