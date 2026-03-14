import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "./box";

const API = "http://localhost:8000/api/places";

function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [minRating, setMinRating] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    setError("");
    setResults([]);

    let url = `${API}/search?q=${encodeURIComponent(query)}`;
    if (minRating) url += `&rating=${minRating}`;
    if (selectedCategory) url += `&category=${selectedCategory}`;
    if (sortBy) url += `&sort=${sortBy}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => setResults(data))
      .catch((err) => {
        setError("Something went wrong while searching.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [query, minRating, selectedCategory, sortBy]);

  const handleClearSearch = () => navigate("/");
  const handleClearFilters = () => {
    setMinRating("");
    setSelectedCategory("");
    setSortBy("");
  };

  // FIX: highlight is applied via a wrapper div outside Card, NOT by mutating place.title.
  // Previously passing a React element as place.title broke Card's img alt attribute ("[object Object]").
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || typeof text !== "string") return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: "#ffeb3b", padding: "0 2px", borderRadius: "2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <section className="search-section" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1>
          Search results for <span style={{ color: "#6c63ff" }}>"{query}"</span>
        </h1>
        <button
          onClick={handleClearSearch}
          className="clear-search-btn"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#6c63ff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ✕ Clear Search
        </button>
      </div>

      {/* Filters */}
      <div
        className="search-filters"
        style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}
      >
        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Min Rating:</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="">All Ratings</option>
            <option value="4">4+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="">All Categories</option>
            <option value="high-rated">High Rated</option>
            <option value="recommended">Recommended</option>
            <option value="hidden-gem">Hidden Gems</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "5px", border: "1px solid #ddd" }}
          >
            <option value="">Default</option>
            <option value="rating-high">⭐ Rating (High to Low)</option>
            <option value="rating-low">⭐ Rating (Low to High)</option>
            <option value="alphabetical">🔤 Alphabetical</option>
          </select>
        </div>

        {(minRating || selectedCategory || sortBy) && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            className="spinner"
            style={{
              border: "4px solid rgba(108, 99, 255, 0.1)",
              borderTop: "4px solid #6c63ff",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <p style={{ color: "white", marginTop: "1rem" }}>🔍 Searching places...</p>
        </div>
      )}

      {!loading && error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && results.length === 0 && query && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "white",
          }}
        >
          <h2>😕 No places found for "{query}"</h2>
          <p>Try adjusting your filters or search for something else</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p style={{ color: "white", marginBottom: "1rem" }}>
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="img-row">
            {results.map((place) => (
              // FIX: pass the original place object to Card (preserves string title for alt attr).
              // Highlight is rendered in a separate overlay div below the card.
              <div key={place.id} style={{ position: "relative" }}>
                <Card place={place} />
                {query && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "44px",
                      left: "14px",
                      zIndex: 3,
                      background: "rgba(0,0,0,0.55)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}
                  >
                    {highlightText(place.title, query)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .clear-search-btn:hover {
          background-color: #5848e6 !important;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        mark {
          font-weight: bold;
        }
      `}</style>
    </section>
  );
}

export default Search;