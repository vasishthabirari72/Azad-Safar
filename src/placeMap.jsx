export default function PlaceMap({ place }) {
  if (!place) {
    return null;
  }

  const mapQuery = [place.title, place.city, place.state]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="map-section place-map">
      <div className="map-heading">
        <h2 className="map-title">Location</h2>
        <p className="map-subtitle">Explore the exact area around {place.title}.</p>
      </div>

      <iframe
        src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
        width="100%"
        height="420"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        title="Google Map"
      ></iframe>
    </section>
  );
}
