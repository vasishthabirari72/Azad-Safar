import { useState, useRef } from "react";

const INTERESTS = ["Adventure", "Heritage & Culture", "Food & Markets", "Spiritual", "Nature & Wildlife", "Beaches", "Shopping", "Luxury", "Budget", "Photography"];
const DURATIONS = ["1 day", "2 days", "3 days", "4 days", "5 days", "1 week", "10 days", "2 weeks"];
const BUDGETS = ["Budget (₹500–1500/day)", "Mid-range (₹1500–4000/day)", "Comfort (₹4000–8000/day)", "Luxury (₹8000+/day)"];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function AiTripPlanner() {
  const [form, setForm] = useState({
    destination: "",
    duration: "3 days",
    groupSize: "2",
    budget: "Mid-range (₹1500–4000/day)",
    interests: [],
    specialRequests: "",
  });

  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const planRef = useRef(null);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const toggleInterest = (interest) => {
    set("interests", form.interests.includes(interest)
      ? form.interests.filter((i) => i !== interest)
      : [...form.interests, interest]
    );
  };

  const buildPrompt = () => {
    const interests = form.interests.length > 0
      ? form.interests.join(", ")
      : "general sightseeing";

    return `You are an expert Indian travel planner with deep local knowledge. Create a detailed, practical travel itinerary.

Destination: ${form.destination}
Duration: ${form.duration}
Group size: ${form.groupSize} people
Budget: ${form.budget}
Interests: ${interests}
${form.specialRequests ? `Special requests: ${form.specialRequests}` : ""}

Create a day-by-day itinerary. For each day include:
- Morning, afternoon, and evening activities
- Specific place names with brief descriptions
- Practical tips (best time to visit, what to wear, local transport)
- Approximate costs in INR
- Local food recommendations for meals

Also include at the end:
- Getting there (best transport options from major cities)
- Best time to visit this destination
- 3-4 must-pack items specific to this destination
- 2-3 things to avoid as a tourist

Format the response with clear Day 1, Day 2 etc. headers. Be specific with place names and prices. Write in a friendly, enthusiastic tone. Keep it practical and India-specific.`;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) return;

    // Extra confirmation to avoid accidental API calls
    const confirmed = window.confirm(
      `Generate a ${form.duration} itinerary for ${form.destination}? This will use your Gemini API quota.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setPlan("");
    setGenerated(false);

    try {
      // Calls your own backend — backend calls Gemini (no CORS issue)
      const response = await fetch(`${API_BASE}/api/ai/trip-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to generate plan");

      const text = data.text;

      setPlan(text);
      setGenerated(true);

      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plan).catch(() => {});
  };

  const parsePlan = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const sections = [];
    let current = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isDayHeader = /^(day\s*\d+|getting there|best time|must.pack|things to avoid)/i.test(trimmed);
      const isBoldHeader = trimmed.startsWith("**") && trimmed.endsWith("**");
      const isHashHeader = trimmed.startsWith("#");

      if (isDayHeader || isBoldHeader || isHashHeader) {
        if (current) sections.push(current);
        const title = trimmed.replace(/\*\*/g, "").replace(/^#+\s*/, "");
        const isDay = /^day\s*\d+/i.test(title);
        current = { title, lines: [], isDay };
      } else if (current) {
        current.lines.push(trimmed.replace(/\*\*/g, "").replace(/^[•\-]\s*/, "• "));
      } else {
        current = { title: "", lines: [trimmed.replace(/\*\*/g, "")], isDay: false };
      }
    }
    if (current && (current.title || current.lines.length > 0)) sections.push(current);
    return sections;
  };

  const sections = parsePlan(plan);

  return (
    <main className="atp-page">

      <div className="atp-hero">
        <div className="atp-hero-badge">✨ Powered by Gemini AI</div>
        <h1 className="atp-hero-title">Plan Your Perfect India Trip</h1>
        <p className="atp-hero-sub">
          Tell us where you're going and we'll build a personalised day-by-day itinerary — with real places, local food tips, and accurate costs.
        </p>
      </div>

      <section className="atp-form-card">
        <form onSubmit={handleGenerate} className="atp-form">

          <div className="atp-form-row">
            <label className="atp-label" style={{ flex: 2 }}>
              Where are you going?
              <input
                className="atp-input"
                type="text"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="e.g. Jaipur, Rajasthan or Coorg, Karnataka"
                required
              />
            </label>
            <label className="atp-label">
              How long?
              <select className="atp-input" value={form.duration} onChange={(e) => set("duration", e.target.value)}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="atp-label">
              Group size
              <input
                className="atp-input"
                type="number"
                value={form.groupSize}
                onChange={(e) => set("groupSize", e.target.value)}
                min={1} max={50}
              />
            </label>
          </div>

          <label className="atp-label">
            Budget
            <div className="atp-budget-grid">
              {BUDGETS.map((b) => (
                <button
                  key={b} type="button"
                  className={`atp-budget-btn ${form.budget === b ? "active" : ""}`}
                  onClick={() => set("budget", b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </label>

          <label className="atp-label">
            Interests <span className="atp-hint">— pick all that apply</span>
            <div className="atp-pill-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest} type="button"
                  className={`atp-pill ${form.interests.includes(interest) ? "active" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </label>

          <label className="atp-label">
            Anything special? <span className="atp-hint">— accessibility needs, celebrations, restrictions, etc.</span>
            <textarea
              className="atp-input"
              value={form.specialRequests}
              onChange={(e) => set("specialRequests", e.target.value)}
              placeholder="e.g. Travelling with elderly parents, vegetarian only, celebrating anniversary..."
              rows={2}
              style={{ resize: "vertical" }}
            />
          </label>

          {error && <p className="atp-error">{error}</p>}

          <button type="submit" className="atp-generate-btn" disabled={loading || !form.destination.trim()}>
            {loading ? (
              <span className="atp-btn-loading">
                <span className="atp-btn-spinner" />
                Building your itinerary...
              </span>
            ) : (
              "✨ Generate My Itinerary"
            )}
          </button>
        </form>
      </section>

      {loading && (
        <section className="atp-skeleton-section">
          <div className="atp-skeleton-header" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="atp-skeleton-card">
              <div className="atp-skeleton-title" />
              <div className="atp-skeleton-line" />
              <div className="atp-skeleton-line" style={{ width: "80%" }} />
              <div className="atp-skeleton-line" style={{ width: "65%" }} />
            </div>
          ))}
          <p className="atp-skeleton-note">Researching {form.destination}... this takes about 10 seconds ☕</p>
        </section>
      )}

      {generated && sections.length > 0 && (
        <section className="atp-plan" ref={planRef}>
          <div className="atp-plan-head">
            <div>
              <h2 className="atp-plan-title">Your {form.duration} itinerary for {form.destination}</h2>
              <p className="atp-plan-sub">{form.groupSize} people · {form.budget.split(" ")[0]} budget</p>
            </div>
            <div className="atp-plan-actions">
              <button className="atp-copy-btn" onClick={handleCopy}>
                📋 Copy
              </button>
              <button
                className="atp-regenerate-btn"
                onClick={() => { setPlan(""); setGenerated(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                ↺ Change details
              </button>
            </div>
          </div>

          <div className="atp-sections">
            {sections.map((section, i) => (
              <div key={i} className={`atp-section ${section.isDay ? "atp-section--day" : "atp-section--info"}`}>
                {section.title && (
                  <h3 className="atp-section-title">{section.title}</h3>
                )}
                <div className="atp-section-body">
                  {section.lines.map((line, j) => (
                    <p key={j} className={`atp-line ${line.startsWith("•") ? "atp-line--bullet" : ""}`}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="atp-plan-footer">
            <p>Want a guide for this trip?</p>
            <a href="/guides" className="atp-guides-link">Browse verified guides →</a>
          </div>
        </section>
      )}

      <style>{`
        .atp-page {
          width: min(900px, 92%);
          margin: 0 auto 4rem;
          display: grid;
          gap: 1.5rem;
        }
        .atp-hero {
          padding: 2.5rem 0 0.5rem;
          text-align: center;
        }
        .atp-hero-badge {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 700;
          color: #4338ca;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 999px;
          padding: 4px 14px;
          margin-bottom: 0.75rem;
        }
        .atp-hero-title {
          margin: 0 0 0.5rem;
          font-size: clamp(1.7rem, 4vw, 2.4rem);
          color: #0f172a;
          line-height: 1.2;
        }
        .atp-hero-sub {
          margin: 0 auto;
          font-size: 1rem;
          color: #475569;
          max-width: 60ch;
          line-height: 1.6;
        }
        .atp-form-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: clamp(1.2rem, 3vw, 2rem);
          box-shadow: 0 4px 16px rgba(15,23,42,0.06);
        }
        .atp-form { display: grid; gap: 1.1rem; }
        .atp-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.75rem; }
        .atp-label { display: grid; gap: 0.35rem; font-size: 0.86rem; font-weight: 600; color: #334155; }
        .atp-hint { font-weight: 400; color: #94a3b8; }
        .atp-input {
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 0.65rem 0.8rem; font-size: 0.9rem;
          font-family: inherit; color: #0f172a; background: #fff;
          transition: border-color 0.15s; width: 100%; box-sizing: border-box;
        }
        .atp-input:focus { outline: none; border-color: #a5b4fc; box-shadow: 0 0 0 3px rgba(165,180,252,0.2); }
        .atp-budget-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 4px; }
        .atp-budget-btn {
          padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0;
          border-radius: 9px; background: #fff; font-size: 0.78rem;
          font-weight: 600; color: #475569; cursor: pointer;
          transition: all 0.12s; font-family: inherit; text-align: left;
        }
        .atp-budget-btn.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
        .atp-pill-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .atp-pill {
          padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 999px;
          background: #fff; font-size: 0.775rem; font-weight: 500;
          color: #475569; cursor: pointer; transition: all 0.12s; font-family: inherit;
        }
        .atp-pill.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; font-weight: 600; }
        .atp-error {
          margin: 0; padding: 0.6rem 0.8rem;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; font-size: 0.84rem; color: #991b1b;
        }
        .atp-generate-btn {
          padding: 0.85rem 1.5rem; border: none; border-radius: 12px;
          font-size: 1rem; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          cursor: pointer; transition: opacity 0.15s; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .atp-generate-btn:hover:not(:disabled) { opacity: 0.9; }
        .atp-generate-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .atp-btn-loading { display: flex; align-items: center; gap: 10px; }
        .atp-btn-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: atp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes atp-spin { to { transform: rotate(360deg); } }
        .atp-skeleton-section { display: grid; gap: 12px; }
        .atp-skeleton-header {
          height: 28px; width: 60%; border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: atp-shimmer 1.4s infinite;
        }
        .atp-skeleton-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 1.2rem; display: grid; gap: 10px;
        }
        .atp-skeleton-title {
          height: 20px; width: 35%; border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: atp-shimmer 1.4s infinite;
        }
        .atp-skeleton-line {
          height: 14px; width: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: atp-shimmer 1.4s infinite;
        }
        @keyframes atp-shimmer { to { background-position: -200% 0; } }
        .atp-skeleton-note {
          text-align: center; font-size: 0.85rem; color: #94a3b8; margin: 0.5rem 0 0;
        }
        .atp-plan { display: grid; gap: 1rem; }
        .atp-plan-head {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px; flex-wrap: wrap;
          background: linear-gradient(135deg, #eef2ff, #f5f3ff);
          border: 1px solid #c7d2fe; border-radius: 16px;
          padding: 1.2rem 1.4rem;
        }
        .atp-plan-title { margin: 0 0 4px; font-size: 1.15rem; color: #0f172a; }
        .atp-plan-sub { margin: 0; font-size: 0.84rem; color: #4338ca; font-weight: 600; }
        .atp-plan-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .atp-copy-btn, .atp-regenerate-btn {
          padding: 0.45rem 0.9rem; border-radius: 8px;
          font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .atp-copy-btn { background: #fff; border: 1px solid #c7d2fe; color: #4338ca; }
        .atp-regenerate-btn { background: #fff; border: 1px solid #e2e8f0; color: #475569; }
        .atp-sections { display: grid; gap: 12px; }
        .atp-section {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 14px; overflow: hidden;
        }
        .atp-section--day { border-left: 4px solid #6366f1; }
        .atp-section--info { border-left: 4px solid #22c55e; }
        .atp-section-title {
          margin: 0; padding: 0.75rem 1.1rem;
          font-size: 0.95rem; font-weight: 700; color: #0f172a;
          background: #f8fafc; border-bottom: 1px solid #f1f5f9;
        }
        .atp-section--day .atp-section-title { color: #3730a3; background: #f5f3ff; border-color: #e0e7ff; }
        .atp-section-body { padding: 0.75rem 1.1rem; display: grid; gap: 5px; }
        .atp-line { margin: 0; font-size: 0.875rem; color: #334155; line-height: 1.6; }
        .atp-line--bullet { padding-left: 4px; }
        .atp-plan-footer {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 14px; padding: 1rem 1.4rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .atp-plan-footer p { margin: 0; font-size: 0.9rem; color: #15803d; font-weight: 600; }
        .atp-guides-link {
          text-decoration: none; font-size: 0.875rem; font-weight: 700;
          color: #15803d; border: 1px solid #86efac; background: #fff;
          border-radius: 8px; padding: 0.45rem 0.9rem;
        }
        .atp-guides-link:hover { background: #dcfce7; }
        @media (max-width: 640px) {
          .atp-form-row { grid-template-columns: 1fr; }
          .atp-budget-grid { grid-template-columns: 1fr; }
          .atp-plan-head { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}

export default AiTripPlanner;