import { Link } from "react-router-dom";
function Card({ place }) {
  return (
    <Link className="card-link" to={`./place/${place.id}`}>
    <div className="card has-overlay">
      
        <img
  src={`${import.meta.env.BASE_URL}${place.image}`}
  alt={place.title}


      />
      <h3 className="card-title">{place.title}</h3>
    </div>
    </Link>
    
  );
}

export default Card;
