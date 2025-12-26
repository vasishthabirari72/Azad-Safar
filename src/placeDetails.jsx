import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "./box";
import PlaceMap from "./placeMap";
function PlaceDetails() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [showAllNearBy,setShowAllNearBy]=useState(false);

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
const nearbyVisible = place.nearbyPlaces
  ? showAllNearBy
    ? place.nearbyPlaces
    : place.nearbyPlaces.slice(0, 3)
  : [];



  return (
    <section className="place-details">
  <div className="place-hero">
    <img src={place.image2} alt={place.title} />
  </div>

  <div className="place-content">
    <h1>{place.title}</h1>
    <p className="place-location">{place.location}</p>
    <p className="place-description">{place.description}</p>
  </div>
  <div className="nearby-places">
    <h1>Places to visit near the city</h1>
    <div className="nearby">
     {nearbyVisible.map(near=>(
      <Card key={near.id} place={near}></Card>
     ))}

    </div>
    
      {place.nearbyPlaces.length>3 && (
        <div className="show-more-btn" onClick={()=>setShowAllNearBy(!showAllNearBy)}
        role="button">
          {showAllNearBy?"see less":"see more"}
       
     </div> )}

     <PlaceMap place={place} />
    <Link to="/" className="back-btn">home</Link>
  
   
  </div>
  
   
  
</section>
  );
}

export default PlaceDetails;
