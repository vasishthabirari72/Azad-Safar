import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Guide dashboard — only accessible to users with role === "guide"
// Loads the guide's own profile + bookings from the real API
// Guide can: confirm, decline, or mark bookings as completed
// Also shows profile status (pending/active) and lets them edit key fields

const API = "http://localhost:8000/api/guides";
const LOCAL_SESSION_KEY = "travel_partner_session_v1";

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

const STATUS_META = {
  pending: { label: "Under Review", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  active: { label: "Active", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  suspended: { label: "Suspended", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const BOOKING_META = {
  pending: { label: "Pending", color: "#f97316", bg: "#fff7ed" },
  confirmed: { label: "Confirmed", color: "#2563eb", bg: "#eff6ff" },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  declined: { label: "Declined", color: "#64748b", bg: "#f1f5f9" },
};

function GuideDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");

  // Booking action state
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Filter bookings by tab
  const [activeTab, setActiveTab] = useState("pending");

  // Guard — redirect non-guides away
  useEffect(() => {
    if (!session) { navigate("/auth"); return; }
    if (session.role !== "guide") { navigate("/travel-partner"); return; }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/mine`, {
        headers: { "x-user-email": session.email },
      });
      if (!res.ok) throw new Error("Could not load your profile");
      const data = await res.json();
      setProfile(data);
      setEditForm({
        bio: data.bio || "",
        photo: data.photo || "",
        pricePerDay: data.pricePerDay || "",
        experienceYears: data.experienceYears || "",
        cities: (data.cities || []).join(", "),
        languages: (data.languages || []).join(", "),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  }, [session?.email]);

  const loadBookings = useCallback(async () => {
    if (!profile?._id) return;
    try {
      const res = await fetch(`${API}/${profile._id}/bookings`, {
        headers: { "x-user-email": session.email },
      });
      if (!res.ok) throw new Error("Could not load bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBookings(false);
    }
  }, [profile?._id, session?.email]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleBookingAction = async (bookingId, action) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: action }));
    setActionError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API}/${profile._id}/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": session.email,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");

      // Update booking in local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: data.status } : b))
      );

      const msgs = {
        confirm: "Booking confirmed — the traveler will be notified.",
        decline: "Booking declined.",
        complete: "Marked as completed. The traveler can now leave a review.",
      };
      setSuccessMsg(msgs[action] || "Done.");
      setTimeout(() => setSuccessMsg(""), 4000);

      // Refresh profile to update summary counts
      loadProfile();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: null }));
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`${API}/${profile._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": session.email,
        },
        body: JSON.stringify({
          bio: editForm.bio,
          photo: editForm.photo,
          pricePerDay: Number(editForm.pricePerDay),
          experienceYears: Number(editForm.experienceYears),
          cities: editForm.cities.split(",").map((c) => c.trim()).filter(Boolean),
          languages: editForm.languages.split(",").map((l) => l.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setProfile((prev) => ({ ...prev, ...data }));
      setEditMode(false);
      setSuccessMsg("Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (!session || session.role !== "guide") return null;

  if (loadingProfile) {
    return (
      <div className="gd-loading">
        <div className="gd-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="gd-error">
        <p>😕 {error}</p>
        <button onClick={() => navigate("/")}>Go home</button>
      </div>
    );
  }

  const statusMeta = STATUS_META[profile?.status] || STATUS_META.pending;
  const filteredBookings = bookings.filter((b) => b.status === activeTab);
  const bookingCounts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    declined: bookings.filter((b) => b.status === "declined").length,
  };

  return (
    <main className="gd-page">

      {/* ── Toast messages ── */}
      {successMsg && <div className="gd-toast gd-toast--success">{successMsg}</div>}
      {actionError && <div className="gd-toast gd-toast--error">{actionError}</div>}

      {/* ── Profile header ── */}
      <section className="gd-header">
        <div className="gd-header-left">
          <div className="gd-avatar-wrap">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={session.name}
                className="gd-avatar"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="gd-avatar-initials"
              style={{ display: profile.photo ? "none" : "flex" }}
            >
              {session.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "G"}
            </div>
          </div>
          <div>
            <h1 className="gd-name">{session.name}</h1>
            <p className="gd-email">{session.email}</p>
            <div className="gd-meta-pills">
              <span
                className="gd-status-pill"
                style={{
                  color: statusMeta.color,
                  background: statusMeta.bg,
                  border: `1px solid ${statusMeta.border}`,
                }}
              >
                {statusMeta.label}
              </span>
              {profile.rating > 0 && (
                <span className="gd-rating-pill">★ {profile.rating} ({profile.reviewsCount} reviews)</span>
              )}
              <span className="gd-price-pill">{formatCurrency(profile.pricePerDay)} / day</span>
            </div>

            {profile.status === "pending" && (
              <p className="gd-pending-notice">
                ⏳ Your profile is under review. You'll appear in search results once approved.
              </p>
            )}
          </div>
        </div>
        <button className="gd-edit-btn" onClick={() => setEditMode(true)}>
          ✏️ Edit Profile
        </button>
      </section>

      {/* ── Stats row ── */}
      <div className="gd-stats">
        {[
          { label: "Pending requests", value: profile.bookingSummary?.pending ?? bookingCounts.pending, color: "#ea580c", bg: "#fff7ed" },
          { label: "Confirmed trips", value: profile.bookingSummary?.confirmed ?? bookingCounts.confirmed, color: "#2563eb", bg: "#eff6ff" },
          { label: "Trips completed", value: profile.bookingSummary?.completed ?? bookingCounts.completed, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Total reviews", value: profile.reviewsCount || 0, color: "#7c3aed", bg: "#f5f3ff" },
        ].map((stat) => (
          <div className="gd-stat" key={stat.label}>
            <div className="gd-stat-num-wrap" style={{ background: stat.bg }}>
              <span className="gd-stat-num" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
            <span className="gd-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Profile summary strip ── */}
      <section className="gd-profile-strip">
        <div className="gd-strip-item">
          <span className="gd-strip-label">Experience</span>
          <span className="gd-strip-val">{profile.experienceYears}+ years</span>
        </div>
        <div className="gd-strip-item">
          <span className="gd-strip-label">Languages</span>
          <span className="gd-strip-val">
            {profile.languages?.length > 0 ? profile.languages.join(", ") : "—"}
          </span>
        </div>
        <div className="gd-strip-item">
          <span className="gd-strip-label">Cities</span>
          <span className="gd-strip-val">
            {profile.cities?.length > 0 ? profile.cities.join(", ") : "—"}
          </span>
        </div>
        <div className="gd-strip-item">
          <span className="gd-strip-label">States</span>
          <span className="gd-strip-val">
            {profile.states?.length > 0 ? profile.states.slice(0, 4).join(", ") + (profile.states.length > 4 ? ` +${profile.states.length - 4}` : "") : "—"}
          </span>
        </div>
      </section>

      {/* ── Bookings section ── */}
      <section className="gd-bookings-section">
        <h2 className="gd-section-title">Booking Requests</h2>

        {/* Tabs */}
        <div className="gd-tabs">
          {["pending", "confirmed", "completed", "declined"].map((tab) => (
            <button
              key={tab}
              className={`gd-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {bookingCounts[tab] > 0 && (
                <span className="gd-tab-count">{bookingCounts[tab]}</span>
              )}
            </button>
          ))}
        </div>

        {loadingBookings ? (
          <div className="gd-bookings-loading">
            <div className="gd-spinner" />
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="gd-empty">
            <p>
              {activeTab === "pending"
                ? "No pending requests right now. New requests will appear here."
                : `No ${activeTab} bookings yet.`}
            </p>
          </div>
        ) : (
          <div className="gd-booking-list">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                activeTab={activeTab}
                actionLoading={actionLoading}
                onAction={handleBookingAction}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Edit profile modal ── */}
      {editMode && (
        <div className="gd-overlay" onClick={() => setEditMode(false)}>
          <div className="gd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gd-modal-head">
              <h3>Edit Profile</h3>
              <button className="gd-modal-close" onClick={() => setEditMode(false)}>✕</button>
            </div>

            <form className="gd-edit-form" onSubmit={handleEditSave}>
              <label className="gd-label">
                Bio
                <textarea
                  className="gd-input"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  style={{ resize: "vertical" }}
                  placeholder="Tell travelers about yourself..."
                />
              </label>

              <label className="gd-label">
                Photo URL
                <input
                  className="gd-input"
                  type="url"
                  value={editForm.photo}
                  onChange={(e) => setEditForm((p) => ({ ...p, photo: e.target.value }))}
                  placeholder="https://yourphoto.com/you.jpg"
                />
                {editForm.photo && (
                  <img
                    src={editForm.photo}
                    alt="Preview"
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", marginTop: 6 }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
              </label>

              <div className="gd-edit-row">
                <label className="gd-label">
                  Price / day (₹)
                  <input
                    className="gd-input"
                    type="number"
                    value={editForm.pricePerDay}
                    onChange={(e) => setEditForm((p) => ({ ...p, pricePerDay: e.target.value }))}
                    min={0}
                  />
                </label>
                <label className="gd-label">
                  Years of experience
                  <input
                    className="gd-input"
                    type="number"
                    value={editForm.experienceYears}
                    onChange={(e) => setEditForm((p) => ({ ...p, experienceYears: e.target.value }))}
                    min={0}
                  />
                </label>
              </div>

              <label className="gd-label">
                Languages <span className="gd-hint">(comma separated)</span>
                <input
                  className="gd-input"
                  type="text"
                  value={editForm.languages}
                  onChange={(e) => setEditForm((p) => ({ ...p, languages: e.target.value }))}
                  placeholder="English, Hindi, Marathi"
                />
              </label>

              <label className="gd-label">
                Cities <span className="gd-hint">(comma separated)</span>
                <input
                  className="gd-input"
                  type="text"
                  value={editForm.cities}
                  onChange={(e) => setEditForm((p) => ({ ...p, cities: e.target.value }))}
                  placeholder="Mumbai, Pune, Nashik"
                />
              </label>

              {editError && <p className="gd-form-error">{editError}</p>}

              <div className="gd-edit-actions">
                <button type="button" className="gd-btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
                <button type="submit" className="gd-btn-primary" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .gd-page {
          width: min(1100px, 92%);
          margin: 0 auto 3rem;
          padding-top: 1.5rem;
          display: grid;
          gap: 1.4rem;
        }
        .gd-loading, .gd-error {
          text-align: center;
          padding: 4rem 1rem;
          color: #64748b;
        }
        .gd-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: gd-spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes gd-spin { to { transform: rotate(360deg); } }

        /* Toast */
        .gd-toast {
          position: fixed;
          top: 84px;
          right: 20px;
          z-index: 1500;
          padding: 0.7rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(15,23,42,0.12);
          animation: gd-fadein 0.2s ease;
        }
        @keyframes gd-fadein { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .gd-toast--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
        .gd-toast--error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

        /* Header */
        .gd-header {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.6rem 1.8rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .gd-header-left { display: flex; gap: 1.4rem; align-items: center; flex-wrap: wrap; }
        .gd-avatar-wrap { flex-shrink: 0; }
        .gd-avatar {
          width: 88px; height: 88px;
          border-radius: 50%; object-fit: cover;
          border: 3px solid #e0e7ff;
          display: block;
        }
        .gd-avatar-initials {
          width: 88px; height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: 3px solid #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          flex-shrink: 0;
        }
        .gd-name { margin: 0 0 3px; font-size: 1.5rem; color: #0f172a; font-weight: 700; }
        .gd-email { margin: 0 0 10px; font-size: 0.875rem; color: #64748b; }
        .gd-meta-pills { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
        .gd-status-pill {
          font-size: 0.78rem; font-weight: 700;
          border-radius: 999px; padding: 4px 12px;
        }
        .gd-rating-pill {
          font-size: 0.78rem; font-weight: 700; color: #78350f;
          background: #fefce8; border: 1px solid #fde68a;
          border-radius: 999px; padding: 4px 12px;
        }
        .gd-price-pill {
          font-size: 0.875rem; font-weight: 700; color: #4338ca;
          background: #eef2ff; border: 1px solid #c7d2fe;
          border-radius: 999px; padding: 4px 14px;
        }
        .gd-pending-notice {
          margin: 10px 0 0; font-size: 0.8rem; color: #92400e;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; padding: 7px 12px;
          max-width: 460px; line-height: 1.5;
        }
        .gd-edit-btn {
          padding: 0.6rem 1.1rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
          align-self: flex-start;
        }
        .gd-edit-btn:hover { border-color: #a5b4fc; background: #fafafe; color: #4338ca; }

        /* Stats */
        .gd-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .gd-stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.1rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .gd-stat-num-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gd-stat-num {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        }
        .gd-stat-label { font-size: 0.775rem; color: #64748b; line-height: 1.3; }

        /* Profile strip */
        .gd-profile-strip {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.9rem 1.2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0;
        }
        .gd-strip-item {
          flex: 1 1 200px;
          display: flex; flex-direction: column; gap: 3px;
          padding: 0.5rem 1rem;
          border-right: 1px solid #f1f5f9;
        }
        .gd-strip-item:last-child { border-right: none; }
        .gd-strip-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
        .gd-strip-val { font-size: 0.875rem; color: #0f172a; font-weight: 500; }

        /* Bookings section */
        .gd-bookings-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.2rem 1.4rem;
        }
        .gd-section-title { margin: 0 0 1rem; font-size: 1.1rem; color: #0f172a; }
        .gd-tabs { display: flex; gap: 4px; margin-bottom: 1rem; }
        .gd-tab {
          display: flex; align-items: center; gap: 5px;
          padding: 0.45rem 0.9rem;
          border: none; border-radius: 8px;
          font-size: 0.84rem; font-weight: 600;
          cursor: pointer; background: transparent; color: #64748b;
          transition: all 0.15s ease; font-family: inherit;
        }
        .gd-tab.active { background: #eef2ff; color: #4338ca; }
        .gd-tab:hover:not(.active) { background: #f1f5f9; }
        .gd-tab-count {
          background: #4f46e5; color: #fff;
          font-size: 0.7rem; font-weight: 700;
          border-radius: 999px; padding: 1px 6px; min-width: 18px;
          text-align: center;
        }
        .gd-bookings-loading { text-align: center; padding: 2rem; color: #64748b; }
        .gd-empty {
          text-align: center; padding: 2.5rem 1rem;
          background: #f8fafc; border: 1px dashed #e2e8f0;
          border-radius: 10px; color: #64748b; font-size: 0.875rem;
        }
        .gd-booking-list { display: grid; gap: 10px; }

        /* Booking card */
        .gd-booking-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem 1.2rem;
          display: grid;
          gap: 10px;
        }
        .gd-booking-card--pending { border-left: 3px solid #f97316; }
        .gd-booking-card--confirmed { border-left: 3px solid #2563eb; }
        .gd-booking-card--completed { border-left: 3px solid #16a34a; }
        .gd-booking-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
        .gd-traveler-info strong { font-size: 0.95rem; color: #0f172a; display: block; }
        .gd-traveler-info span { font-size: 0.8rem; color: #64748b; }
        .gd-booking-status {
          font-size: 0.75rem; font-weight: 700;
          border-radius: 999px; padding: 3px 10px;
        }
        .gd-booking-details { display: flex; flex-wrap: wrap; gap: 12px; }
        .gd-booking-detail { font-size: 0.825rem; color: #475569; }
        .gd-booking-detail strong { color: #0f172a; }
        .gd-booking-message {
          font-size: 0.825rem; color: #334155;
          background: #f8fafc; border: 1px solid #f1f5f9;
          border-radius: 8px; padding: 8px 10px;
          line-height: 1.5;
        }
        .gd-booking-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .gd-action-btn {
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem; font-weight: 700;
          cursor: pointer; border: none;
          transition: opacity 0.15s; font-family: inherit;
        }
        .gd-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .gd-action-confirm { background: #2563eb; color: #fff; }
        .gd-action-decline { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .gd-action-complete { background: #16a34a; color: #fff; }

        /* Edit modal */
        .gd-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(4px);
          z-index: 1400;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .gd-modal {
          width: min(560px, 95vw);
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 18px;
          padding: 1.4rem;
          box-shadow: 0 24px 48px rgba(15,23,42,0.16);
          border: 1px solid #e2e8f0;
        }
        .gd-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .gd-modal-head h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
        .gd-modal-close {
          border: 1px solid #e2e8f0; background: #f8fafc;
          border-radius: 7px; padding: 4px 9px;
          cursor: pointer; color: #475569; font-size: 0.875rem;
        }
        .gd-edit-form { display: grid; gap: 0.85rem; }
        .gd-label { display: grid; gap: 0.3rem; font-size: 0.84rem; font-weight: 600; color: #334155; }
        .gd-hint { font-weight: 400; color: #94a3b8; }
        .gd-input {
          border: 1px solid #e2e8f0; border-radius: 9px;
          padding: 0.6rem 0.75rem; font-size: 0.875rem;
          font-family: inherit; color: #0f172a; background: #fff;
          transition: border-color 0.15s; width: 100%; box-sizing: border-box;
        }
        .gd-input:focus { outline: none; border-color: #a5b4fc; }
        .gd-edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .gd-form-error {
          margin: 0; padding: 0.5rem 0.75rem;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; font-size: 0.82rem; color: #991b1b;
        }
        .gd-edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .gd-btn-primary {
          padding: 0.6rem 1.2rem; border: none; border-radius: 9px;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          color: #fff; font-size: 0.875rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s; font-family: inherit;
        }
        .gd-btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .gd-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .gd-btn-secondary {
          padding: 0.6rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 9px;
          background: #fff; color: #475569;
          font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }

        @media (max-width: 768px) {
          .gd-stats { grid-template-columns: repeat(2, 1fr); }
          .gd-strip-item { border-right: none; border-bottom: 1px solid #f1f5f9; }
          .gd-strip-item:last-child { border-bottom: none; }
          .gd-edit-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .gd-stats { grid-template-columns: 1fr 1fr; }
          .gd-tabs { flex-wrap: wrap; }
        }
      `}</style>
    </main>
  );
}

function BookingCard({ booking, activeTab, actionLoading, onAction }) {
  const meta = BOOKING_META[booking.status] || BOOKING_META.pending;
  const traveler = booking.travelerId;
  const isActioning = (action) => actionLoading[booking._id] === action;
  const anyActioning = actionLoading[booking._id];

  return (
    <article className={`gd-booking-card gd-booking-card--${booking.status}`}>
      <div className="gd-booking-top">
        <div className="gd-traveler-info">
          <strong>{traveler?.name || "Traveler"}</strong>
          <span>{traveler?.email || "—"}</span>
        </div>
        <span
          className="gd-booking-status"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
      </div>

      <div className="gd-booking-details">
        <span className="gd-booking-detail">
          📅 <strong>{formatDate(booking.date)}</strong>
        </span>
        <span className="gd-booking-detail">
          🕐 Requested <strong>{formatDate(booking.createdAt)}</strong>
        </span>
        {booking.tripGroupId && (
          <span className="gd-booking-detail">
            🧭 <strong>Linked to a group trip</strong>
          </span>
        )}
      </div>

      {booking.message && (
        <p className="gd-booking-message">"{booking.message}"</p>
      )}

      {/* Actions based on current status */}
      {booking.status === "pending" && (
        <div className="gd-booking-actions">
          <button
            className="gd-action-btn gd-action-confirm"
            onClick={() => onAction(booking._id, "confirm")}
            disabled={!!anyActioning}
          >
            {isActioning("confirm") ? "Confirming..." : "✓ Confirm Booking"}
          </button>
          <button
            className="gd-action-btn gd-action-decline"
            onClick={() => onAction(booking._id, "decline")}
            disabled={!!anyActioning}
          >
            {isActioning("decline") ? "Declining..." : "Decline"}
          </button>
        </div>
      )}

      {booking.status === "confirmed" && (
        <div className="gd-booking-actions">
          <button
            className="gd-action-btn gd-action-complete"
            onClick={() => onAction(booking._id, "complete")}
            disabled={!!anyActioning}
          >
            {isActioning("complete") ? "Marking..." : "✓ Mark as Completed"}
          </button>
        </div>
      )}

      {booking.status === "completed" && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>
          ✓ Trip completed — traveler can now leave a review
        </p>
      )}
    </article>
  );
}

export default GuideDashboard;