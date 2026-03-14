import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api/places";

function HeroSection() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const latestQueryRef = useRef("");   // FIX: prevent stale responses overwriting newer ones
  const wrapperRef = useRef(null);     // FIX: close dropdown on outside click

  // FIX: close dropdown when user clicks anywhere outside the search bar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    latestQueryRef.current = query;

    fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        // FIX: discard result if a newer query has since been typed
        if (latestQueryRef.current !== query) return;
        const results = Array.isArray(data) ? data.slice(0, 5) : [];
        setSuggestions(results);
        // FIX: only open dropdown if there are actual results
        setShowSuggestions(results.length > 0);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [query]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="Hero">
      <h1>Azaad Safar</h1>
      <h3>Be Azaad with Azad Safar</h3>

      <div className="search-wrapper" style={{ position: "relative" }} ref={wrapperRef}>
        <input
          className="search-input"
          type="text"
          placeholder="Search cities, states, or destinations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          // FIX: only re-show dropdown on focus if we already have results
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />

        <button className="search-btn" onClick={handleSearch}>
          🔍
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-box">
            {suggestions.map((place) => (
              <div
                key={place.id}
                className="autocomplete-item"
                // FIX: prevent input blur stealing focus before click fires
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowSuggestions(false);
                  navigate(`/place/${place.id}`);
                }}
              >
                <strong>{place.title}</strong>
                <span> — {place.city}, {place.state}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroSection;