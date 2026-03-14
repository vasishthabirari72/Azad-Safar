import { useEffect, useState } from "react";
import Card from "./box";

const API = "http://localhost:8000/api/places";

function Explore() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  /* FETCH STATES */
  useEffect(() => {
    fetch(`${API}/states-with-images`)
      .then((res) => res.json())
      .then((data) => {
        setStates(data);
        setLoadingStates(false);
      })
      .catch((err) => {
        console.error("States error:", err);
        setLoadingStates(false);
      });
  }, []);

  /* FETCH CITIES
     FIX: setLoadingCities(true) moved here instead of only in the click handler,
     so the spinner shows even if selectedState changes from outside a click (e.g. browser back) */
  useEffect(() => {
    if (!selectedState) return;

    setLoadingCities(true);

    fetch(`${API}/cities-with-images?state=${encodeURIComponent(selectedState)}`)
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        setPlaces([]);
        setSelectedCity("");
        setLoadingCities(false);
      })
      .catch((err) => {
        console.error("Cities error:", err);
        setLoadingCities(false);
      });
  }, [selectedState]);

  /* FETCH PLACES */
  useEffect(() => {
    if (!selectedCity) return;

    setLoadingPlaces(true);

    fetch(`${API}/by-city?city=${encodeURIComponent(selectedCity)}`)
      .then((res) => res.json())
      .then((data) => {
        setPlaces(data);
        setLoadingPlaces(false);
      })
      .catch((err) => {
        console.error("Places error:", err);
        setLoadingPlaces(false);
      });
  }, [selectedCity]);

  /* NAVIGATION HANDLERS */
  const handleBackToStates = () => {
    setSelectedState("");
    setSelectedCity("");
    setCities([]);
    setPlaces([]);
    setLoadingCities(false);
    setLoadingPlaces(false);
  };

  const handleBackToCities = () => {
    setSelectedCity("");
    setPlaces([]);
    setLoadingPlaces(false);
  };

  // FIX: removed setLoadingCities(true) from here since useEffect now handles it
  const handleStateSelect = (stateName) => {
    setSelectedState(stateName);
  };

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
  };

  return (
    <section className="explore-section" style={{ padding: "2rem" }}>
      <h1 className="section-title">Explore India</h1>

      {/* STATE CARDS */}
      {!selectedState && (
        <>
          <h2 style={{ color: "white", marginBottom: "1.5rem" }}>Select a State</h2>

          {loadingStates ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner"></div>
              <p style={{ color: "white", marginTop: "1rem" }}>Loading states...</p>
            </div>
          ) : (
            <div className="img-row explore-grid">
              {states.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleStateSelect(item.state)}
                  className="explore-card"
                  style={{ cursor: "pointer" }}
                >
                  <Card
                    place={{ title: item.state, image: item.image }}
                    disableLink={true}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CITY CARDS */}
      {selectedState && !selectedCity && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={handleBackToStates}
              className="back-btn-explore"
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: "#6c63ff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              ← Back to States
            </button>
            <h2 style={{ color: "white", margin: 0 }}>{selectedState}</h2>
          </div>

          <h3 style={{ color: "white", marginBottom: "1.5rem" }}>Select a City</h3>

          {loadingCities ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner"></div>
              <p style={{ color: "white", marginTop: "1rem" }}>Loading cities...</p>
            </div>
          ) : (
            <div className="img-row explore-grid">
              {cities.map((cityItem, index) => (
                <div
                  key={index}
                  onClick={() => handleCitySelect(cityItem.city)}
                  className="explore-card"
                  style={{ cursor: "pointer" }}
                >
                  <Card
                    place={{ title: cityItem.city, image: cityItem.image }}
                    disableLink={true}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* PLACES GRID */}
      {selectedCity && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={handleBackToCities}
              className="back-btn-explore"
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: "#6c63ff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              ← Back to Cities
            </button>
            <h2 style={{ color: "white", margin: 0 }}>
              Places in {selectedCity}, {selectedState}
            </h2>
          </div>

          {loadingPlaces ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner"></div>
              <p style={{ color: "white", marginTop: "1rem" }}>Loading places...</p>
            </div>
          ) : places.length === 0 ? (
            <p style={{ color: "white" }}>No places found for {selectedCity}.</p>
          ) : (
            <div className="img-row">
              {places.map((place) => (
                <Card key={place.id} place={place} />
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .spinner {
          border: 4px solid rgba(108, 99, 255, 0.1);
          border-top: 4px solid #6c63ff;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .explore-grid {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .explore-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .explore-card:hover {
          transform: translateY(-5px);
        }
        .back-btn-explore:hover {
          background-color: #5848e6 !important;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .back-btn-explore:active {
          transform: scale(0.98);
        }
      `}</style>
    </section>
  );
}

export default Explore;