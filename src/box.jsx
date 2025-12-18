import { Link } from "react-router-dom";
function Card({ place }) {
  return (
    <Link className="card-link" to={`./place/${place.id}`}>
    <div className="card has-overlay">
      <img
        src={place.image}
        alt={place.title}
        loading="lazy"
      />
      <h3 className="card-title">{place.title}</h3>
    </div>
    </Link>
    
  );
}

export default Card;
