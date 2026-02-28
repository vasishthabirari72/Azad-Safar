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
    shortDescription:
      "Story-led city walks, hidden food alleys, and private heritage tours.",
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
    shortDescription:
      "Architecture-focused routes and premium cultural experience planning.",
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
    shortDescription:
      "High-altitude planning, acclimatization support, and remote route expertise.",
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
    shortDescription:
      "Temple and old-city circuits with family-friendly flexible timelines.",
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
    type: "Tempo",
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

export function ServicesTabs({ activeTab, onTabChange }) {
  const isGuides = activeTab === "guides";
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-1.5">
      <div className="relative grid grid-cols-2 gap-1">
        <div
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${isGuides ? "0%" : "100%"})` }}
        />
        <button
          type="button"
          onClick={() => onTabChange("guides")}
          className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isGuides ? "text-indigo-700" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="mr-1.5" aria-hidden="true">
            🧭
          </span>
          Guides
        </button>
        <button
          type="button"
          onClick={() => onTabChange("vehicles")}
          className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            !isGuides ? "text-indigo-700" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="mr-1.5" aria-hidden="true">
            🚗
          </span>
          Vehicles
        </button>
      </div>
    </div>
  );
}

export function GuideCard({
  guide,
  onViewProfile,
  onHire,
  isSelected = false,
  isLocked = false,
  canManageServices = false,
}) {
  return (
    <article className="group rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={guide.photo}
            alt={guide.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-100"
            loading="lazy"
          />
          <div>
            <h5 className="text-[1.02rem] font-bold text-slate-900">{guide.name}</h5>
            <p className="text-sm text-slate-600">{guide.experienceYears}+ years experience</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Verified
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {guide.languages.map((lang) => (
          <span
            key={`${guide.id}-${lang}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
          >
            {lang}
          </span>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-900">
          {guide.rating} <span aria-hidden="true">⭐</span>
          <span className="ml-1 font-normal text-slate-500">({guide.reviewsCount} reviews)</span>
        </p>
        <p className="font-semibold text-indigo-700">{formatCurrency(guide.pricePerDay)}/day</p>
      </div>

      <p
        className="mb-4 text-sm text-slate-600"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {guide.shortDescription}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          Gov ID + Background Verified
        </span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          4.8+ Rated
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onViewProfile(guide)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          View Profile
        </button>
        <button
          type="button"
          onClick={() => onHire(guide)}
          disabled={!canManageServices || isLocked}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition ${
            isSelected
              ? "bg-emerald-100 text-emerald-700"
              : !canManageServices || isLocked
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
          }`}
        >
          {isSelected ? "Hired" : canManageServices ? "Hire Guide" : "View Only"}
        </button>
      </div>
    </article>
  );
}

export function GuideProfileModal({ guide, onClose, onBook, canManageServices = false }) {
  if (!guide) return null;
  return (
    <div className="tp-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="w-full max-w-2xl rounded-[20px] border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={guide.photo}
              alt={guide.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-indigo-100"
            />
            <div>
              <h4 className="text-xl font-bold text-slate-900">{guide.name}</h4>
              <p className="text-sm text-slate-600">
                {guide.experienceYears}+ years · {guide.languages.join(", ")}
              </p>
              <p className="text-sm font-semibold text-indigo-700">
                {guide.rating} ⭐ ({guide.reviewsCount} reviews)
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="mb-4 text-sm leading-6 text-slate-700">{guide.bio}</p>

        <div className="mb-4">
          <h5 className="mb-2 text-sm font-semibold text-slate-900">Certifications</h5>
          <div className="flex flex-wrap gap-2">
            {guide.certifications.map((item) => (
              <span
                key={`${guide.id}-${item}`}
                className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h5 className="mb-2 text-sm font-semibold text-slate-900">Availability Calendar</h5>
          <div className="flex flex-wrap gap-2">
            {guide.availability.map((slot) => (
              <span
                key={`${guide.id}-${slot}`}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h5 className="mb-2 text-sm font-semibold text-slate-900">Reviews</h5>
          <div className="space-y-2">
            {guide.reviewHighlights.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-sm font-semibold text-slate-900">
                  {item.name} · {item.rating} ⭐
                </p>
                <p className="text-sm text-slate-600">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onBook(guide)}
          disabled={!canManageServices}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            canManageServices
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              : "cursor-not-allowed bg-slate-100 text-slate-500"
          }`}
        >
          {canManageServices
            ? `Book Guide (${formatCurrency(guide.pricePerDay)}/day)`
            : "Only host can hire services"}
        </button>
      </section>
    </div>
  );
}

export function VehicleCard({
  vehicle,
  onBook,
  isSelected = false,
  isLocked = false,
  canManageServices = false,
}) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden">
        <img
          src={vehicle.image}
          alt={vehicle.type}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-900/30 to-transparent p-3">
          <h5 className="text-base font-bold text-white">{vehicle.type}</h5>
          <p className="text-sm font-semibold text-indigo-100">
            {formatCurrency(vehicle.pricePerDay)}/day
          </p>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 grid gap-2 text-sm text-slate-700">
          <p className="rounded-xl bg-slate-50 px-2.5 py-2">🚗 {vehicle.seating} Seats</p>
          <p className="rounded-xl bg-slate-50 px-2.5 py-2">
            👨 {vehicle.driverIncluded ? "Driver Included" : "Self-drive"}
          </p>
          <p className="rounded-xl bg-slate-50 px-2.5 py-2">⛽ {vehicle.fuelPolicy}</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              vehicle.ac ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"
            }`}
          >
            {vehicle.ac ? "AC" : "Non-AC"}
          </span>
          <button
            type="button"
            onClick={() => onBook(vehicle)}
            disabled={!canManageServices || isLocked}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isSelected
                ? "bg-emerald-100 text-emerald-700"
                : !canManageServices || isLocked
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
            }`}
          >
            {isSelected ? "Booked" : canManageServices ? "Book Vehicle" : "View Only"}
          </button>
        </div>
      </div>
    </article>
  );
}

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
    <aside className="sticky bottom-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-md transition-shadow">
      <h5 className="mb-3 text-base font-bold text-slate-900">Trip Services Summary</h5>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Guide</span>
          <span className="font-semibold text-slate-900">
            {services?.guide ? `🟢 ${services.guide.name} (Selected)` : "Not selected"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Vehicle</span>
          <span className="font-semibold text-slate-900">
            {services?.vehicle ? `🟢 ${services.vehicle.type} (Selected)` : "Not selected"}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <p>Guide cost: {formatCurrency(guideCost)}</p>
        <p>Vehicle cost: {formatCurrency(vehicleCost)}</p>
      </div>
      <div className="my-3 border-t border-slate-200" />
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Total Cost / Day</span>
          <span
            className={`text-base font-bold text-indigo-700 transition-transform ${
              pulse ? "scale-105" : "scale-100"
            }`}
          >
            {formatCurrency(total)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Split per traveler ({travelerCount})</span>
          <span className="rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
            {formatCurrency(split)}
          </span>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        {services?.guide || services?.vehicle
          ? canManageServices
            ? "Selections are active for this trip."
            : "Host has locked these service selections for this trip."
          : "No services selected yet."}
      </div>
    </aside>
  );
}

export function BookingConfirmationModal({ bookingIntent, onClose, onConfirm }) {
  if (!bookingIntent) return null;
  const isGuide = bookingIntent.type === "guide";
  const label = isGuide ? "guide" : "vehicle";
  return (
    <div className="tp-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h4 className="text-lg font-bold text-slate-900">
          Confirm {isGuide ? "Guide Hire" : "Vehicle Booking"}
        </h4>
        <p className="mt-2 text-sm text-slate-600">
          Add{" "}
          <span className="font-semibold text-slate-900">
            {bookingIntent.item.name || bookingIntent.item.type}
          </span>{" "}
          to trip services?
        </p>
        <p className="mt-1 text-sm font-semibold text-indigo-700">
          {formatCurrency(bookingIntent.item.pricePerDay)}/day
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => onConfirm(label, bookingIntent.item)}
          >
            Confirm
          </button>
        </div>
      </section>
    </div>
  );
}
