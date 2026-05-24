import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// All auth goes to the real backend — no localStorage user store anymore
// POST /api/auth/signup → creates User (+ GuideProfile if role=guide) in MongoDB
// POST /api/auth/login  → verifies email+password against DB, returns session
// Session is saved to localStorage so Navbar + TravelPlanner can read it

const API = "http://localhost:8000/api/auth";
const LOCAL_SESSION_KEY = "travel_partner_session_v1";
const AUTH_EVENT = "travel-auth-changed";

const INTEREST_OPTIONS = ["Adventure", "Spiritual", "Luxury", "Budget"];
const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Marathi", "Bengali", "Tamil", "Telugu",
  "Kannada", "Malayalam", "Gujarati", "Punjabi", "Urdu",
  "Odia", "Assamese", "French", "German", "Spanish", "Ladakhi",
];
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh",
];

const saveSession = (user) => {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "0 0 1.4rem" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 999,
            background: i === current ? "#4f46e5" : i < current ? "#a5b4fc" : "#e2e8f0",
            transition: "all 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // "login" | "signup-choose" | "signup-traveler" | "signup-guide"
  const defaultView = searchParams.get("mode") === "signup" ? "signup-choose" : "login";
  const [view, setView] = useState(defaultView);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // ── Login form state ──
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // ── Traveler signup state ──
  const [travelerForm, setTravelerForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", interest: "Adventure",
  });

  // ── Guide signup — split into 2 steps ──
  const [guideStep, setGuideStep] = useState(0); // 0 = account, 1 = profile
  const [guideForm, setGuideForm] = useState({
    // Step 0 — account
    name: "", email: "", password: "", confirmPassword: "", interest: "Adventure",
    // Step 1 — profile
    bio: "", photo: "", languages: [],
    pricePerDay: "", experienceYears: "",
    cities: "", states: [],
  });

  const setG = (field, value) => setGuideForm((p) => ({ ...p, [field]: value }));
  const setT = (field, value) => setTravelerForm((p) => ({ ...p, [field]: value }));
  const setL = (field, value) => setLoginForm((p) => ({ ...p, [field]: value }));

  const toggleLang = (lang) =>
    setG("languages", guideForm.languages.includes(lang)
      ? guideForm.languages.filter((l) => l !== lang)
      : [...guideForm.languages, lang]);

  const toggleState = (s) =>
    setG("states", guideForm.states.includes(s)
      ? guideForm.states.filter((x) => x !== s)
      : [...guideForm.states, s]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid email or password");

      saveSession({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        interest: data.user.interest,
        guideProfileId: data.user.guideProfileId || null,
        guideStatus: data.user.guideStatus || null,
      });

      navigate(data.user.role === "guide" ? "/guide-dashboard" : "/travel-partner");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTravelerSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (travelerForm.password !== travelerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: travelerForm.name.trim(),
          email: travelerForm.email.trim(),
          password: travelerForm.password,
          role: "traveler",
          interest: travelerForm.interest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sign up failed");

      // Auto-login after signup
      const loginRes = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: travelerForm.email.trim(), password: travelerForm.password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error("Account created — please log in");

      saveSession({
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        interest: loginData.user.interest,
      });
      navigate("/travel-partner");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideStep0 = (e) => {
    e.preventDefault();
    setError("");
    if (guideForm.password !== guideForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setGuideStep(1);
  };

  const handleGuideSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!guideForm.pricePerDay || Number(guideForm.pricePerDay) <= 0) {
      setError("Please enter a valid price per day");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guideForm.name.trim(),
          email: guideForm.email.trim(),
          password: guideForm.password,
          role: "guide",
          interest: guideForm.interest,
          bio: guideForm.bio.trim(),
          photo: guideForm.photo.trim(),
          languages: guideForm.languages,
          pricePerDay: Number(guideForm.pricePerDay),
          experienceYears: Number(guideForm.experienceYears) || 0,
          cities: guideForm.cities.split(",").map((c) => c.trim()).filter(Boolean),
          states: guideForm.states,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setSignupSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp = {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "0.65rem 0.8rem",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.15s",
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  VIEW: LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "login") return (
    <PageShell>
      <Brand />
      <h1 className="a-title">Welcome back</h1>
      <p className="a-sub">Login to your Azaad Safar account</p>

      <form className="a-form" onSubmit={handleLogin}>
        <Field label="Email address">
          <input style={inp} type="email" value={loginForm.email}
            onChange={(e) => setL("email", e.target.value)}
            placeholder="you@email.com" required />
        </Field>
        <Field label="Password">
          <input style={inp} type="password" value={loginForm.password}
            onChange={(e) => setL("password", e.target.value)}
            placeholder="Your password" required />
        </Field>

        {error && <ErrBox msg={error} />}

        <SubmitBtn loading={loading}>Login</SubmitBtn>
      </form>

      <p className="a-switch">
        Don't have an account?{" "}
        <button className="a-switch-btn" onClick={() => { setView("signup-choose"); setError(""); }}>
          Sign up
        </button>
      </p>
    </PageShell>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  VIEW: CHOOSE ROLE
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "signup-choose") return (
    <PageShell>
      <Brand />
      <h1 className="a-title">Create your account</h1>
      <p className="a-sub">Which best describes you?</p>

      <div className="a-role-grid">
        <button className="a-role-card" onClick={() => { setView("signup-traveler"); setError(""); }}>
          <span className="a-role-icon">🧳</span>
          <strong>I'm a Traveler</strong>
          <p>Explore India, join group trips, and find travel partners</p>
        </button>
        <button className="a-role-card" onClick={() => { setView("signup-guide"); setGuideStep(0); setError(""); }}>
          <span className="a-role-icon">🧭</span>
          <strong>I'm a Tourist Guide</strong>
          <p>Register as a verified guide and get hired by travelers</p>
        </button>
      </div>

      <p className="a-switch">
        Already have an account?{" "}
        <button className="a-switch-btn" onClick={() => { setView("login"); setError(""); }}>
          Log in
        </button>
      </p>
    </PageShell>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  VIEW: TRAVELER SIGNUP
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "signup-traveler") return (
    <PageShell>
      <Brand />
      <BackBtn onClick={() => { setView("signup-choose"); setError(""); }} />
      <h1 className="a-title">Create traveler account</h1>
      <p className="a-sub">Join thousands of travelers exploring India</p>

      <form className="a-form" onSubmit={handleTravelerSignup}>
        <Field label="Full name">
          <input style={inp} type="text" value={travelerForm.name}
            onChange={(e) => setT("name", e.target.value)}
            placeholder="Your full name" required />
        </Field>
        <Field label="Email address">
          <input style={inp} type="email" value={travelerForm.email}
            onChange={(e) => setT("email", e.target.value)}
            placeholder="you@email.com" required />
        </Field>
        <div className="a-grid-2">
          <Field label="Password">
            <input style={inp} type="password" value={travelerForm.password}
              onChange={(e) => setT("password", e.target.value)}
              placeholder="Min 6 characters" required />
          </Field>
          <Field label="Confirm password">
            <input style={inp} type="password" value={travelerForm.confirmPassword}
              onChange={(e) => setT("confirmPassword", e.target.value)}
              placeholder="Repeat password" required />
          </Field>
        </div>
        <Field label="Travel interest">
          <select style={inp} value={travelerForm.interest}
            onChange={(e) => setT("interest", e.target.value)}>
            {INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        {error && <ErrBox msg={error} />}
        <SubmitBtn loading={loading}>Create Account</SubmitBtn>
      </form>

      <p className="a-switch">
        Already have an account?{" "}
        <button className="a-switch-btn" onClick={() => { setView("login"); setError(""); }}>
          Log in
        </button>
      </p>
    </PageShell>
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  VIEW: GUIDE SIGNUP (2 steps)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "signup-guide") {
    if (signupSuccess) return (
      <PageShell>
        <Brand />
        <div className="a-success-box">
          <span style={{ fontSize: "2.5rem" }}>🎉</span>
          <h2>Application submitted!</h2>
          <p>
            Your guide profile is under review. We'll activate it shortly.
            You can log in and explore while you wait.
          </p>
          <button className="a-submit-btn" onClick={() => { setView("login"); setSignupSuccess(false); }}>
            Go to Login
          </button>
        </div>
      </PageShell>
    );

    return (
      <PageShell wide>
        <Brand />
        <BackBtn onClick={() => {
          if (guideStep === 1) { setGuideStep(0); setError(""); }
          else { setView("signup-choose"); setError(""); }
        }} />
        <h1 className="a-title">Register as a Guide</h1>
        <p className="a-sub">{guideStep === 0 ? "Step 1 of 2 — Account details" : "Step 2 of 2 — Your guide profile"}</p>
        <StepDots total={2} current={guideStep} />

        {/* ── STEP 0: Account ── */}
        {guideStep === 0 && (
          <form className="a-form" onSubmit={handleGuideStep0}>
            <Field label="Full name">
              <input style={inp} type="text" value={guideForm.name}
                onChange={(e) => setG("name", e.target.value)}
                placeholder="Your full name" required />
            </Field>
            <Field label="Email address">
              <input style={inp} type="email" value={guideForm.email}
                onChange={(e) => setG("email", e.target.value)}
                placeholder="you@email.com" required />
            </Field>
            <div className="a-grid-2">
              <Field label="Password">
                <input style={inp} type="password" value={guideForm.password}
                  onChange={(e) => setG("password", e.target.value)}
                  placeholder="Min 6 characters" required />
              </Field>
              <Field label="Confirm password">
                <input style={inp} type="password" value={guideForm.confirmPassword}
                  onChange={(e) => setG("confirmPassword", e.target.value)}
                  placeholder="Repeat password" required />
              </Field>
            </div>
            <Field label="Primary travel interest">
              <select style={inp} value={guideForm.interest}
                onChange={(e) => setG("interest", e.target.value)}>
                {INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            {error && <ErrBox msg={error} />}
            <SubmitBtn loading={false}>Next — Profile Details →</SubmitBtn>
          </form>
        )}

        {/* ── STEP 1: Profile ── */}
        {guideStep === 1 && (
          <form className="a-form" onSubmit={handleGuideSignup}>
            <Field label="Short bio" hint="Tell travelers about your speciality and style">
              <textarea style={{ ...inp, resize: "vertical", minHeight: 90 }}
                value={guideForm.bio}
                onChange={(e) => setG("bio", e.target.value)}
                placeholder="E.g. I specialise in heritage walks and food tours in Old Delhi. 8 years experience with groups of all sizes..."
                required />
            </Field>

            <Field label="Profile photo URL" hint="Link to a clear photo of yourself">
              <input style={inp} type="url" value={guideForm.photo}
                onChange={(e) => setG("photo", e.target.value)}
                placeholder="https://yourphoto.com/you.jpg" />
              {guideForm.photo && (
                <img src={guideForm.photo} alt="Preview"
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginTop: 8, border: "2px solid #e0e7ff" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              )}
            </Field>

            <div className="a-grid-2">
              <Field label="Price per day (₹)" hint="What you charge for a full day">
                <input style={inp} type="number" value={guideForm.pricePerDay}
                  onChange={(e) => setG("pricePerDay", e.target.value)}
                  placeholder="e.g. 3500" min={100} required />
              </Field>
              <Field label="Years of experience">
                <input style={inp} type="number" value={guideForm.experienceYears}
                  onChange={(e) => setG("experienceYears", e.target.value)}
                  placeholder="e.g. 5" min={0} />
              </Field>
            </div>

            <Field label="Cities you cover" hint="Comma separated — e.g. Mumbai, Pune, Nashik">
              <input style={inp} type="text" value={guideForm.cities}
                onChange={(e) => setG("cities", e.target.value)}
                placeholder="Mumbai, Pune, Nashik" required />
            </Field>

            <Field label="Languages you speak">
              <div className="a-pill-grid">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button key={lang} type="button"
                    className={`a-pill ${guideForm.languages.includes(lang) ? "active" : ""}`}
                    onClick={() => toggleLang(lang)}>
                    {lang}
                  </button>
                ))}
              </div>
              {guideForm.languages.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "#f97316", marginTop: 4 }}>
                  Select at least one language
                </p>
              )}
            </Field>

            <Field label="States you operate in">
              <div className="a-pill-grid">
                {INDIAN_STATES.map((s) => (
                  <button key={s} type="button"
                    className={`a-pill ${guideForm.states.includes(s) ? "active" : ""}`}
                    onClick={() => toggleState(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            {/* Summary before submit */}
            <div className="a-summary">
              <p className="a-summary-title">Your application summary</p>
              <div className="a-summary-row"><span>Name</span><strong>{guideForm.name || "—"}</strong></div>
              <div className="a-summary-row"><span>Email</span><strong>{guideForm.email || "—"}</strong></div>
              <div className="a-summary-row"><span>Price/day</span><strong>{guideForm.pricePerDay ? `₹${guideForm.pricePerDay}` : "—"}</strong></div>
              <div className="a-summary-row"><span>Languages</span><strong>{guideForm.languages.join(", ") || "—"}</strong></div>
              <div className="a-summary-row"><span>Cities</span><strong>{guideForm.cities || "—"}</strong></div>
            </div>

            {error && <ErrBox msg={error} />}
            <SubmitBtn loading={loading}>Submit Guide Application</SubmitBtn>

            <p style={{ fontSize: "0.775rem", color: "#64748b", textAlign: "center", marginTop: 4 }}>
              Your profile will be reviewed before going live. You can still log in and explore while waiting.
            </p>
          </form>
        )}
      </PageShell>
    );
  }

  return null;
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function PageShell({ children, wide }) {
  return (
    <main className="a-page">
      <div className={`a-card ${wide ? "a-card--wide" : ""}`}>
        {children}
      </div>
      <style>{`
        .a-page {
          min-height: calc(100vh - 80px);
          display: grid;
          place-items: center;
          padding: 2rem 1rem;
          background: #f8fafc;
        }
        .a-card {
          width: min(500px, 100%);
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: clamp(1.5rem, 3vw, 2.2rem);
          box-shadow: 0 12px 32px rgba(15,23,42,0.08);
        }
        .a-card--wide { width: min(680px, 100%); }
        .a-brand {
          font-size: 0.85rem;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0 0 0.5rem;
        }
        .a-title {
          margin: 0 0 0.3rem;
          font-size: clamp(1.4rem, 3vw, 1.9rem);
          color: #0f172a;
          line-height: 1.2;
        }
        .a-sub {
          margin: 0 0 1.4rem;
          font-size: 0.875rem;
          color: #64748b;
        }
        .a-form { display: grid; gap: 0.9rem; }
        .a-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .a-field { display: grid; gap: 0.3rem; }
        .a-field-label {
          font-size: 0.84rem;
          font-weight: 600;
          color: #334155;
        }
        .a-field-hint {
          font-size: 0.75rem;
          font-weight: 400;
          color: #94a3b8;
          margin-left: 4px;
        }
        .a-pill-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .a-pill {
          padding: 4px 11px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          font-size: 0.775rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.12s ease;
          font-family: inherit;
        }
        .a-pill.active {
          border-color: #6366f1;
          background: #eef2ff;
          color: #4338ca;
          font-weight: 600;
        }
        .a-err {
          padding: 0.6rem 0.8rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.84rem;
          color: #991b1b;
          margin: 0;
        }
        .a-submit-btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          cursor: pointer;
          transition: opacity 0.15s ease;
          font-family: inherit;
        }
        .a-submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .a-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .a-switch {
          margin: 1.1rem 0 0;
          text-align: center;
          font-size: 0.84rem;
          color: #64748b;
        }
        .a-switch-btn {
          border: none;
          background: transparent;
          color: #4f46e5;
          font-weight: 700;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          padding: 0;
        }
        .a-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 1.2rem;
        }
        .a-role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 1.4rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .a-role-card:hover {
          border-color: #6366f1;
          background: #fafafe;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(99,102,241,0.12);
        }
        .a-role-icon { font-size: 2rem; }
        .a-role-card strong { font-size: 0.95rem; color: #0f172a; }
        .a-role-card p {
          margin: 0;
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
        }
        .a-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.6rem;
          font-family: inherit;
        }
        .a-back-btn:hover { color: #4f46e5; }
        .a-summary {
          border: 1px solid #e0e7ff;
          border-radius: 12px;
          background: #fafafe;
          padding: 0.9rem;
          display: grid;
          gap: 6px;
        }
        .a-summary-title {
          margin: 0 0 4px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }
        .a-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.84rem;
        }
        .a-summary-row span { color: #64748b; }
        .a-summary-row strong { color: #0f172a; text-align: right; max-width: 60%; word-break: break-word; }
        .a-success-box {
          display: grid;
          place-items: center;
          text-align: center;
          gap: 10px;
          padding: 1rem 0;
        }
        .a-success-box h2 { margin: 0; color: #0f172a; }
        .a-success-box p { margin: 0; color: #475569; font-size: 0.9rem; line-height: 1.6; max-width: 36ch; }
        @media (max-width: 500px) {
          .a-grid-2 { grid-template-columns: 1fr; }
          .a-role-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}

function Brand() {
  return <p className="a-brand">Azaad Safar</p>;
}

function BackBtn({ onClick }) {
  return (
    <button type="button" className="a-back-btn" onClick={onClick}>
      ← Back
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="a-field">
      <label className="a-field-label">
        {label}
        {hint && <span className="a-field-hint">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ErrBox({ msg }) {
  return <p className="a-err">{msg}</p>;
}

function SubmitBtn({ children, loading }) {
  return (
    <button type="submit" className="a-submit-btn" disabled={loading}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Auth;