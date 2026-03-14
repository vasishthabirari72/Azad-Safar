import { useEffect, useState } from "react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const GUIDE_MARKETPLACE = [
  {
    id: "guide-rafael",
    name: "Rafael Dsouza",
    photo: "https://i.pravatar.cc/220?img=12",
    languages: ["English", "Hindi", "Marathi"],
    experienceYears: 9,
    rating: 4.9,
    reviewsCount: 214,
    pricePerDay: 5200,
    shortDescription: "Story-led city walks, hidden food alleys, and private heritage tours.",
    bio: "Licensed storyteller and city-walk curator focused on local culture, food routes, and historical landmarks.",
    certifications: ["Government Tourism License", "First Aid Certified", "Background Verified"],
    reviewHighlights: [
      { id: "r1", name: "Ananya", rating: 5, comment: "Great pacing and local insights." },
      { id: "r2", name: "Kiran", rating: 4.9, comment: "Handled our mixed-age group very well." },
    ],
    availability: ["Mar 6", "Mar 8", "Mar 12", "Mar 15", "Mar 19"],
    destinations: ["mumbai", "goa", "jaipur", "agra", "varanasi"],
  },
  {
    id: "guide-meera",
    name: "Meera Kapoor",
    photo: "https://i.pravatar.cc/220?img=47",
    languages: ["English", "Hindi", "French"],
    experienceYears: 7,
    rating: 4.8,
    reviewsCount: 186,
    pricePerDay: 4600,
    shortDescription: "Architecture-focused routes and premium cultural experience planning.",
    bio: "Cultural specialist with a focus on forts, palaces, and curated heritage narratives for international visitors.",
    certifications: ["Ministry of Tourism Certified", "Women Safety Network Partner", "Background Verified"],
    reviewHighlights: [
      { id: "r3", name: "Rahul", rating: 4.8, comment: "Deep knowledge and very professional." },
      { id: "r4", name: "Clara", rating: 5, comment: "Best host for heritage destinations." },
    ],
    availability: ["Mar 5", "Mar 9", "Mar 14", "Mar 16", "Mar 20"],
    destinations: ["jaipur", "udaipur", "agra", "delhi", "varanasi"],
  },
  {
    id: "guide-sonam",
    name: "Sonam Choden",
    photo: "https://i.pravatar.cc/220?img=38",
    languages: ["English", "Hindi", "Ladakhi"],
    experienceYears: 11,
    rating: 4.9,
    reviewsCount: 241,
    pricePerDay: 5800,
    shortDescription: "High-altitude planning, acclimatization support, and remote route expertise.",
    bio: "Mountain specialist guiding trekking groups and road-trip teams with safety-first itineraries.",
    certifications: ["Adventure Guide Certificate", "Wilderness First Responder", "Background Verified"],
    reviewHighlights: [
      { id: "r5", name: "Dev", rating: 5, comment: "Reliable and calm under weather changes." },
      { id: "r6", name: "Tashi", rating: 4.9, comment: "Helped us optimize every day of the trip." },
    ],
    availability: ["Mar 7", "Mar 10", "Mar 13", "Mar 17", "Mar 21"],
    destinations: ["leh", "ladakh", "spiti", "manali"],
  },
  {
    id: "guide-nilofer",
    name: "Nilofer Ali",
    photo: "https://i.pravatar.cc/220?img=59",
    languages: ["English", "Hindi", "Urdu"],
    experienceYears: 6,
    rating: 4.8,
    reviewsCount: 132,
    pricePerDay: 4100,
    shortDescription: "Temple and old-city circuits with family-friendly flexible timelines.",
    bio: "Community-hosted guide known for smooth coordination and local networks across old city districts.",
    certifications: ["Local Heritage Council Badge", "Gov ID Verified", "Background Verified"],
    reviewHighlights: [
      { id: "r7", name: "Sneha", rating: 4.8, comment: "Very patient and detailed." },
      { id: "r8", name: "Arman", rating: 4.9, comment: "Great recommendations beyond tourist spots." },
    ],
    availability: ["Mar 4", "Mar 11", "Mar 18", "Mar 22", "Mar 24"],
    destinations: ["varanasi", "lucknow", "hyderabad", "delhi"],
  },
];

const VEHICLE_MARKETPLACE = [
  {
    id: "vehicle-suv-1",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format&fit=crop",
    type: "SUV",
    seating: 6,
    ac: true,
    pricePerDay: 6800,
    driverIncluded: true,
    fuelPolicy: "Fuel included up to 120 km/day",
    destinations: ["jaipur", "agra", "leh", "varanasi", "mumbai"],
  },
  {
    id: "vehicle-sedan-1",
    image: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=900&q=80&auto=format&fit=crop",
    type: "Sedan",
    seating: 4,
    ac: true,
    pricePerDay: 4300,
    driverIncluded: true,
    fuelPolicy: "Fuel extra, toll included",
    destinations: ["jaipur", "agra", "varanasi", "delhi"],
  },
  {
    id: "vehicle-tempo-1",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&q=80&auto=format&fit=crop",
    type: "Tempo Traveller",
    seating: 12,
    ac: false,
    pricePerDay: 8200,
    driverIncluded: true,
    fuelPolicy: "Fuel included up to 90 km/day",
    destinations: ["jaipur", "leh", "spiti", "varanasi"],
  },
  {
    id: "vehicle-bike-1",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=80&auto=format&fit=crop",
    type: "Bike",
    seating: 2,
    ac: false,
    pricePerDay: 1900,
    driverIncluded: false,
    fuelPolicy: "Fuel self-managed",
    destinations: ["leh", "spiti", "goa", "mumbai"],
  },
  {
    id: "vehicle-bus-1",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&q=80&auto=format&fit=crop",
    type: "Bus",
    seating: 28,
    ac: true,
    pricePerDay: 14900,
    driverIncluded: true,
    fuelPolicy: "Fuel included within city limits",
    destinations: ["jaipur", "agra", "varanasi", "mumbai"],
  },
];

const normalizeDestination = (value) => String(value || "").toLowerCase();

// Fetches real guides from API filtered by destination city/state.
// Falls back to hardcoded data if API returns nothing or fails.
export const resolveMarketplaceForDestination = (destination) => {
  const text = normalizeDestination(destination);
  const guides = GUIDE_MARKETPLACE.filter((guide) =>
    guide.destinations.some((tag) => text.includes(tag))
  );
  const vehicles = VEHICLE_MARKETPLACE.filter((vehicle) =>
    vehicle.destinations.some((tag) => text.includes(tag))
  );
  return {
    guides: guides.length ? guides : GUIDE_MARKETPLACE.slice(0, 3),
    vehicles: vehicles.length ? vehicles : VEHICLE_MARKETPLACE.slice(0, 4),
  };
};

// Async version — use this when you want real DB guides inside TravelPlanner.
// Returns { guides, vehicles } just like the sync version.
export const fetchMarketplaceForDestination = async (destination) => {
  const text = normalizeDestination(destination);

  // Extract likely city name — take the first word of the destination
  const cityGuess = text.split(" ")[0];

  try {
    const res = await fetch(
      `http://localhost:8000/api/guides?city=${encodeURIComponent(cityGuess)}`
    );
    if (res.ok) {
      const realGuides = await res.json();
      if (realGuides.length > 0) {
        // Map DB guide shape to the shape GuideCard expects
        const mapped = realGuides.map((g) => ({
          id: g._id,
          name: g.userId?.name || "Guide",
          photo: g.photo || `https://i.pravatar.cc/220?u=${g._id}`,
          languages: g.languages || [],
          experienceYears: g.experienceYears || 0,
          rating: g.rating || 0,
          reviewsCount: g.reviewsCount || 0,
          pricePerDay: g.pricePerDay || 0,
          shortDescription: g.bio || "",
          bio: g.bio || "",
          certifications: (g.certifications || []).map((c) => c.label),
          reviewHighlights: [],
          availability: [],
          destinations: [...(g.cities || []), ...(g.states || [])],
        }));

        const vehicles = VEHICLE_MARKETPLACE.filter((v) =>
          v.destinations.some((tag) => text.includes(tag))
        );
        return {
          guides: mapped,
          vehicles: vehicles.length ? vehicles : VEHICLE_MARKETPLACE.slice(0, 4),
        };
      }
    }
  } catch {
    // Fall through to hardcoded data
  }

  // Fallback to hardcoded marketplace
  return resolveMarketplaceForDestination(destination);
};

/* =====================
   SERVICES TABS
===================== */
export function ServicesTabs({ activeTab, onTabChange }) {
  const isGuides = activeTab === "guides";
  return (
    <div className="sm-tabs">
      <button
        type="button"
        className={`sm-tab ${isGuides ? "active" : ""}`}
        onClick={() => onTabChange("guides")}
      >
        🧭 Guides
      </button>
      <button
        type="button"
        className={`sm-tab ${!isGuides ? "active" : ""}`}
        onClick={() => onTabChange("vehicles")}
      >
        🚗 Vehicles
      </button>

      <style>{`
        .sm-tabs {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
        }
        .sm-tab {
          flex: 1;
          padding: 0.55rem 1rem;
          border: none;
          border-radius: 9px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.18s ease;
        }
        .sm-tab.active {
          background: #ffffff;
          color: #4f46e5;
          box-shadow: 0 1px 4px rgba(15,23,42,0.1);
        }
      `}</style>
    </div>
  );
}

/* =====================
   GUIDE CARD
   Redesigned: horizontal layout, clear hierarchy, breathing room
===================== */
export function GuideCard({
  guide,
  onViewProfile,
  onHire,
  isSelected = false,
  isLocked = false,
  canManageServices = false,
}) {
  return (
    <article className={`gcard ${isSelected ? "gcard--selected" : ""}`}>
      <div className="gcard-left">
        <div className="gcard-avatar-wrap">
          <img src={guide.photo} alt={guide.name} className="gcard-avatar" loading="lazy" />
          <span className="gcard-verified">✓</span>
        </div>
        <div className="gcard-price-col">
          <span className="gcard-price">{formatCurrency(guide.pricePerDay)}</span>
          <span className="gcard-price-label">per day</span>
        </div>
      </div>

      <div className="gcard-body">
        <div className="gcard-top">
          <div>
            <h4 className="gcard-name">{guide.name}</h4>
            <p className="gcard-exp">{guide.experienceYears}+ years experience</p>
          </div>
          <div className="gcard-rating">
            <span className="gcard-star">★</span>
            <span className="gcard-rating-num">{guide.rating}</span>
            <span className="gcard-reviews">({guide.reviewsCount})</span>
          </div>
        </div>

        <p className="gcard-desc">{guide.shortDescription}</p>

        <div className="gcard-langs">
          {guide.languages.map((lang) => (
            <span key={`${guide.id}-${lang}`} className="gcard-lang">{lang}</span>
          ))}
        </div>

        <div className="gcard-actions">
          <button
            type="button"
            className="gcard-btn-outline"
            onClick={() => onViewProfile(guide)}
          >
            View Profile
          </button>
          <button
            type="button"
            className={`gcard-btn-hire ${isSelected ? "hired" : ""}`}
            onClick={() => onHire(guide)}
            disabled={!canManageServices || (isLocked && !isSelected)}
          >
            {isSelected ? "✓ Hired" : canManageServices ? "Hire Guide" : "View Only"}
          </button>
        </div>
      </div>

      <style>{`
        .gcard {
          display: flex;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .gcard:hover {
          box-shadow: 0 8px 24px rgba(15,23,42,0.09);
          border-color: #c7d2fe;
        }
        .gcard--selected {
          border-color: #6366f1;
          background: #fafafe;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .gcard-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 72px;
        }
        .gcard-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .gcard-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e0e7ff;
        }
        .gcard-verified {
          position: absolute;
          bottom: 0;
          right: -2px;
          width: 18px;
          height: 18px;
          background: #22c55e;
          color: #fff;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          font-weight: 700;
        }
        .gcard-price-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .gcard-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: #4f46e5;
          line-height: 1.2;
        }
        .gcard-price-label {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .gcard-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .gcard-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .gcard-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .gcard-exp {
          margin: 2px 0 0;
          font-size: 0.775rem;
          color: #64748b;
        }
        .gcard-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 3px 8px;
        }
        .gcard-star {
          color: #f59e0b;
          font-size: 0.85rem;
        }
        .gcard-rating-num {
          font-size: 0.85rem;
          font-weight: 700;
          color: #78350f;
        }
        .gcard-reviews {
          font-size: 0.75rem;
          color: #92400e;
        }
        .gcard-desc {
          margin: 0;
          font-size: 0.825rem;
          color: #475569;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gcard-langs {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .gcard-lang {
          font-size: 0.725rem;
          font-weight: 600;
          color: #4338ca;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 6px;
          padding: 2px 8px;
        }
        .gcard-actions {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }
        .gcard-btn-outline {
          flex: 0 0 auto;
          padding: 0.45rem 0.85rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .gcard-btn-outline:hover {
          border-color: #a5b4fc;
          background: #f8f8ff;
        }
        .gcard-btn-hire {
          flex: 1;
          padding: 0.45rem 0.85rem;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          color: #fff;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .gcard-btn-hire:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .gcard-btn-hire.hired {
          background: linear-gradient(135deg, #16a34a, #15803d);
        }
        .gcard-btn-hire:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
}

/* =====================
   GUIDE PROFILE MODAL
===================== */
export function GuideProfileModal({ guide, onClose, onBook, canManageServices = false }) {
  if (!guide) return null;
  return (
    <div className="tp-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="gmodal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gmodal-head">
          <div className="gmodal-hero">
            <img src={guide.photo} alt={guide.name} className="gmodal-photo" />
            <div>
              <h3 className="gmodal-name">{guide.name}</h3>
              <p className="gmodal-sub">
                {guide.experienceYears}+ years · {guide.languages.join(", ")}
              </p>
              <div className="gmodal-rating">
                <span style={{ color: "#f59e0b" }}>★</span>
                <strong>{guide.rating}</strong>
                <span style={{ color: "#64748b" }}>({guide.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>
          <button type="button" className="gmodal-close" onClick={onClose}>✕</button>
        </div>

        <p className="gmodal-bio">{guide.bio}</p>

        <div className="gmodal-section">
          <p className="gmodal-label">Certifications</p>
          <div className="gmodal-certs">
            {guide.certifications.map((item) => (
              <span key={`${guide.id}-${item}`} className="gmodal-cert">{item}</span>
            ))}
          </div>
        </div>

        <div className="gmodal-section">
          <p className="gmodal-label">Next available dates</p>
          <div className="gmodal-dates">
            {guide.availability.map((slot) => (
              <span key={`${guide.id}-${slot}`} className="gmodal-date">{slot}</span>
            ))}
          </div>
        </div>

        <div className="gmodal-section">
          <p className="gmodal-label">Traveler reviews</p>
          <div className="gmodal-reviews">
            {guide.reviewHighlights.map((item) => (
              <div key={item.id} className="gmodal-review">
                <div className="gmodal-review-top">
                  <strong>{item.name}</strong>
                  <span className="gmodal-review-rating">★ {item.rating}</span>
                </div>
                <p>{item.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="gmodal-footer">
          <div className="gmodal-price-wrap">
            <span className="gmodal-price-big">{formatCurrency(guide.pricePerDay)}</span>
            <span className="gmodal-price-unit">/ day</span>
          </div>
          <button
            type="button"
            className="gmodal-book-btn"
            onClick={() => onBook(guide)}
            disabled={!canManageServices}
          >
            {canManageServices ? "Book This Guide" : "Only host can hire"}
          </button>
        </div>

        <style>{`
          .gmodal {
            width: min(600px, 95vw);
            border-radius: 20px;
            background: #fff;
            padding: 1.5rem;
            display: grid;
            gap: 1.1rem;
            box-shadow: 0 24px 48px rgba(15,23,42,0.18);
            border: 1px solid #e2e8f0;
          }
          .gmodal-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }
          .gmodal-hero {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .gmodal-photo {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #e0e7ff;
            flex-shrink: 0;
          }
          .gmodal-name {
            margin: 0;
            font-size: 1.2rem;
            color: #0f172a;
          }
          .gmodal-sub {
            margin: 3px 0 5px;
            font-size: 0.85rem;
            color: #64748b;
          }
          .gmodal-rating {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.875rem;
          }
          .gmodal-close {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 6px 10px;
            cursor: pointer;
            color: #475569;
            font-size: 0.85rem;
            flex-shrink: 0;
          }
          .gmodal-bio {
            margin: 0;
            font-size: 0.9rem;
            color: #334155;
            line-height: 1.65;
            background: #f8fafc;
            border-radius: 10px;
            padding: 0.75rem;
          }
          .gmodal-section {
            display: grid;
            gap: 8px;
          }
          .gmodal-label {
            margin: 0;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94a3b8;
          }
          .gmodal-certs {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .gmodal-cert {
            font-size: 0.775rem;
            font-weight: 600;
            color: #4338ca;
            background: #eef2ff;
            border: 1px solid #c7d2fe;
            border-radius: 6px;
            padding: 4px 10px;
          }
          .gmodal-dates {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .gmodal-date {
            font-size: 0.8rem;
            color: #334155;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 5px 11px;
          }
          .gmodal-reviews {
            display: grid;
            gap: 8px;
          }
          .gmodal-review {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            background: #fafafa;
          }
          .gmodal-review-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .gmodal-review-top strong {
            font-size: 0.875rem;
            color: #0f172a;
          }
          .gmodal-review-rating {
            font-size: 0.8rem;
            font-weight: 700;
            color: #f59e0b;
          }
          .gmodal-review p {
            margin: 0;
            font-size: 0.825rem;
            color: #475569;
            line-height: 1.5;
          }
          .gmodal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-top: 0.5rem;
            border-top: 1px solid #f1f5f9;
          }
          .gmodal-price-wrap {
            display: flex;
            align-items: baseline;
            gap: 4px;
          }
          .gmodal-price-big {
            font-size: 1.4rem;
            font-weight: 800;
            color: #4f46e5;
          }
          .gmodal-price-unit {
            font-size: 0.85rem;
            color: #64748b;
          }
          .gmodal-book-btn {
            padding: 0.65rem 1.4rem;
            border: none;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            color: #fff;
            transition: opacity 0.15s ease;
          }
          .gmodal-book-btn:hover:not(:disabled) {
            opacity: 0.9;
          }
          .gmodal-book-btn:disabled {
            background: #e2e8f0;
            color: #94a3b8;
            cursor: not-allowed;
          }
        `}</style>
      </section>
    </div>
  );
}

/* =====================
   VEHICLE CARD
   Redesigned: cleaner info layout, larger image
===================== */
export function VehicleCard({
  vehicle,
  onBook,
  isSelected = false,
  isLocked = false,
  canManageServices = false,
}) {
  return (
    <article className={`vcard ${isSelected ? "vcard--selected" : ""}`}>
      <div className="vcard-img-wrap">
        <img src={vehicle.image} alt={vehicle.type} className="vcard-img" loading="lazy" />
        {vehicle.ac && <span className="vcard-ac-badge">AC</span>}
      </div>
      <div className="vcard-body">
        <div className="vcard-top">
          <h4 className="vcard-type">{vehicle.type}</h4>
          <span className="vcard-price">{formatCurrency(vehicle.pricePerDay)}<span className="vcard-price-unit">/day</span></span>
        </div>

        <div className="vcard-specs">
          <span className="vcard-spec">👥 {vehicle.seating} seats</span>
          <span className="vcard-spec">{vehicle.driverIncluded ? "👨‍✈️ Driver incl." : "🔑 Self-drive"}</span>
        </div>

        <p className="vcard-fuel">⛽ {vehicle.fuelPolicy}</p>

        <button
          type="button"
          className={`vcard-btn ${isSelected ? "booked" : ""}`}
          onClick={() => onBook(vehicle)}
          disabled={!canManageServices || (isLocked && !isSelected)}
        >
          {isSelected ? "✓ Booked" : canManageServices ? "Book Vehicle" : "View Only"}
        </button>
      </div>

      <style>{`
        .vcard {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .vcard:hover {
          box-shadow: 0 8px 24px rgba(15,23,42,0.09);
          border-color: #c7d2fe;
        }
        .vcard--selected {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .vcard-img-wrap {
          position: relative;
          height: 150px;
          overflow: hidden;
        }
        .vcard-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .vcard:hover .vcard-img {
          transform: scale(1.04);
        }
        .vcard-ac-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #0ea5e9;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .vcard-body {
          padding: 14px 16px;
          display: grid;
          gap: 8px;
        }
        .vcard-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .vcard-type {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .vcard-price {
          font-size: 1rem;
          font-weight: 700;
          color: #4f46e5;
        }
        .vcard-price-unit {
          font-size: 0.75rem;
          font-weight: 500;
          color: #94a3b8;
        }
        .vcard-specs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .vcard-spec {
          font-size: 0.775rem;
          color: #475569;
          background: #f1f5f9;
          border-radius: 6px;
          padding: 3px 8px;
        }
        .vcard-fuel {
          margin: 0;
          font-size: 0.775rem;
          color: #64748b;
        }
        .vcard-btn {
          width: 100%;
          padding: 0.55rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          color: #fff;
          transition: opacity 0.15s ease;
          margin-top: 2px;
        }
        .vcard-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .vcard-btn.booked {
          background: linear-gradient(135deg, #16a34a, #15803d);
        }
        .vcard-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
}

/* =====================
   BOOKING SUMMARY
===================== */
export function BookingSummary({ services, travelerCount, canManageServices = false }) {
  const guideCost = services?.guide?.pricePerDay || 0;
  const vehicleCost = services?.vehicle?.pricePerDay || 0;
  const total = guideCost + vehicleCost;
  const split = travelerCount > 0 ? total / travelerCount : total;
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 420);
    return () => clearTimeout(timer);
  }, [total]);

  return (
    <div className="bsum">
      <div className="bsum-rows">
        <div className="bsum-row">
          <span className="bsum-label">Guide</span>
          <span className="bsum-val">
            {services?.guide
              ? <><span className="bsum-dot bsum-dot--green" />{services.guide.name}</>
              : <span className="bsum-empty">Not selected</span>}
          </span>
        </div>
        <div className="bsum-row">
          <span className="bsum-label">Vehicle</span>
          <span className="bsum-val">
            {services?.vehicle
              ? <><span className="bsum-dot bsum-dot--green" />{services.vehicle.type}</>
              : <span className="bsum-empty">Not selected</span>}
          </span>
        </div>
      </div>

      <div className="bsum-costs">
        <div className="bsum-cost-row">
          <span>Guide</span><span>{formatCurrency(guideCost)}</span>
        </div>
        <div className="bsum-cost-row">
          <span>Vehicle</span><span>{formatCurrency(vehicleCost)}</span>
        </div>
      </div>

      <div className="bsum-divider" />

      <div className="bsum-totals">
        <div className="bsum-total-row">
          <span>Total / day</span>
          <span className={`bsum-total-num ${pulse ? "bsum-pulse" : ""}`}>
            {formatCurrency(total)}
          </span>
        </div>
        <div className="bsum-total-row bsum-total-row--split">
          <span>Split per traveler ({travelerCount})</span>
          <span className="bsum-split-num">{formatCurrency(split)}</span>
        </div>
      </div>

      <p className="bsum-note">
        {services?.guide || services?.vehicle
          ? canManageServices
            ? "Selections are active for this trip."
            : "Host has locked these selections."
          : "No services selected yet."}
      </p>

      <style>{`
        .bsum {
          display: grid;
          gap: 12px;
        }
        .bsum-rows {
          display: grid;
          gap: 8px;
        }
        .bsum-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
        .bsum-label {
          color: #64748b;
          font-weight: 500;
        }
        .bsum-val {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #0f172a;
        }
        .bsum-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bsum-dot--green { background: #22c55e; }
        .bsum-empty {
          color: #94a3b8;
          font-weight: 400;
        }
        .bsum-costs {
          display: grid;
          gap: 4px;
          padding: 0 2px;
        }
        .bsum-cost-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #64748b;
        }
        .bsum-divider {
          height: 1px;
          background: #e2e8f0;
        }
        .bsum-totals {
          display: grid;
          gap: 8px;
        }
        .bsum-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #334155;
        }
        .bsum-total-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #4f46e5;
          transition: transform 0.15s ease;
        }
        .bsum-pulse {
          transform: scale(1.08);
        }
        .bsum-total-row--split {
          font-size: 0.825rem;
        }
        .bsum-split-num {
          font-size: 0.95rem;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 7px;
          padding: 3px 10px;
        }
        .bsum-note {
          margin: 0;
          font-size: 0.775rem;
          color: #94a3b8;
          text-align: center;
          padding: 8px;
          background: #f8fafc;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

/* =====================
   BOOKING CONFIRMATION MODAL
===================== */
export function BookingConfirmationModal({ bookingIntent, onClose, onConfirm }) {
  if (!bookingIntent) return null;
  const isGuide = bookingIntent.type === "guide";
  return (
    <div className="tp-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="bconfirm"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="bconfirm-title">
          {isGuide ? "Confirm guide hire" : "Confirm vehicle booking"}
        </h4>
        <p className="bconfirm-sub">
          Add <strong>{bookingIntent.item.name || bookingIntent.item.type}</strong> to trip services?
        </p>
        <p className="bconfirm-price">{formatCurrency(bookingIntent.item.pricePerDay)} / day</p>
        <div className="bconfirm-actions">
          <button type="button" className="bconfirm-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="bconfirm-ok"
            onClick={() => onConfirm(isGuide ? "guide" : "vehicle", bookingIntent.item)}
          >
            Confirm
          </button>
        </div>

        <style>{`
          .bconfirm {
            width: min(420px, 94vw);
            border-radius: 18px;
            background: #fff;
            padding: 1.4rem;
            box-shadow: 0 24px 44px rgba(15,23,42,0.18);
            border: 1px solid #e2e8f0;
            display: grid;
            gap: 10px;
          }
          .bconfirm-title {
            margin: 0;
            font-size: 1.1rem;
            color: #0f172a;
          }
          .bconfirm-sub {
            margin: 0;
            font-size: 0.9rem;
            color: #475569;
          }
          .bconfirm-price {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: #4f46e5;
          }
          .bconfirm-actions {
            display: flex;
            gap: 8px;
            margin-top: 4px;
          }
          .bconfirm-cancel {
            flex: 1;
            padding: 0.6rem;
            border: 1px solid #e2e8f0;
            background: #fff;
            border-radius: 9px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #475569;
            cursor: pointer;
          }
          .bconfirm-ok {
            flex: 1;
            padding: 0.6rem;
            border: none;
            border-radius: 9px;
            font-size: 0.875rem;
            font-weight: 700;
            color: #fff;
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            cursor: pointer;
          }
        `}</style>
      </section>
    </div>
  );
}