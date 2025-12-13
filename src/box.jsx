import React from "react";


export default function Card({ places }) {
  const { title, location, rating, image, description } = places;


  return (
   
    <article className="card"  aria-label={title}>
     <img src={image} alt={title} className="card-image" loading="lazy"/>
    <h2 className="title">{title}</h2>
    
    <p className="location">{location}</p>
    <div className="rating">{rating}</div>
    <p className="description">{description}</p>
    
    </article>
  );
}
