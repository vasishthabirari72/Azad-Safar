import { useState, useEffect } from "react";
import Card from "./box.jsx";

function Body() {
  const [places, setPlaces] = useState([]);

  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllHighRated, setShowAllHighRated] = useState(false);
  const [showAllHidden, setShowAllHidden] = useState(false);

  // 🆕 Sorting states for each section
  const [recommendedSort, setRecommendedSort] = useState("default");
  const [highRatedSort, setHighRatedSort] = useState("default");
  const [hiddenSort, setHiddenSort] = useState("default");

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    fetch(`http://localhost:8000/api/places`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch places");
        return res.json();
      })
      .then(data => {
        setPlaces(data);
      })
      .catch(err => console.error("Error loading places:", err));
  }, []);

  /* ===== LOADING GUARD ===== */
  if (!places || places.length === 0) {
    return (
      <div style={{ 
        color: 'white', 
        textAlign: 'center', 
        padding: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div className="spinner"></div>
        <h2>Loading amazing destinations...</h2>
        <style>{`
          .spinner {
            border: 4px solid rgba(108, 99, 255, 0.1);
            border-top: 4px solid #6c63ff;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ===== FILTER DATA ===== */
  const recommended = places.filter(p => p.category?.includes("recommended"));
  const highRated = places.filter(p => p.category?.includes("high-rated"));
  const hiddenGems = places.filter(p => p.category?.includes("hidden-gem"));

  /* ===== 🆕 SORTING FUNCTION ===== */
  const sortPlaces = (placesArray, sortType) => {
    const sorted = [...placesArray];
    
    if (sortType === "rating-high") {
      return sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortType === "rating-low") {
      return sorted.sort((a, b) => a.rating - b.rating);
    } else if (sortType === "alphabetical") {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return sorted; // default order
  };

  /* ===== APPLY SORTING ===== */
  const sortedRecommended = sortPlaces(recommended, recommendedSort);
  const sortedHighRated = sortPlaces(highRated, highRatedSort);
  const sortedHidden = sortPlaces(hiddenGems, hiddenSort);

  /* ===== VISIBLE LOGIC ===== */
  const recommendedVisible = showAllRecommended
    ? sortedRecommended
    : sortedRecommended.slice(0, 4);

  const highRatedVisible = showAllHighRated
    ? sortedHighRated
    : sortedHighRated.slice(0, 4);

  const hiddenVisible = showAllHidden
    ? sortedHidden
    : sortedHidden.slice(0, 4);

  return (
    <section className="Body-section">
      {/* ===== RECOMMENDED ===== */}
      <section className="section recommended-section">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 className="section-title">Recommended for You</h2>
          
          {/* 🆕 Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ color: "white", fontSize: "0.9rem" }}>Sort:</label>
            <select
              value={recommendedSort}
              onChange={(e) => setRecommendedSort(e.target.value)}
              className="sort-dropdown"
              style={{
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid #6c63ff",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer"
              }}
            >
              <option value="default">Default</option>
              <option value="rating-high">⭐ Rating (High to Low)</option>
              <option value="rating-low">⭐ Rating (Low to High)</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="recommended-row">
          {recommendedVisible.map(place => (
            <Card key={place.id} place={place} />
          ))}
        </div>
        
        {recommended.length > 4 && (
          <div
            className="show-more-btn"
            onClick={() => setShowAllRecommended(!showAllRecommended)}
            role="button"
            tabIndex={0}
          >
            {showAllRecommended ? "Show Less" : "Show More"}
          </div>
        )}
      </section>

      {/* ===== HIGH RATED ===== */}
      <section className="section">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 className="section-title">High Rated Places</h2>
          
          {/* 🆕 Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ color: "white", fontSize: "0.9rem" }}>Sort:</label>
            <select
              value={highRatedSort}
              onChange={(e) => setHighRatedSort(e.target.value)}
              className="sort-dropdown"
              style={{
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid #6c63ff",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer"
              }}
            >
              <option value="default">Default</option>
              <option value="rating-high">⭐ Rating (High to Low)</option>
              <option value="rating-low">⭐ Rating (Low to High)</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="img-row">
          {highRatedVisible.map(place => (
            <Card key={place.id} place={place} />
          ))}
        </div>
        
        {highRated.length > 4 && (
          <div
            className="show-more-btn"
            onClick={() => setShowAllHighRated(!showAllHighRated)}
            role="button"
            tabIndex={0}
          >
            {showAllHighRated ? "Show Less" : "Show More"}
          </div>
        )}
      </section>

      {/* ===== HIDDEN GEMS ===== */}
      <section className="section">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 className="section-title">Hidden Gems</h2>
          
          {/* 🆕 Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ color: "white", fontSize: "0.9rem" }}>Sort:</label>
            <select
              value={hiddenSort}
              onChange={(e) => setHiddenSort(e.target.value)}
              className="sort-dropdown"
              style={{
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid #6c63ff",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer"
              }}
            >
              <option value="default">Default</option>
              <option value="rating-high">⭐ Rating (High to Low)</option>
              <option value="rating-low">⭐ Rating (Low to High)</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="img-row">
          {hiddenVisible.map(place => (
            <Card key={place.id} place={place} />
          ))}
        </div>
        
        {hiddenGems.length > 4 && (
          <div
            className="show-more-btn"
            onClick={() => setShowAllHidden(!showAllHidden)}
            role="button"
            tabIndex={0}
          >
            {showAllHidden ? "Show Less" : "Show More"}
          </div>
        )}
      </section>

      <style>{`
        .sort-dropdown option {
          background-color: #1a1a2e;
          color: white;
        }

        .sort-dropdown:hover {
          border-color: #8b7fff;
          background-color: rgba(255,255,255,0.15);
        }

        .sort-dropdown:focus {
          outline: none;
          border-color: #8b7fff;
          box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
        }
      `}</style>
    </section>
  );
}

export default Body;