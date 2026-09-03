"use client";

import { useState } from "react";
import { config } from "@/lib/config";

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
      <div className="page">
        <h1>Thank you!</h1>
        <div className="alert alert--success">
          Your family has been submitted successfully. Your reference code is{" "}
          <strong>{result.familyCode}</strong>. Please keep this for your
          records in case you need to contact us.
        </div>
        <p>
          Pickup day is {config.dropoffDate}, {config.pickupWindow} at{" "}
          {config.dropoffLocation}. We'll be in touch as sponsors are matched
          to your family.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Family Submission</h1>
      <p className="intro">
        Please submit one form per family, adding every child you'd like
        considered below. Deadline to submit is {config.submissionDeadline} -
        no late submissions can be accepted. Your family's identity stays
        anonymous to sponsors; only {config.orgName} admins can see your
        contact information.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Your information</legend>
          <div className="field">
            <label htmlFor="momName">Your name</label>
            <input
              id="momName"
              type="text"
              required
              value={momName}
              onChange={(e) => setMomName(e.target.value)}
            />
          </div>
          <div className="two-col">
            <div className="field">
              <label htmlFor="momPhone">Phone number</label>
              <input
                id="momPhone"
                type="tel"
                required
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
                value={momEmail}
                onChange={(e) => setMomEmail(e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Household</legend>
          <div className="field">
            <label htmlFor="householdNeeds">
              Household needs
              <span className="field__hint">
                {" "}
                (paper goods, groceries, bedding, etc. Not guaranteed, but
                suggested to sponsors when possible.)
              </span>
            </label>
            <textarea
              id="householdNeeds"
              value={householdNeeds}
              onChange={(e) => setHouseholdNeeds(e.target.value)}
            />
          </div>

          <div className="field">
            <label>My family needs Christmas dinner</label>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  name="dinner"
                  required
                  checked={wantsDinner === "yes"}
                  onChange={() => setWantsDinner("yes")}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="dinner"
                  required
                  checked={wantsDinner === "no"}
                  onChange={() => setWantsDinner("no")}
                />
                No
              </label>
            </div>
          </div>

          <div className="field">
            <label>I would love a roll of wrapping paper and supplies</label>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  name="wrapping"
                  required
                  checked={wantsWrappingPaper === "yes"}
                  onChange={() => setWantsWrappingPaper("yes")}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="wrapping"
                  required
                  checked={wantsWrappingPaper === "no"}
                  onChange={() => setWantsWrappingPaper("no")}
                />
                No
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Children</legend>
          {children.map((child, i) => (
            <div className="child-block" key={i}>
              <div className="child-block__header">
                <h3>Child {i + 1}</h3>
                {children.length > 1 && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => removeChild(i)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="two-col">
                <div className="field">
                  <label>First name</label>
                  <input
                    type="text"
                    required
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
                    value={child.age}
                    onChange={(e) => updateChild(i, "age", e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Gender</label>
                <div className="radio-row">
                  <label>
                    <input
                      type="radio"
                      name={`gender-${i}`}
                      required
                      checked={child.gender === "Female"}
                      onChange={() => updateChild(i, "gender", "Female")}
                    />
                    Female
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`gender-${i}`}
                      required
                      checked={child.gender === "Male"}
                      onChange={() => updateChild(i, "gender", "Male")}
                    />
                    Male
                  </label>
                </div>
              </div>

              <div className="two-col">
                <div className="field">
                  <label>Clothing size(s)</label>
                  <input
                    type="text"
                    required
                    value={child.clothingSize}
                    onChange={(e) => updateChild(i, "clothingSize", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>
                    Shoe size
                    <span className="field__hint"> (include type - sneakers, boots, etc.)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={child.shoeSize}
                    onChange={(e) => updateChild(i, "shoeSize", e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>
                  Clothing needs
                  <span className="field__hint"> (preferred colors/styles - optional)</span>
                </label>
                <input
                  type="text"
                  value={child.clothingNeeds}
                  onChange={(e) => updateChild(i, "clothingNeeds", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Wishlist item 1</label>
                <input
                  type="text"
                  required
                  value={child.wishlist1}
                  onChange={(e) => updateChild(i, "wishlist1", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Wishlist item 2</label>
                <input
                  type="text"
                  required
                  value={child.wishlist2}
                  onChange={(e) => updateChild(i, "wishlist2", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Wishlist item 3</label>
                <input
                  type="text"
                  required
                  value={child.wishlist3}
                  onChange={(e) => updateChild(i, "wishlist3", e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Additional comments/requests
                  <span className="field__hint"> (optional)</span>
                </label>
                <textarea
                  value={child.additionalComments}
                  onChange={(e) => updateChild(i, "additionalComments", e.target.value)}
                />
              </div>
            </div>
          ))}

          <button type="button" className="btn btn--ghost" onClick={addChild}>
            + Add another child
          </button>
        </fieldset>

        <fieldset>
          <legend>Acknowledgment</legend>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            I understand that if my child is being sponsored by another
            organization, I must notify admins immediately. Failing to do so
            will result in removal from the group.
          </label>
        </fieldset>

        {result?.type === "error" && (
          <div className="alert alert--error">{result.message}</div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit family"}
        </button>
      </form>
    </div>
  );
}
