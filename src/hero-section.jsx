import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api/places";

function HeroSection() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();

  /* 🔍 Fetch autocomplete suggestions */
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.slice(0, 5)); // top 5 only
        setShowSuggestions(true);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [query]);

  /* 🔎 Full search */
  const handleSearch = () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    navigate(`/search?q=${query}`);
  };

  return (
    <section className="Hero">
      <h1>Azaad Safar</h1>
      <h3>Be Azaad with Azad Safar</h3>

      <div className="search-wrapper" style={{ position: "relative" }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search cities, states, or destinations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => query && setShowSuggestions(true)}
        />

        <button className="search-btn" onClick={handleSearch}>
          🔍
        </button>

        {/* 🔽 AUTOCOMPLETE DROPDOWN */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-box">
            {suggestions.map((place) => (
              <div
                key={place.id}
                className="autocomplete-item"
                onClick={() => navigate(`/place/${place.id}`)}
              >
                <strong>{place.title}</strong>
                <span>
                  {" "}
                  — {place.city}, {place.state}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
