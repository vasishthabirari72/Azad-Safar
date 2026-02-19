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

  // 🆕 Filter and Sort States
  const [minRating, setMinRating] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    setError("");
    setResults([]);

    // 🆕 Build query with filters
    let url = `${API}/search?q=${encodeURIComponent(query)}`;
    
    if (minRating) {
      url += `&rating=${minRating}`;
    }
    
    if (selectedCategory) {
      url += `&category=${selectedCategory}`;
    }
    
    if (sortBy) {
      url += `&sort=${sortBy}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        setResults(data);
      })
      .catch((err) => {
        setError("Something went wrong while searching.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query, minRating, selectedCategory, sortBy]);

  // 🆕 Clear search function
  const handleClearSearch = () => {
    navigate("/");
  };

  // 🆕 Clear filters function
  const handleClearFilters = () => {
    setMinRating("");
    setSelectedCategory("");
    setSortBy("");
  };

  // 🆕 Highlight matched text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: "#ffeb3b", padding: "0 2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <section className="search-section" style={{ padding: "2rem" }}>
      {/* Header with Clear Button */}
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
            cursor: "pointer"
          }}
        >
          ✕ Clear Search
        </button>
      </div>

      {/* 🆕 Filters and Sort Section */}
      <div className="search-filters" style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        {/* Rating Filter */}
        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Min Rating:</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ddd"
            }}
          >
            <option value="">All Ratings</option>
            <option value="4">4+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ddd"
            }}
          >
            <option value="">All Categories</option>
            <option value="high-rated">High Rated</option>
            <option value="recommended">Recommended</option>
            <option value="hidden-gem">Hidden Gems</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{ marginRight: "0.5rem", color: "white" }}>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ddd"
            }}
          >
            <option value="">Default</option>
            <option value="rating-high">⭐ Rating (High to Low)</option>
            <option value="rating-low">⭐ Rating (Low to High)</option>
            <option value="alphabetical">🔤 Alphabetical</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(minRating || selectedCategory || sortBy) && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 🔄 Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="spinner" style={{
            border: "4px solid rgba(108, 99, 255, 0.1)",
            borderTop: "4px solid #6c63ff",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}></div>
          <p style={{ color: "white", marginTop: "1rem" }}>🔍 Searching places...</p>
        </div>
      )}

      {/* ❌ Error */}
      {!loading && error && <p style={{ color: "red" }}>{error}</p>}

      {/* 😶 Empty State */}
      {!loading && !error && results.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "10px",
          color: "white"
        }}>
          <h2>😕 No places found for "{query}"</h2>
          <p>Try adjusting your filters or search for something else</p>
        </div>
      )}

      {/* ✅ Results with Highlighted Text */}
      {!loading && !error && results.length > 0 && (
        <>
          <p style={{ color: "white", marginBottom: "1rem" }}>
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <div className="img-row">
            {results.map((place) => (
              <div key={place.id}>
                <Card 
                  place={{
                    ...place,
                    title: highlightText(place.title, query)
                  }} 
                />
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