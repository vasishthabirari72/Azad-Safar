function Card({ place }) {
  return (
    <div className="card has-overlay">
      <img
        src={place.image}
        alt={place.title}
        loading="lazy"
      />
      <h3 className="card-title">{place.title}</h3>
    </div>
  );
}

export default Card;
