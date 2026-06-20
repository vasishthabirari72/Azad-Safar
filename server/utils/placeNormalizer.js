const APP_CATEGORIES = ["high-rated", "recommended", "hidden-gem"];

// Domains whose images are known dead — strip these so the frontend never attempts the request.
const DEAD_IMAGE_HOSTS = ["images.azaadsafar.com"];

const isLiveImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const host = new URL(url).hostname;
    return !DEAD_IMAGE_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
};

const resolveImage = (url) => (isLiveImageUrl(url) ? url : "");

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const cleanText = (value, fallback = "") => {
  const text = String(value || "").trim();
  return text || fallback;
};

const normalizeCategory = (item) => {
  const existing = Array.isArray(item.category)
    ? item.category.filter((category) => APP_CATEGORIES.includes(category))
    : [];

  if (existing.length) return [...new Set(existing)];

  const rating = toNumber(item.rating, 0);
  const popularityScore = toNumber(item.popularityScore, 0);
  const categories = [];

  if (rating >= 4.9 && popularityScore >= 85) categories.push("high-rated");
  if (popularityScore >= 96 || (rating >= 4.8 && popularityScore >= 90)) categories.push("recommended");
  if (rating >= 4.3 && popularityScore <= 56) categories.push("hidden-gem");

  return [...new Set(categories)];
};

const normalizePlace = (item, fallbackId) => {
  const title = cleanText(item.title || item.name, "Untitled destination");
  const rating = Math.min(5, Math.max(0, toNumber(item.rating, 4)));
  const rawImage = resolveImage(item.image) || resolveImage(item.imageUrl) || "";
  const image = rawImage || "images/hero.jpg";

  return {
    id: toNumber(item.id, fallbackId),
    title,
    slug: cleanText(item.slug),
    state: cleanText(item.state, "Unknown"),
    district: cleanText(item.district),
    city: cleanText(item.city || item.district || item.state, "Unknown"),
    rating,
    category: normalizeCategory(item),
    destinationCategory: cleanText(item.destinationCategory || (Array.isArray(item.category) ? "" : item.category)),
    subcategory: cleanText(item.subcategory),
    image,
    image2: resolveImage(item.image2) || resolveImage(item.imageUrl) || resolveImage(item.image) || "",
    imageUrl: resolveImage(item.imageUrl) || resolveImage(item.image) || resolveImage(item.image2) || "",
    description: cleanText(item.description, `${title} is a destination in India.`),
    latitude: item.latitude === undefined ? undefined : toNumber(item.latitude),
    longitude: item.longitude === undefined ? undefined : toNumber(item.longitude),
    bestSeason: Array.isArray(item.bestSeason) ? item.bestSeason.map(cleanText).filter(Boolean) : [],
    difficulty: cleanText(item.difficulty),
    entryFee: cleanText(item.entryFee),
    tags: Array.isArray(item.tags) ? item.tags.map(cleanText).filter(Boolean) : [],
    popularityScore: item.popularityScore === undefined ? undefined : toNumber(item.popularityScore),
    nearbyPlaces: Array.isArray(item.nearbyPlaces) ? item.nearbyPlaces : [],
    reviews: Array.isArray(item.reviews) ? item.reviews : []
  };
};

const normalizePlacesPayload = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.places)) return body.places;
  return null;
};

module.exports = {
  normalizePlace,
  normalizePlacesPayload
};
