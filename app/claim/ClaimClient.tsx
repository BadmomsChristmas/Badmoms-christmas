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

  return (
    <div>
      {families.map((family) => (
        <div className="family-card" key={family.id}>
          <div className="family-card__header">
            <h3>{family.familyCode}</h3>
          </div>
          <div className="family-card__body">
            {family.children.map((child) => {
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

      {step === "reserved" && (
        <div className="alert alert--info">
          <p>
            Your selection is reserved for {30} minutes. Click below to
            confirm your sponsorship.
          </p>
          {error && <div className="alert alert--error">{error}</div>}
          <button onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Confirming..." : "Confirm my sponsorship"}
          </button>
        </div>
      )}
    </div>
  );
}
