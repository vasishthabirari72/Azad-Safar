import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:8000/api/guides";

function Guides() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [language, setLanguage] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        if (state) params.set("state", state);
        if (language) params.set("language", language);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (minRating) params.set("minRating", minRating);

        const res = await fetch(`${API}?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load guides");
        const data = await res.json();
        setGuides(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [city, state, language, maxPrice, minRating]);

  const clearFilters = () => {
    setCity("");
    setState("");
    setLanguage("");
    setMaxPrice("");
    setMinRating("");
  };

  const hasFilters = city || state || language || maxPrice || minRating;

  return (
    <main className="guides-page">
      <div className="guides-hero">
        <h1>Find a Tourist Guide</h1>
        <p>Browse verified local experts across India. Filter by city, language, or budget.</p>
      </div>

      {/* Filters */}
      <section className="guides-filters">
        <div className="guides-filter-row">
          <input
            className="guides-filter-input"
            type="text"
            placeholder="City (e.g. Jaipur)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="guides-filter-input"
            type="text"
            placeholder="State (e.g. Rajasthan)"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <input
            className="guides-filter-input"
            type="text"
            placeholder="Language (e.g. Hindi)"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <select
            className="guides-filter-input"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any rating</option>
            <option value="4">4+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
            <option value="4.8">4.8+ ⭐</option>
          </select>
          <select
            className="guides-filter-input"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            <option value="">Any price</option>
            <option value="3000">Under ₹3,000</option>
            <option value="5000">Under ₹5,000</option>
            <option value="8000">Under ₹8,000</option>
          </select>
          {hasFilters && (
            <button className="guides-clear-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="guides-results">
        {loading && (
          <div className="guides-loading">
            <div className="guides-spinner" />
            <p>Finding guides...</p>
          </div>
        )}

        {!loading && error && (
          <div className="guides-empty">
            <p>😕 {error}</p>
          </div>
        )}

        {!loading && !error && guides.length === 0 && (
          <div className="guides-empty">
            <p>No guides found{hasFilters ? " for these filters" : ""}.</p>
            {hasFilters && (
              <button className="guides-clear-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && guides.length > 0 && (
          <>
            <p className="guides-count">
              {guides.length} guide{guides.length !== 1 ? "s" : ""} available
            </p>
            <div className="guides-grid">
              {guides.map((guide) => (
                <GuideCard
                  key={guide._id}
                  guide={guide}
                  onClick={() => navigate(`/guide/${guide._id}`)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <style>{`
        .guides-page {
          width: min(1200px, 92%);
          margin: 0 auto 3rem;
        }
        .guides-hero {
          padding: 2.5rem 0 1.5rem;
          text-align: center;
        }
        .guides-hero h1 {
          margin: 0 0 0.5rem;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: #0f172a;
        }
        .guides-hero p {
          margin: 0;
          font-size: 1rem;
          color: #64748b;
        }
        .guides-filters {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1rem 1.2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(15,23,42,0.05);
        }
        .guides-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .guides-filter-input {
          flex: 1 1 160px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          font-size: 0.875rem;
          color: #0f172a;
          background: #f8fafc;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .guides-filter-input:focus {
          outline: none;
          border-color: #a5b4fc;
        }
        .guides-clear-btn {
          padding: 0.6rem 1rem;
          border: 1px solid #fca5a5;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .guides-results {
          min-height: 200px;
        }
        .guides-loading {
          text-align: center;
          padding: 3rem;
          color: #64748b;
        }
        .guides-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .guides-empty {
          text-align: center;
          padding: 3rem;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 14px;
          color: #64748b;
        }
        .guides-count {
          margin: 0 0 1.2rem;
          font-size: 0.875rem;
          color: #64748b;
        }
        .guides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        /* Guide card styles */
        .gpage-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.2rem;
          cursor: pointer;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
          display: grid;
          gap: 12px;
        }
        .gpage-card:hover {
          border-color: #c7d2fe;
          box-shadow: 0 8px 24px rgba(15,23,42,0.1);
          transform: translateY(-3px);
        }
        .gpage-card-top {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .gpage-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .gpage-avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e0e7ff;
        }
        .gpage-verified {
          position: absolute;
          bottom: 0;
          right: -2px;
          width: 20px;
          height: 20px;
          background: #22c55e;
          color: #fff;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          font-weight: 700;
        }
        .gpage-info {
          flex: 1;
          min-width: 0;
        }
        .gpage-name {
          margin: 0 0 2px;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .gpage-exp {
          margin: 0 0 6px;
          font-size: 0.8rem;
          color: #64748b;
        }
        .gpage-rating {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 2px 8px;
          font-size: 0.8rem;
        }
        .gpage-star { color: #f59e0b; }
        .gpage-rating-num { font-weight: 700; color: #78350f; }
        .gpage-reviews-count { color: #92400e; }
        .gpage-desc {
          margin: 0;
          font-size: 0.845rem;
          color: #475569;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gpage-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }
        .gpage-langs {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .gpage-lang {
          font-size: 0.72rem;
          font-weight: 600;
          color: #4338ca;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 6px;
          padding: 2px 7px;
        }
        .gpage-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: #4f46e5;
          white-space: nowrap;
        }
        .gpage-price-unit {
          font-size: 0.72rem;
          font-weight: 400;
          color: #94a3b8;
        }
        .gpage-cities {
          font-size: 0.775rem;
          color: #64748b;
        }
        @media (max-width: 600px) {
          .guides-grid { grid-template-columns: 1fr; }
          .guides-filter-row { flex-direction: column; }
          .guides-filter-input { flex: 1 1 100%; }
        }
      `}</style>
    </main>
  );
}

function GuideCard({ guide, onClick }) {
  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  return (
    <article className="gpage-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div className="gpage-card-top">
        <div className="gpage-avatar-wrap">
          {guide.photo ? (
            <img src={guide.photo} alt={guide.userId?.name} className="gpage-avatar" loading="lazy" />
          ) : (
            <div className="gpage-avatar" style={{ background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
              🧭
            </div>
          )}
          <span className="gpage-verified">✓</span>
        </div>
        <div className="gpage-info">
          <h3 className="gpage-name">{guide.userId?.name || "Guide"}</h3>
          <p className="gpage-exp">{guide.experienceYears}+ years experience</p>
          <div className="gpage-rating">
            <span className="gpage-star">★</span>
            <span className="gpage-rating-num">{guide.rating || "New"}</span>
            {guide.reviewsCount > 0 && (
              <span className="gpage-reviews-count">({guide.reviewsCount})</span>
            )}
          </div>
        </div>
      </div>

      {guide.bio && <p className="gpage-desc">{guide.bio}</p>}

      {guide.cities?.length > 0 && (
        <p className="gpage-cities">📍 {guide.cities.slice(0, 3).join(", ")}{guide.cities.length > 3 ? ` +${guide.cities.length - 3} more` : ""}</p>
      )}

      <div className="gpage-footer">
        <div className="gpage-langs">
          {(guide.languages || []).slice(0, 3).map((lang) => (
            <span key={lang} className="gpage-lang">{lang}</span>
          ))}
        </div>
        <span className="gpage-price">
          {formatCurrency(guide.pricePerDay)}<span className="gpage-price-unit">/day</span>
        </span>
      </div>
    </article>
  );
}

export default Guides;