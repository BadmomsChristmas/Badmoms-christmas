"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Claim = {
  id: string;
  sponsorName: string;
  sponsorPhone: string;
  sponsorEmail: string;
  status: string;
  sponsorTexted: boolean;
  sponsorTextedNotes: string | null;
};

type Child = {
  id: string;
  submissionNumber: number;
  firstName: string;
  gender: string;
  age: number;
  clothingSize: string;
  shoeSize: string;
  wishlist1: string;
  wishlist2: string;
  wishlist3: string;
  status: string;
  droppedOff: boolean;
  claim: Claim | null;
};

type Family = {
  id: string;
  familyCode: string;
  momName: string;
  momPhone: string;
  momEmail: string;
  householdNeeds: string | null;
  wantsDinner: boolean;
  wantsWrappingPaper: boolean;
  status: string;
  momTexted: boolean;
  momTextedNotes: string | null;
  pickupConfirmed: boolean;
  children: Child[];
};

export default function AdminClient({
  adminName,
  orgName,
}: {
  adminName: string;
  orgName: string;
}) {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/families");
    const data = await res.json();
    setFamilies(data.families || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function patchFamily(id: string, patch: any) {
    await fetch(`/api/admin/families/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function removeFamily(id: string, code: string) {
    if (!confirm(`Permanently remove ${code} and all its children/claims? This cannot be undone.`)) return;
    await fetch(`/api/admin/families/${id}`, { method: "DELETE" });
    load();
  }

  async function removeChild(id: string, name: string) {
    if (!confirm(`Permanently remove ${name}'s submission? This cannot be undone.`)) return;
    await fetch(`/api/admin/children/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleDroppedOff(id: string, value: boolean) {
    await fetch(`/api/admin/children/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ droppedOff: value }),
    });
    load();
  }

  async function patchClaim(id: string, patch: any) {
    await fetch(`/api/admin/claims/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function releaseClaim(id: string, name: string) {
    if (!confirm(`Release the claim on ${name}? This puts them back into the unclaimed pool.`)) return;
    await patchClaim(id, { action: "release" });
  }

  async function sendReminders(kind: "sponsors" | "moms") {
    const res = await fetch(`/api/admin/reminders/${kind}`, { method: "POST" });
    const data = await res.json();
    setNotice(`Sent ${data.sent} reminder email(s).`);
    setTimeout(() => setNotice(null), 4000);
  }

  const allChildren = families.flatMap((f) => f.children);
  const stats = {
    totalChildren: allChildren.length,
    unclaimed: allChildren.filter((c) => c.status === "UNCLAIMED").length,
    pending: allChildren.filter((c) => c.status === "PENDING").length,
    claimed: allChildren.filter((c) => c.status === "CLAIMED").length,
    droppedOff: allChildren.filter((c) => c.status === "DROPPED_OFF").length,
  };

  const filtered = families
    .filter((f) => f.status !== "REMOVED")
    .filter((f) => {
      if (statusFilter === "ALL") return true;
      return f.children.some((c) => c.status === statusFilter);
    })
    .filter((f) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.familyCode.toLowerCase().includes(q) ||
        f.momName.toLowerCase().includes(q) ||
        f.children.some((c) => c.firstName.toLowerCase().includes(q))
      );
    });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{orgName} - Admin Dashboard</h1>
        <div>
          <span style={{ marginRight: 16, color: "#5a564e" }}>{adminName}</span>
          <button className="btn btn--ghost btn--small" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat__number">{stats.totalChildren}</span>
          <span className="stat__label">Total children</span>
        </div>
        <div className="stat">
          <span className="stat__number">{stats.unclaimed}</span>
          <span className="stat__label">Unclaimed</span>
        </div>
        <div className="stat">
          <span className="stat__number">{stats.pending}</span>
          <span className="stat__label">Pending (reserved)</span>
        </div>
        <div className="stat">
          <span className="stat__number">{stats.claimed}</span>
          <span className="stat__label">Claimed</span>
        </div>
        <div className="stat">
          <span className="stat__number">{stats.droppedOff}</span>
          <span className="stat__label">Dropped off</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="btn btn--small" onClick={() => sendReminders("sponsors")}>
          Email drop-off reminder to confirmed sponsors
        </button>
        <button className="btn btn--small" onClick={() => sendReminders("moms")}>
          Email pickup reminder to fully-sponsored families
        </button>
      </div>
      {notice && <div className="alert alert--success">{notice}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by family, mom, or child name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="ALL">All statuses</option>
          <option value="UNCLAIMED">Has unclaimed child</option>
          <option value="PENDING">Has pending claim</option>
          <option value="CLAIMED">Has claimed child</option>
          <option value="DROPPED_OFF">Has dropped-off child</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No families match.</p>
      ) : (
        filtered.map((family) => (
          <div className="family-card" key={family.id}>
            <div className="family-card__header">
              <h3>
                {family.familyCode}
                {family.status === "FLAGGED" && (
                  <span className="badge badge--released" style={{ marginLeft: 10 }}>
                    Flagged
                  </span>
                )}
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn--ghost btn--small"
                  onClick={() =>
                    patchFamily(family.id, {
                      status: family.status === "FLAGGED" ? "ACTIVE" : "FLAGGED",
                    })
                  }
                >
                  {family.status === "FLAGGED" ? "Unflag" : "Flag as duplicate"}
                </button>
                <button
                  className="btn btn--danger btn--small"
                  onClick={() => removeFamily(family.id, family.familyCode)}
                >
                  Remove family
                </button>
              </div>
            </div>
            <div className="family-card__body">
              <p className="field__hint">
                <strong>Mom:</strong> {family.momName} · {family.momPhone} ·{" "}
                {family.momEmail}
                {family.householdNeeds ? ` · Needs: ${family.householdNeeds}` : ""}
                {family.wantsDinner ? " · Wants dinner" : ""}
                {family.wantsWrappingPaper ? " · Wants wrapping paper" : ""}
              </p>
              <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={family.momTexted}
                    onChange={(e) => patchFamily(family.id, { momTexted: e.target.checked })}
                  />
                  Mom texted
                </label>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={family.pickupConfirmed}
                    onChange={(e) =>
                      patchFamily(family.id, { pickupConfirmed: e.target.checked })
                    }
                  />
                  Pickup confirmed
                </label>
              </div>

              {family.children.map((child) => (
                <div className="child-row" key={child.id}>
                  <div className="child-row__info">
                    <div className="child-row__name">
                      {child.firstName} <span>#{child.submissionNumber}</span>
                    </div>
                    <div className="child-row__meta">
                      {child.gender}, age {child.age} · clothing{" "}
                      {child.clothingSize} · shoe {child.shoeSize}
                    </div>
                    <ul className="child-row__wishlist">
                      <li>{child.wishlist1}</li>
                      <li>{child.wishlist2}</li>
                      <li>{child.wishlist3}</li>
                    </ul>

                    {child.claim && (
                      <p className="field__hint">
                        <strong>Sponsor:</strong> {child.claim.sponsorName} ·{" "}
                        {child.claim.sponsorPhone} · {child.claim.sponsorEmail}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
                      {child.claim && child.claim.status !== "RELEASED" && (
                        <>
                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={child.claim.sponsorTexted}
                              onChange={(e) =>
                                patchClaim(child.claim!.id, {
                                  sponsorTexted: e.target.checked,
                                })
                              }
                            />
                            Sponsor texted
                          </label>
                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={child.droppedOff}
                              onChange={(e) => toggleDroppedOff(child.id, e.target.checked)}
                            />
                            Dropped off
                          </label>
                          <button
                            className="btn btn--ghost btn--small"
                            onClick={() => releaseClaim(child.claim!.id, child.firstName)}
                          >
                            Release claim
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn--danger btn--small"
                        onClick={() => removeChild(child.id, child.firstName)}
                      >
                        Remove child
                      </button>
                    </div>
                  </div>
                  <div style={{ minWidth: 100, textAlign: "right" }}>
                    <span className={`badge badge--${child.status.toLowerCase()}`}>
                      {child.status.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
