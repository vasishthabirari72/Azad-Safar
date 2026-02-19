import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import PlaceMap from "./placeMap";

const API = "http://localhost:8000/api/places";

function PlaceDetails() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [showAllNearBy, setShowAllNearBy] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 5,
    comment: "",
  });
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [helpfulLoadingId, setHelpfulLoadingId] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setIsLoadingReviews(true);
      const response = await fetch(
        `${API}/${id}/reviews?sort=${encodeURIComponent(reviewSort)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [id, reviewSort]);

  useEffect(() => {
    fetch(`${API}/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load place");
        }
        return res.json();
      })
      .then((data) => {
        setPlace(data);
      })
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (!place) {
    return <h2 className="place-loading">Loading place details...</h2>;
  }

  const categoryNames = {
    "high-rated": "High Rated",
    recommended: "Recommended",
    "hidden-gem": "Hidden Gem",
  };

  const categories = Array.isArray(place.category) ? place.category : [];
  const cityState = [place.city, place.state].filter(Boolean).join(", ");
  const heroImage = `${import.meta.env.BASE_URL}${place.image2 || place.image}`;
  const nearbyPlaces = Array.isArray(place.nearbyPlaces) ? place.nearbyPlaces : [];
  const nearbyTypes = [...new Set(nearbyPlaces.map((item) => item.type).filter(Boolean))];

  const averageReviewRating = reviews.length
    ? (
        reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : null;

  const nearbyVisible = showAllNearBy ? nearbyPlaces : nearbyPlaces.slice(0, 3);

  const handleReviewChange = (field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");

    if (reviewForm.name.trim().length < 2) {
      setReviewError("Name must be at least 2 characters.");
      return;
    }

    if (reviewForm.comment.trim().length < 5) {
      setReviewError("Comment must be at least 5 characters.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const response = await fetch(`${API}/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reviewForm.name.trim(),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      await loadReviews();
      setReviewForm({
        name: "",
        rating: 5,
        comment: "",
      });
    } catch (error) {
      setReviewError("Could not submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      setHelpfulLoadingId(reviewId);
      const response = await fetch(`${API}/${id}/reviews/${reviewId}/helpful`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark helpful");
      }

      await loadReviews();
    } catch (error) {
      console.error(error);
    } finally {
      setHelpfulLoadingId("");
    }
  };

  return (
    <section className="place-details-page">
      <div className="place-hero-banner">
        <img src={heroImage} alt={place.title} />
        <div className="place-hero-overlay">
          <div className="place-hero-kicker">Destination Guide</div>
          <h1>{place.title}</h1>
          <p>{cityState}</p>
        </div>
      </div>

      <div className="place-main-grid">
        <article className="place-overview-card">
          <div className="place-meta-row">
            <span className="place-rating-badge">Rating {place.rating}/5</span>
            <span className="place-dot">|</span>
            <span className="place-city-state">{cityState}</span>
          </div>

          <div className="place-category-row">
            {categories.map((cat) => (
              <span className="place-category-pill" key={cat}>
                {categoryNames[cat] || cat}
              </span>
            ))}
          </div>

          <h2>About {place.title}</h2>
          <p className="place-description">{place.description}</p>

          <div className="place-facts-grid">
            <div className="place-fact-item">
              <h3>State</h3>
              <p>{place.state}</p>
            </div>
            <div className="place-fact-item">
              <h3>City</h3>
              <p>{place.city}</p>
            </div>
            <div className="place-fact-item">
              <h3>Nearby Spots</h3>
              <p>{nearbyPlaces.length}</p>
            </div>
            <div className="place-fact-item">
              <h3>Trip Theme</h3>
              <p>{nearbyTypes.slice(0, 3).join(", ") || "Culture & Sightseeing"}</p>
            </div>
          </div>
        </article>

        <aside className="place-plan-card">
          <h3>Travel Snapshot</h3>
          <p>
            Ideal for travelers looking for a balanced mix of local culture,
            iconic spots, and short nearby excursions.
          </p>
          <div className="place-plan-points">
            <div>Best base: {place.city}</div>
            <div>Nearby categories: {nearbyTypes.slice(0, 2).join(", ") || "Mixed"}</div>
            <div>Recommended duration: 2-3 days</div>
            <div>
              Visitor reviews: {reviews.length}
              {averageReviewRating ? ` (${averageReviewRating}/5)` : ""}
            </div>
          </div>
          <Link to="/explore" className="place-secondary-btn">
            Explore more destinations
          </Link>
        </aside>
      </div>

      <section className="nearby-places-panel">
        <div className="nearby-header">
          <h2>Nearby Places To Visit</h2>
          {nearbyPlaces.length > 3 && (
            <button
              className="nearby-toggle-btn"
              onClick={() => setShowAllNearBy(!showAllNearBy)}
            >
              {showAllNearBy ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        <div className="nearby-place-grid">
          {nearbyVisible.map((near) => (
            <article className="nearby-place-card" key={near.id}>
              <img
                src={`${import.meta.env.BASE_URL}${near.image}`}
                alt={near.title}
              />
              <div className="nearby-place-content">
                <h3>{near.title}</h3>
                <p>{near.description}</p>
                <div className="nearby-place-meta">
                  <span>{near.type}</span>
                  <span>{near.distance}</span>
                  <span>{near.travelTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="place-review-panel">
        <div className="review-header">
          <h2>Traveler Reviews</h2>
          <div className="review-header-right">
            <p>
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
              {averageReviewRating ? ` | Avg ${averageReviewRating}/5` : ""}
            </p>
            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value)}
              aria-label="Sort reviews"
            >
              <option value="newest">Newest</option>
              <option value="highest-rated">Highest Rated</option>
            </select>
          </div>
        </div>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={reviewForm.name}
            onChange={(e) => handleReviewChange("name", e.target.value)}
            maxLength={40}
            required
          />

          <div className="review-star-input" role="radiogroup" aria-label="Review rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= Number(reviewForm.rating) ? "active" : ""}`}
                onClick={() => handleReviewChange("rating", star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                {"\u2605"}
              </button>
            ))}
            <span className="star-value">{Number(reviewForm.rating)}/5</span>
          </div>

          <textarea
            placeholder="Share your experience..."
            value={reviewForm.comment}
            onChange={(e) => handleReviewChange("comment", e.target.value)}
            rows={4}
            maxLength={500}
            required
          />

          {reviewError && <p className="review-error">{reviewError}</p>}

          <button type="submit" disabled={isSubmittingReview}>
            {isSubmittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        <div className="review-list">
          {isLoadingReviews && <p className="review-empty">Loading reviews...</p>}
          {!isLoadingReviews && reviews.length === 0 && (
            <p className="review-empty">No reviews yet. Be the first to add one.</p>
          )}

          {reviews.map((review) => (
            <article className="review-card" key={review._id || `${review.name}-${review.createdAt}`}>
              <div className="review-card-top">
                <h3>{review.name}</h3>
                <span>{Number(review.rating).toFixed(1)}/5</span>
              </div>
              <p>{review.comment}</p>
              <div className="review-actions">
                <time>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : "Recently"}
                </time>
                <button
                  type="button"
                  className="helpful-btn"
                  onClick={() => handleHelpfulVote(review._id)}
                  disabled={helpfulLoadingId === review._id}
                >
                  {helpfulLoadingId === review._id
                    ? "Saving..."
                    : `Helpful (${review.helpfulCount || 0})`}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PlaceMap place={place} />

      <div className="place-actions-row">
        <Link to="/explore" className="place-outline-btn">
          Back to explore
        </Link>
        <Link to="/" className="back-btn">
          Back home
        </Link>
      </div>
    </section>
  );
}

export default PlaceDetails;
