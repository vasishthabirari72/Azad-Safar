import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
function PlaceDetails() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);

  useEffect(() => {
    fetch("/places.json")
      .then(res => res.json())
      .then(data => {
        const foundPlace = data.places.find(
          p => p.id === Number(id)
        );
        setPlace(foundPlace);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!place) {
    return <h2>Loading or Place not found...</h2>;
  }

  return (
    <div className="place-details">
  <div className="place-hero">
    <img src={place.image} alt={place.title} />
  </div>

  <div className="place-content">
    <h1>{place.title}</h1>
    <p className="place-location">{place.location}</p>
    <p className="place-description">{place.description}</p>

   <Link to="/">home</Link>
  </div>
</div>
  );
}

export default PlaceDetails;
