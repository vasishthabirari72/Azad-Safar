import { Link } from "react-router-dom";

function Card({ place, disableLink }) {
  const cardContent = (
    <div className="card has-overlay">
      <img
        src={`${import.meta.env.BASE_URL}${place.image}`}
        alt={place.title}
      />
      <h3 className="card-title">{place.title}</h3>
    </div>
  );

  // 🔴 If navigation is disabled (STATE cards)
  if (disableLink) {
    return cardContent;
  }

  // 🟢 Normal PLACE cards → navigate to details page
  return (
    <Link className="card-link" to={`/place/${place.id}`}>
      {cardContent}
    </Link>
  );
}

export default Card;
