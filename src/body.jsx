import { useState, useEffect } from "react";
import Card from "./box.jsx";

function Body() {
  const [places, setPlaces] = useState([]);

  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllHighRated, setShowAllHighRated] = useState(false);
  const [showAllHidden, setShowAllHidden] = useState(false);

  /* ===== FETCH DATA (GITHUB PAGES SAFE) ===== */
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}places.json`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load places.json");
        return res.json();
      })
      .then(data => {
        setPlaces(data.places);
      })
      .catch(err => console.error("Error loading places:", err));
  }, []);

  /* ===== FILTER DATA ===== */
  const recommended = places.filter(p =>
    p.category?.includes("recommended")
  );

  const highRated = places.filter(p =>
    p.category?.includes("high-rated")
  );

  const hiddenGems = places.filter(p =>
    p.category?.includes("hidden-gem")
  );

  /* ===== VISIBLE LOGIC ===== */
  const recommendedVisible = showAllRecommended
    ? recommended
    : recommended.slice(0, 4);

  const highRatedVisible = showAllHighRated
    ? highRated
    : highRated.slice(0, 4);

  const hiddenVisible = showAllHidden
    ? hiddenGems
    : hiddenGems.slice(0, 4);

  return (
    <section className="Body-section">

      {/* ===== RECOMMENDED ===== */}
      <section className="section recommended-section">
        <h2 className="section-title">Recommended for You</h2>

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
        <h2 className="section-title">High Rated Places</h2>

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
        <h2 className="section-title">Hidden Gems</h2>

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

    </section>
  );
}

export default Body;
