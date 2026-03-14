import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:8000/api/auth";
const LOCAL_SESSION_KEY = "travel_partner_session_v1";
const AUTH_EVENT = "travel-auth-changed";

const INTEREST_OPTIONS = ["Adventure", "Spiritual", "Luxury", "Budget"];
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh",
];

function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState(defaultMode);
  const [role, setRole] = useState("traveler");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    interest: "Adventure",
    // guide-only
    bio: "",
    photo: "",
    languages: "",
    pricePerDay: "",
    experienceYears: "",
    cities: "",
    states: [],
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const body = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role,
          interest: form.interest,
        };

        if (role === "guide") {
          body.bio = form.bio.trim();
          body.photo = form.photo.trim();
          body.languages = form.languages.split(",").map((l) => l.trim()).filter(Boolean);
          body.pricePerDay = Number(form.pricePerDay);
          body.experienceYears = Number(form.experienceYears) || 0;
          body.cities = form.cities.split(",").map((c) => c.trim()).filter(Boolean);
          body.states = form.states;
        }

        const res = await fetch(`${API}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");

        // After signup, log them in automatically
        const loginRes = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || "Auto-login failed");

        saveSession(loginData.user);
        navigate(role === "guide" ? "/" : "/travel-partner");
      } else {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        saveSession(data.user);
        navigate("/travel-partner");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (user) => {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  };

  const toggleState = (state) => {
    set("states", form.states.includes(state)
      ? form.states.filter((s) => s !== state)
      : [...form.states, state]
    );
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Azaad Safar</div>
        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        {/* Mode toggle */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-mode-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label className="auth-label">
                Full name
                <input
                  className="auth-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>

              {/* Role selector */}
              <div className="auth-role-row">
                <p className="auth-role-label">I am a</p>
                <div className="auth-role-btns">
                  <button
                    type="button"
                    className={`auth-role-btn ${role === "traveler" ? "active" : ""}`}
                    onClick={() => setRole("traveler")}
                  >
                    🧳 Traveler
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${role === "guide" ? "active" : ""}`}
                    onClick={() => setRole("guide")}
                  >
                    🧭 Tourist Guide
                  </button>
                </div>
              </div>

              <label className="auth-label">
                Travel interest
                <select
                  className="auth-input"
                  value={form.interest}
                  onChange={(e) => set("interest", e.target.value)}
                >
                  {INTEREST_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="auth-label">
            Email address
            <input
              className="auth-input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@email.com"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              required
            />
          </label>

          {/* Guide-only fields */}
          {mode === "signup" && role === "guide" && (
            <div className="auth-guide-section">
              <p className="auth-guide-heading">Guide Profile Details</p>
              <p className="auth-guide-note">
                Your profile will be reviewed before going live. Fill in as much as you can.
              </p>

              <label className="auth-label">
                Short bio
                <textarea
                  className="auth-input auth-textarea"
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Tell travelers about your experience, specialties, and what makes your tours unique..."
                  rows={3}
                />
              </label>

              <label className="auth-label">
                Profile photo URL
                <input
                  className="auth-input"
                  type="url"
                  value={form.photo}
                  onChange={(e) => set("photo", e.target.value)}
                  placeholder="https://your-photo-url.com/photo.jpg"
                />
              </label>

              <div className="auth-row-2">
                <label className="auth-label">
                  Price per day (₹)
                  <input
                    className="auth-input"
                    type="number"
                    value={form.pricePerDay}
                    onChange={(e) => set("pricePerDay", e.target.value)}
                    placeholder="e.g. 3500"
                    min={0}
                    required
                  />
                </label>
                <label className="auth-label">
                  Years of experience
                  <input
                    className="auth-input"
                    type="number"
                    value={form.experienceYears}
                    onChange={(e) => set("experienceYears", e.target.value)}
                    placeholder="e.g. 5"
                    min={0}
                  />
                </label>
              </div>

              <label className="auth-label">
                Languages spoken <span className="auth-hint">(comma separated)</span>
                <input
                  className="auth-input"
                  type="text"
                  value={form.languages}
                  onChange={(e) => set("languages", e.target.value)}
                  placeholder="English, Hindi, Marathi"
                />
              </label>

              <label className="auth-label">
                Cities you cover <span className="auth-hint">(comma separated)</span>
                <input
                  className="auth-input"
                  type="text"
                  value={form.cities}
                  onChange={(e) => set("cities", e.target.value)}
                  placeholder="Mumbai, Pune, Nashik"
                />
              </label>

              <div className="auth-label">
                States you cover
                <div className="auth-states-grid">
                  {INDIAN_STATES.map((state) => (
                    <button
                      key={state}
                      type="button"
                      className={`auth-state-pill ${form.states.includes(state) ? "active" : ""}`}
                      onClick={() => toggleState(state)}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : role === "guide"
              ? "Submit Guide Application"
              : "Create Account"}
          </button>
        </form>

        {mode === "signup" && role === "guide" && (
          <p className="auth-pending-note">
            Guide accounts are reviewed before activation. You can still log in and explore while waiting.
          </p>
        )}
      </div>

      <style>{`
        .auth-page {
          min-height: calc(100vh - 80px);
          display: grid;
          place-items: center;
          padding: 2rem 1rem;
          background: #f8fafc;
        }
        .auth-card {
          width: min(540px, 100%);
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: clamp(1.5rem, 3vw, 2.2rem);
          box-shadow: 0 12px 32px rgba(15,23,42,0.08);
        }
        .auth-brand {
          font-size: 1rem;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: -0.3px;
          margin-bottom: 0.6rem;
          text-transform: uppercase;
        }
        .auth-title {
          margin: 0 0 1.2rem;
          font-size: clamp(1.4rem, 3vw, 1.9rem);
          color: #0f172a;
          line-height: 1.2;
        }
        .auth-mode-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 1.4rem;
        }
        .auth-mode-tab {
          padding: 0.55rem;
          border: none;
          border-radius: 9px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .auth-mode-tab.active {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 1px 4px rgba(15,23,42,0.1);
        }
        .auth-form {
          display: grid;
          gap: 0.9rem;
        }
        .auth-label {
          display: grid;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .auth-hint {
          font-weight: 400;
          color: #94a3b8;
        }
        .auth-input {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
          font-size: 0.9rem;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
          transition: border-color 0.15s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .auth-input:focus {
          outline: none;
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(165,180,252,0.2);
        }
        .auth-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .auth-role-row {
          display: grid;
          gap: 0.5rem;
        }
        .auth-role-label {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .auth-role-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .auth-role-btn {
          padding: 0.65rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .auth-role-btn.active {
          border-color: #6366f1;
          background: #eef2ff;
          color: #4338ca;
        }
        .auth-guide-section {
          border: 1px solid #e0e7ff;
          border-radius: 14px;
          padding: 1rem;
          background: #fafafe;
          display: grid;
          gap: 0.9rem;
        }
        .auth-guide-heading {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        .auth-guide-note {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
        }
        .auth-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .auth-states-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 0.4rem;
        }
        .auth-state-pill {
          padding: 4px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          font-size: 0.75rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .auth-state-pill.active {
          border-color: #6366f1;
          background: #eef2ff;
          color: #4338ca;
          font-weight: 600;
        }
        .auth-error {
          margin: 0;
          padding: 0.6rem 0.8rem;
          border: 1px solid #fecaca;
          background: #fef2f2;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #991b1b;
        }
        .auth-submit {
          padding: 0.75rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          cursor: pointer;
          transition: opacity 0.15s ease;
          margin-top: 0.3rem;
        }
        .auth-submit:hover:not(:disabled) {
          opacity: 0.9;
        }
        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-pending-note {
          margin: 1rem 0 0;
          font-size: 0.8rem;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 0.6rem;
        }
        @media (max-width: 480px) {
          .auth-row-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default Auth;