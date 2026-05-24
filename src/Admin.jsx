import { useEffect, useState, useCallback } from "react";

// Admin panel — password protected via ADMIN_PASSWORD env variable
// Access at /admin — enter your ADMIN_PASSWORD from .env to unlock
// Lets you approve/suspend guides and see platform stats

const API = "http://localhost:8000/api/admin";

const formatDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

const STATUS_COLORS = {
  pending:   { color: "#92400e", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  active:    { color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0", label: "Active" },
  suspended: { color: "#991b1b", bg: "#fef2f2", border: "#fecaca", label: "Suspended" },
};

function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("admin_token"));
  const [tokenInput, setTokenInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  const token = sessionStorage.getItem("admin_token") || "";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [token]);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/guides?status=${statusFilter}`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) setGuides(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [token, statusFilter]);

  useEffect(() => {
    if (!authed) return;
    loadStats();
    loadGuides();
  }, [authed, loadStats, loadGuides]);

  const handleLogin = (e) => {
    e.preventDefault();
    // We verify the token by making a test request
    fetch(`${API}/stats`, {
      headers: { "x-admin-token": tokenInput },
    }).then((res) => {
      if (res.ok) {
        sessionStorage.setItem("admin_token", tokenInput);
        setAuthed(true);
        setLoginError("");
      } else {
        setLoginError("Wrong password. Check your ADMIN_PASSWORD in .env");
      }
    }).catch(() => setLoginError("Could not reach server"));
  };

  const handleStatusChange = async (guideId, newStatus) => {
    setActionLoading((p) => ({ ...p, [guideId]: newStatus }));
    try {
      const res = await fetch(`${API}/guides/${guideId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setGuides((prev) => prev.map((g) =>
        g._id === guideId ? { ...g, status: newStatus } : g
      ));

      const msgs = {
        active: `✓ ${data.userId?.name || "Guide"} is now active and visible to travelers`,
        suspended: `Guide suspended`,
        pending: `Guide moved back to pending`,
      };
      showToast(msgs[newStatus] || "Updated");
      loadStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading((p) => ({ ...p, [guideId]: null }));
    }
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) return (
    <main className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-brand">Azaad Safar</div>
        <h1 className="adm-login-title">Admin Panel</h1>
        <p className="adm-login-sub">Enter your admin password to continue</p>
        <form onSubmit={handleLogin} className="adm-login-form">
          <input
            className="adm-input"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin password"
            autoFocus
            required
          />
          {loginError && <p className="adm-login-error">{loginError}</p>}
          <button type="submit" className="adm-submit">Enter</button>
        </form>
        <p className="adm-login-hint">Set ADMIN_PASSWORD in your server .env file</p>
      </div>

      <style>{`
        .adm-login-page {
          min-height: 100vh; display: grid; place-items: center;
          background: #f8fafc; padding: 1rem;
        }
        .adm-login-card {
          width: min(420px, 100%);
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 2rem;
          box-shadow: 0 12px 32px rgba(15,23,42,0.08);
          text-align: center; display: grid; gap: 0.6rem;
        }
        .adm-brand { font-size: 0.85rem; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.08em; }
        .adm-login-title { margin: 0; font-size: 1.7rem; color: #0f172a; }
        .adm-login-sub { margin: 0; font-size: 0.875rem; color: #64748b; }
        .adm-login-form { display: grid; gap: 0.75rem; margin-top: 0.5rem; }
        .adm-input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.8rem; font-size: 0.9rem; font-family: inherit; width: 100%; box-sizing: border-box; }
        .adm-input:focus { outline: none; border-color: #a5b4fc; }
        .adm-login-error { margin: 0; font-size: 0.82rem; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 6px 10px; }
        .adm-submit { padding: 0.7rem; border: none; border-radius: 10px; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: inherit; }
        .adm-login-hint { margin: 0.5rem 0 0; font-size: 0.75rem; color: #94a3b8; }
      `}</style>
    </main>
  );

  // ── Main admin dashboard ──────────────────────────────────────────────────
  const pendingCount = guides.filter((g) => g.status === "pending").length;

  return (
    <main className="adm-page">

      {toast && (
        <div className={`adm-toast ${toast.type === "error" ? "adm-toast--err" : ""}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="adm-header">
        <div>
          <p className="adm-brand-sm">Azaad Safar</p>
          <h1 className="adm-title">Admin Panel</h1>
        </div>
        <button
          className="adm-logout"
          onClick={() => { sessionStorage.removeItem("admin_token"); setAuthed(false); }}
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="adm-stats">
          {[
            { label: "Total users", value: stats.totalUsers, color: "#4f46e5" },
            { label: "Active guides", value: stats.activeGuides, color: "#16a34a" },
            { label: "Pending approval", value: stats.pendingGuides, color: "#f97316", highlight: stats.pendingGuides > 0 },
            { label: "Total bookings", value: stats.totalBookings, color: "#2563eb" },
          ].map((s) => (
            <div key={s.label} className={`adm-stat ${s.highlight ? "adm-stat--alert" : ""}`}>
              <span className="adm-stat-num" style={{ color: s.color }}>{s.value}</span>
              <span className="adm-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Guide management */}
      <section className="adm-section">
        <div className="adm-section-head">
          <h2 className="adm-section-title">
            Guide Applications
            {pendingCount > 0 && statusFilter === "pending" && (
              <span className="adm-pending-badge">{pendingCount} need review</span>
            )}
          </h2>
          <div className="adm-filter-tabs">
            {["pending", "active", "suspended"].map((s) => (
              <button
                key={s}
                className={`adm-filter-tab ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">
            <div className="adm-spinner" />
            <p>Loading guides...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="adm-empty">
            <p>No {statusFilter} guides right now.</p>
            {statusFilter === "pending" && (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>
                New guide registrations will appear here for approval.
              </p>
            )}
          </div>
        ) : (
          <div className="adm-guide-list">
            {guides.map((guide) => (
              <GuideRow
                key={guide._id}
                guide={guide}
                actionLoading={actionLoading}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      <style>{`
        .adm-page {
          width: min(1100px, 92%);
          margin: 0 auto 3rem;
          padding-top: 1.5rem;
          display: grid;
          gap: 1.4rem;
        }
        .adm-toast {
          position: fixed; top: 20px; right: 20px; z-index: 2000;
          background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
          border-radius: 12px; padding: 0.7rem 1rem;
          font-size: 0.875rem; font-weight: 600;
          box-shadow: 0 8px 24px rgba(15,23,42,0.1);
          animation: adm-fadein 0.2s ease;
        }
        .adm-toast--err { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        @keyframes adm-fadein { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        .adm-header {
          display: flex; justify-content: space-between; align-items: center;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 1.2rem 1.5rem;
        }
        .adm-brand-sm { margin: 0 0 2px; font-size: 0.78rem; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.08em; }
        .adm-title { margin: 0; font-size: 1.4rem; color: #0f172a; }
        .adm-logout {
          padding: 0.5rem 1rem; border: 1px solid #e2e8f0; background: #f8fafc;
          border-radius: 8px; font-size: 0.84rem; font-weight: 600;
          color: #475569; cursor: pointer; font-family: inherit;
        }
        .adm-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        .adm-stat {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 1.1rem; display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 6px;
        }
        .adm-stat--alert { border-color: #fde68a; background: #fffbeb; }
        .adm-stat-num { font-size: 2rem; font-weight: 800; font-family: ui-monospace, monospace; }
        .adm-stat-label { font-size: 0.775rem; color: #64748b; }
        .adm-section {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 1.2rem 1.4rem;
        }
        .adm-section-head {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 10px; margin-bottom: 1.1rem;
        }
        .adm-section-title {
          margin: 0; font-size: 1.05rem; color: #0f172a;
          display: flex; align-items: center; gap: 10px;
        }
        .adm-pending-badge {
          font-size: 0.72rem; font-weight: 700; color: #92400e;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 999px; padding: 2px 10px;
        }
        .adm-filter-tabs { display: flex; gap: 4px; }
        .adm-filter-tab {
          padding: 0.4rem 0.85rem; border: none; border-radius: 8px;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          background: transparent; color: #64748b; font-family: inherit;
          transition: all 0.15s;
        }
        .adm-filter-tab.active { background: #eef2ff; color: #4338ca; }
        .adm-loading { text-align: center; padding: 2.5rem; color: #64748b; }
        .adm-spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(99,102,241,0.15); border-top-color: #6366f1;
          border-radius: 50%; animation: adm-spin 0.8s linear infinite;
          margin: 0 auto 0.75rem;
        }
        @keyframes adm-spin { to { transform: rotate(360deg); } }
        .adm-empty {
          text-align: center; padding: 2.5rem; background: #f8fafc;
          border: 1px dashed #e2e8f0; border-radius: 10px; color: #64748b;
        }
        .adm-guide-list { display: grid; gap: 10px; }
        /* Guide row */
        .adm-guide-row {
          border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 1.2rem;
          display: grid; grid-template-columns: 1fr auto;
          gap: 12px; align-items: center;
        }
        .adm-guide-main { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; }
        .adm-guide-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          object-fit: cover; border: 2px solid #e0e7ff; flex-shrink: 0;
        }
        .adm-guide-initials {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .adm-guide-info { display: grid; gap: 3px; }
        .adm-guide-name { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
        .adm-guide-email { margin: 0; font-size: 0.8rem; color: #64748b; }
        .adm-guide-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .adm-meta-pill {
          font-size: 0.72rem; font-weight: 600; border-radius: 6px;
          padding: 2px 8px; border: 1px solid #e2e8f0; color: #475569; background: #f8fafc;
        }
        .adm-status-pill {
          font-size: 0.72rem; font-weight: 700;
          border-radius: 999px; padding: 3px 10px;
        }
        .adm-guide-bio {
          font-size: 0.8rem; color: #475569; line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          margin-top: 4px; max-width: 600px;
        }
        .adm-guide-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .adm-action-btn {
          padding: 0.45rem 0.9rem; border-radius: 8px;
          font-size: 0.8rem; font-weight: 700; cursor: pointer;
          transition: opacity 0.15s; font-family: inherit; border: none;
          white-space: nowrap;
        }
        .adm-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .adm-btn-approve { background: #16a34a; color: #fff; }
        .adm-btn-suspend { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .adm-btn-reactivate { background: #2563eb; color: #fff; }
        .adm-registered { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
        @media (max-width: 768px) {
          .adm-stats { grid-template-columns: repeat(2, 1fr); }
          .adm-guide-row { grid-template-columns: 1fr; }
          .adm-guide-actions { justify-content: flex-start; }
        }
      `}</style>
    </main>
  );
}

function GuideRow({ guide, actionLoading, onStatusChange }) {
  const name = guide.userId?.name || "Guide";
  const email = guide.userId?.email || "—";
  const sm = STATUS_COLORS[guide.status] || STATUS_COLORS.pending;
  const busy = actionLoading[guide._id];

  return (
    <div className="adm-guide-row">
      <div className="adm-guide-main">
        {guide.photo ? (
          <img src={guide.photo} alt={name} className="adm-guide-avatar"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
        ) : null}
        <div className="adm-guide-initials" style={{ display: guide.photo ? "none" : "flex" }}>
          {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        <div className="adm-guide-info">
          <h3 className="adm-guide-name">{name}</h3>
          <p className="adm-guide-email">{email}</p>
          <p className="adm-registered">Registered {formatDate(guide.userId?.createdAt)}</p>

          <div className="adm-guide-meta">
            <span
              className="adm-status-pill"
              style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}
            >
              {sm.label}
            </span>
            <span className="adm-meta-pill">{formatCurrency(guide.pricePerDay)}/day</span>
            {guide.experienceYears > 0 && (
              <span className="adm-meta-pill">{guide.experienceYears}+ yrs</span>
            )}
            {guide.languages?.length > 0 && (
              <span className="adm-meta-pill">{guide.languages.slice(0, 3).join(", ")}</span>
            )}
            {guide.cities?.length > 0 && (
              <span className="adm-meta-pill">📍 {guide.cities.slice(0, 2).join(", ")}</span>
            )}
          </div>

          {guide.bio && <p className="adm-guide-bio">{guide.bio}</p>}
        </div>
      </div>

      <div className="adm-guide-actions">
        {guide.status === "pending" && (
          <button
            className="adm-action-btn adm-btn-approve"
            onClick={() => onStatusChange(guide._id, "active")}
            disabled={!!busy}
          >
            {busy === "active" ? "Approving..." : "✓ Approve"}
          </button>
        )}
        {guide.status === "active" && (
          <button
            className="adm-action-btn adm-btn-suspend"
            onClick={() => onStatusChange(guide._id, "suspended")}
            disabled={!!busy}
          >
            {busy === "suspended" ? "Suspending..." : "Suspend"}
          </button>
        )}
        {guide.status === "suspended" && (
          <button
            className="adm-action-btn adm-btn-reactivate"
            onClick={() => onStatusChange(guide._id, "active")}
            disabled={!!busy}
          >
            {busy === "active" ? "Reactivating..." : "Reactivate"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Admin;