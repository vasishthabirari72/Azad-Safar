export default function PlaceMap({ place }) {
  return (
    <section className="map-section">
      <h2 className="map-title">📍 Location</h2>

      <iframe
        src={`https://www.google.com/maps?q=${encodeURIComponent(
          place.title + ", " + place.location
        )}&output=embed`}
        width="100%"
        height="400"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        title="Google Map"
      ></iframe>
    </section>
  );
}
