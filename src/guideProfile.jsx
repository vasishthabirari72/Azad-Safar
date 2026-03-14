import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API = "http://localhost:8000/api/guides";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
const LOCAL_SESSION_KEY = "travel_partner_session_v1";

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

function GuideProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking
  const [bookingDate, setBookingDate] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Review
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Guide not found");
        return res.json();
      })
      .then((data) => setGuide(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load chat history when chat opens
  useEffect(() => {
    if (!chatOpen || !session?.id) return;

    fetch(`${API}/${id}/messages?travelerId=${session.id}`)
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join-guide-chat", { guideId: id, travelerId: session.id });

    socket.on("guide-message", (msg) => {
      setMessages((prev) => {
        const isDupe = prev.some((m) => m.messageId === msg.messageId);
        return isDupe ? prev : [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatOpen, id, session?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!session) {
      navigate("/auth");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch(`${API}/${id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelerId: session.id,
          date: bookingDate,
          message: bookingMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setBookingSuccess(true);
      setBookingDate("");
      setBookingMessage("");
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!session) { navigate("/auth"); return; }
    setReviewLoading(true);
    setReviewError("");
    try {
      const res = await fetch(`${API}/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelerId: session.id,
          // In a real flow you'd pass the bookingId — for now we use a placeholder
          bookingId: "completed-booking-id",
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Review failed");
      setReviewSuccess(true);
      setReviewComment("");
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !session || !socketRef.current) return;
    socketRef.current.emit("guide-message", {
      guideId: id,
      travelerId: session.id,
      senderRole: "traveler",
      message: chatInput.trim(),
    });
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="gp-loading">
        <div className="gp-spinner" />
        <p>Loading guide profile...</p>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="gp-error">
        <p>😕 {error || "Guide not found"}</p>
        <button onClick={() => navigate("/guides")}>Back to guides</button>
      </div>
    );
  }

  const guideName = guide.userId?.name || "Guide";

  return (
    <main className="gp-page">
      {/* Hero */}
      <section className="gp-hero">
        <div className="gp-hero-inner">
          <div className="gp-avatar-wrap">
            {guide.photo ? (
              <img src={guide.photo} alt={guideName} className="gp-avatar" />
            ) : (
              <div className="gp-avatar gp-avatar-placeholder">🧭</div>
            )}
            <span className="gp-verified-badge">✓ Verified</span>
          </div>

          <div className="gp-hero-info">
            <h1 className="gp-name">{guideName}</h1>
            <p className="gp-exp">{guide.experienceYears}+ years experience</p>

            <div className="gp-meta-row">
              {guide.rating > 0 && (
                <span className="gp-rating-pill">
                  ★ {guide.rating} ({guide.reviewsCount} reviews)
                </span>
              )}
              <span className="gp-price-pill">{formatCurrency(guide.pricePerDay)} / day</span>
            </div>

            <div className="gp-langs">
              {(guide.languages || []).map((lang) => (
                <span key={lang} className="gp-lang">{lang}</span>
              ))}
            </div>

            {guide.cities?.length > 0 && (
              <p className="gp-cities">📍 {guide.cities.join(", ")}</p>
            )}

            <div className="gp-hero-actions">
              <button
                className="gp-chat-btn"
                onClick={() => {
                  if (!session) { navigate("/auth"); return; }
                  setChatOpen(true);
                }}
              >
                💬 Chat with {guideName.split(" ")[0]}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="gp-body">
        {/* Bio */}
        {guide.bio && (
          <section className="gp-section">
            <h2>About</h2>
            <p className="gp-bio">{guide.bio}</p>
          </section>
        )}

        {/* Certifications */}
        {guide.certifications?.length > 0 && (
          <section className="gp-section">
            <h2>Certifications</h2>
            <div className="gp-certs">
              {guide.certifications.map((cert, i) => (
                <span key={i} className="gp-cert">
                  {cert.verified ? "✓ " : ""}{cert.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Coverage */}
        {(guide.states?.length > 0 || guide.cities?.length > 0) && (
          <section className="gp-section">
            <h2>Areas covered</h2>
            {guide.states?.length > 0 && (
              <p className="gp-coverage-row"><strong>States:</strong> {guide.states.join(", ")}</p>
            )}
            {guide.cities?.length > 0 && (
              <p className="gp-coverage-row"><strong>Cities:</strong> {guide.cities.join(", ")}</p>
            )}
          </section>
        )}

        {/* Booking form */}
        <section className="gp-section gp-booking">
          <h2>Book {guideName.split(" ")[0]}</h2>
          {!session ? (
            <div className="gp-auth-prompt">
              <p>You need to be logged in to make a booking.</p>
              <button onClick={() => navigate("/auth")}>Login to Book</button>
            </div>
          ) : bookingSuccess ? (
            <div className="gp-success">
              ✅ Booking request sent! {guideName.split(" ")[0]} will confirm shortly.
            </div>
          ) : (
            <form className="gp-booking-form" onSubmit={handleBooking}>
              <label className="gp-label">
                Trip date
                <input
                  className="gp-input"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </label>
              <label className="gp-label">
                Message to guide <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                <textarea
                  className="gp-input"
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  placeholder="Tell the guide about your group, interests, or any special requirements..."
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </label>
              {bookingError && <p className="gp-error-msg">{bookingError}</p>}
              <button type="submit" className="gp-book-btn" disabled={bookingLoading}>
                {bookingLoading ? "Sending request..." : `Request Booking · ${formatCurrency(guide.pricePerDay)}/day`}
              </button>
            </form>
          )}
        </section>

        {/* Reviews */}
        <section className="gp-section">
          <h2>Traveler Reviews</h2>

          {guide.reviews?.length === 0 && (
            <p className="gp-muted">No reviews yet. Be the first after your trip!</p>
          )}

          <div className="gp-reviews">
            {(guide.reviews || []).map((review) => (
              <article key={review._id} className="gp-review">
                <div className="gp-review-top">
                  <strong>{review.travelerId?.name || "Traveler"}</strong>
                  <span className="gp-review-rating">★ {Number(review.rating).toFixed(1)}</span>
                </div>
                <p>{review.comment}</p>
                <time>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
              </article>
            ))}
          </div>

          {/* Leave a review — only shown if logged in */}
          {session && (
            <div className="gp-review-form-wrap">
              <h3>Leave a review</h3>
              <p className="gp-muted" style={{ marginBottom: "0.75rem" }}>Only available after a completed booking.</p>
              {reviewSuccess ? (
                <p className="gp-success">✅ Review submitted, thank you!</p>
              ) : (
                <form className="gp-review-form" onSubmit={handleReview}>
                  <div className="gp-star-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`gp-star-btn ${star <= reviewRating ? "active" : ""}`}
                        onClick={() => setReviewRating(star)}
                      >
                        ★
                      </button>
                    ))}
                    <span className="gp-star-val">{reviewRating}/5</span>
                  </div>
                  <textarea
                    className="gp-input"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    style={{ resize: "vertical" }}
                    required
                  />
                  {reviewError && <p className="gp-error-msg">{reviewError}</p>}
                  <button type="submit" className="gp-review-submit" disabled={reviewLoading}>
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Chat window */}
      {chatOpen && (
        <div className="gp-chat-overlay" onClick={() => setChatOpen(false)}>
          <div className="gp-chat-box" onClick={(e) => e.stopPropagation()}>
            <div className="gp-chat-head">
              <h4>Chat with {guideName.split(" ")[0]}</h4>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="gp-chat-messages">
              {messages.length === 0 && (
                <p className="gp-muted" style={{ padding: "1rem", textAlign: "center" }}>
                  No messages yet. Start the conversation!
                </p>
              )}
              {messages.map((msg) => {
                const mine = msg.senderRole === "traveler";
                return (
                  <div key={msg.messageId || msg._id} className={`gp-msg ${mine ? "mine" : ""}`}>
                    <p>{msg.message}</p>
                    <small>{msg.senderRole === "guide" ? guideName.split(" ")[0] : "You"}</small>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form className="gp-chat-form" onSubmit={handleSendChat}>
              <input
                className="gp-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" disabled={!chatInput.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .gp-page { width: min(900px, 92%); margin: 0 auto 3rem; }
        .gp-loading, .gp-error {
          text-align: center; padding: 4rem 1rem; color: #64748b;
        }
        .gp-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .gp-hero {
          background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
          border: 1px solid #e0e7ff;
          border-radius: 20px;
          margin-top: 1.5rem;
          padding: clamp(1.2rem, 3vw, 2rem);
        }
        .gp-hero-inner {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .gp-avatar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .gp-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #c7d2fe;
        }
        .gp-avatar-placeholder {
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        }
        .gp-verified-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: #15803d;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 2px 10px;
        }
        .gp-hero-info { flex: 1; min-width: 0; }
        .gp-name { margin: 0 0 4px; font-size: clamp(1.4rem, 3vw, 2rem); color: #0f172a; }
        .gp-exp { margin: 0 0 10px; font-size: 0.875rem; color: #64748b; }
        .gp-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .gp-rating-pill {
          background: #fefce8; border: 1px solid #fde68a;
          border-radius: 8px; padding: 3px 10px;
          font-size: 0.85rem; font-weight: 700; color: #78350f;
        }
        .gp-price-pill {
          background: #eef2ff; border: 1px solid #c7d2fe;
          border-radius: 8px; padding: 3px 10px;
          font-size: 0.85rem; font-weight: 700; color: #4338ca;
        }
        .gp-langs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .gp-lang {
          font-size: 0.75rem; font-weight: 600; color: #4338ca;
          background: #eef2ff; border: 1px solid #c7d2fe;
          border-radius: 6px; padding: 2px 8px;
        }
        .gp-cities { margin: 0 0 12px; font-size: 0.85rem; color: #475569; }
        .gp-hero-actions { margin-top: 4px; }
        .gp-chat-btn {
          padding: 0.6rem 1.2rem;
          border: none; border-radius: 10px;
          background: #fff; border: 1px solid #c7d2fe;
          color: #4338ca; font-weight: 700; font-size: 0.875rem;
          cursor: pointer; transition: all 0.15s ease;
        }
        .gp-chat-btn:hover { background: #eef2ff; }
        .gp-body { display: grid; gap: 1.5rem; margin-top: 1.5rem; }
        .gp-section {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: clamp(1rem, 2vw, 1.5rem);
        }
        .gp-section h2 {
          margin: 0 0 0.9rem;
          font-size: 1.1rem; color: #0f172a;
        }
        .gp-bio { margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.7; }
        .gp-certs { display: flex; flex-wrap: wrap; gap: 8px; }
        .gp-cert {
          font-size: 0.775rem; font-weight: 600;
          color: #4338ca; background: #eef2ff;
          border: 1px solid #c7d2fe; border-radius: 6px; padding: 4px 10px;
        }
        .gp-coverage-row { margin: 0 0 4px; font-size: 0.875rem; color: #334155; }
        .gp-booking {}
        .gp-auth-prompt {
          background: #fafafe; border: 1px dashed #c7d2fe;
          border-radius: 10px; padding: 1rem; text-align: center;
        }
        .gp-auth-prompt p { margin: 0 0 0.75rem; color: #64748b; font-size: 0.875rem; }
        .gp-auth-prompt button {
          padding: 0.55rem 1.1rem; border: none; border-radius: 8px;
          background: #4f46e5; color: #fff; font-weight: 700; cursor: pointer;
        }
        .gp-booking-form { display: grid; gap: 0.9rem; }
        .gp-label { display: grid; gap: 0.3rem; font-size: 0.85rem; font-weight: 600; color: #334155; }
        .gp-input {
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 0.6rem 0.8rem; font-size: 0.875rem;
          font-family: inherit; color: #0f172a; background: #fff;
          transition: border-color 0.15s;
        }
        .gp-input:focus { outline: none; border-color: #a5b4fc; }
        .gp-book-btn {
          padding: 0.7rem 1rem; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          color: #fff; font-size: 0.9rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .gp-book-btn:hover:not(:disabled) { opacity: 0.9; }
        .gp-book-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .gp-error-msg {
          margin: 0; padding: 0.5rem 0.75rem;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; color: #991b1b; font-size: 0.825rem;
        }
        .gp-success {
          padding: 0.75rem 1rem; background: #f0fdf4;
          border: 1px solid #bbf7d0; border-radius: 10px;
          color: #15803d; font-weight: 600; font-size: 0.875rem;
        }
        .gp-muted { color: #94a3b8; font-size: 0.875rem; margin: 0; }
        .gp-reviews { display: grid; gap: 10px; margin-bottom: 1.5rem; }
        .gp-review {
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 0.75rem; background: #fafafa;
        }
        .gp-review-top {
          display: flex; justify-content: space-between;
          margin-bottom: 4px;
        }
        .gp-review-top strong { font-size: 0.875rem; color: #0f172a; }
        .gp-review-rating { font-size: 0.8rem; font-weight: 700; color: #f59e0b; }
        .gp-review p { margin: 0 0 4px; font-size: 0.825rem; color: #334155; }
        .gp-review time { font-size: 0.75rem; color: #94a3b8; }
        .gp-review-form-wrap { border-top: 1px solid #f1f5f9; padding-top: 1rem; }
        .gp-review-form-wrap h3 { margin: 0 0 0.25rem; font-size: 0.95rem; color: #0f172a; }
        .gp-star-row { display: flex; align-items: center; gap: 4px; }
        .gp-star-btn {
          border: none; background: transparent;
          font-size: 1.4rem; color: #e2e8f0; cursor: pointer; padding: 0 2px;
        }
        .gp-star-btn.active { color: #f59e0b; }
        .gp-star-val { font-size: 0.8rem; font-weight: 600; color: #64748b; margin-left: 4px; }
        .gp-review-form { display: grid; gap: 0.75rem; }
        .gp-review-submit {
          justify-self: start; padding: 0.5rem 1rem;
          border: none; border-radius: 8px;
          background: #1d4ed8; color: #fff;
          font-weight: 700; font-size: 0.85rem; cursor: pointer;
        }
        /* Chat overlay */
        .gp-chat-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.4);
          backdrop-filter: blur(4px);
          z-index: 1400;
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 1rem;
        }
        .gp-chat-box {
          width: min(360px, calc(100vw - 2rem));
          height: min(500px, 80vh);
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 40px rgba(15,23,42,0.18);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .gp-chat-head {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center;
        }
        .gp-chat-head h4 { margin: 0; font-size: 0.95rem; color: #0f172a; }
        .gp-chat-head button {
          border: none; background: #f1f5f9; border-radius: 6px;
          padding: 4px 8px; cursor: pointer; color: #475569;
        }
        .gp-chat-messages {
          flex: 1; overflow-y: auto;
          padding: 0.75rem; display: flex; flex-direction: column; gap: 8px;
        }
        .gp-msg {
          max-width: 80%; padding: 8px 12px;
          background: #f1f5f9; border-radius: 10px;
          align-self: flex-start;
        }
        .gp-msg.mine {
          align-self: flex-end; background: #eef2ff;
        }
        .gp-msg p { margin: 0; font-size: 0.85rem; color: #0f172a; }
        .gp-msg small { font-size: 0.7rem; color: #94a3b8; }
        .gp-chat-form {
          border-top: 1px solid #f1f5f9;
          padding: 0.6rem;
          display: grid; grid-template-columns: 1fr auto; gap: 6px;
        }
        .gp-chat-form button {
          border: none; border-radius: 8px;
          background: #4f46e5; color: #fff;
          font-weight: 700; padding: 0 14px; cursor: pointer;
        }
        .gp-chat-form button:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
      `}</style>
    </main>
  );
}

export default GuideProfile;