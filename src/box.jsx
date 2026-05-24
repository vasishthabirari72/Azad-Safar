import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

function resolveImageSrc(image) {
  if (!image || typeof image !== "string") return null;
  const trimmed = image.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Local assets served from Vite base.
  return `${import.meta.env.BASE_URL}${trimmed.startsWith("/") ? trimmed.slice(1) : trimmed}`;
}

function Card({ place, disableLink }) {
  const initialSrc = useMemo(() => resolveImageSrc(place?.image), [place?.image]);
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [imgState, setImgState] = useState(initialSrc ? "loading" : "empty"); // loading | loaded | error | empty
  const imgRef = useRef(null);

  useEffect(() => {
    setImgSrc(initialSrc);
    setImgState(initialSrc ? "loading" : "empty");
  }, [initialSrc]);

  // Some browsers/routes can skip firing onLoad for cached images; detect "already loaded" manually.
  useEffect(() => {
    if (!imgSrc) return;
    const imgEl = imgRef.current;
    if (!imgEl) return;

    if (imgEl.complete) {
      if (imgEl.naturalWidth > 0) {
        setImgState("loaded");
      } else {
        setImgSrc(null);
        setImgState("error");
      }
    }
  }, [imgSrc]);

  const cardContent = (
    <div
      className={[
        "card",
        "has-overlay",
        imgState !== "loaded" ? "card--pending" : "",
        imgState === "empty" || imgState === "error" ? "card--no-image" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="card-media" aria-hidden="true">
        {imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setImgState("loaded")}
            onError={() => {
              setImgSrc(null);
              setImgState("error");
            }}
          />
        ) : null}

        {imgState === "loading" ? <div className="card-skeleton" /> : null}
        {imgState === "empty" || imgState === "error" ? (
          <div className="card-fallback">
            <div className="card-fallback-icon" />
            <div className="card-fallback-text">Photo coming soon</div>
          </div>
        ) : null}
      </div>

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
