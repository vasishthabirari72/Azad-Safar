const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Place = require("../models/Place");
const { normalizePlace, normalizePlacesPayload } = require("../utils/placeNormalizer");

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const main = async () => {
  const inputPath = path.resolve(
    process.cwd(),
    process.argv[2] || "data/azaad_safar_destinations.json"
  );

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in server/.env");
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const places = normalizePlacesPayload(JSON.parse(raw));

  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("Input file must be a non-empty array or { places: [...] }");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const lastPlace = await Place.findOne().sort({ id: -1 }).select("id");
  const firstGeneratedId = Number(lastPlace?.id || 0) + 1;
  const normalizedPlaces = places.map((place, index) =>
    normalizePlace(place, firstGeneratedId + index)
  );

  let insertedCount = 0;
  let updatedCount = 0;
  let matchedCount = 0;

  for (const batch of chunk(normalizedPlaces, 500)) {
    const operations = batch.map((place) => {
      const { id, slug, ...setFields } = place;
      return {
        updateOne: {
          filter: slug ? { slug } : { id },
          update: {
            $set: { ...setFields, slug },
            $setOnInsert: { id }
          },
          upsert: true
        }
      };
    });

    const result = await Place.bulkWrite(operations, { ordered: false });
    insertedCount += result.upsertedCount || 0;
    updatedCount += result.modifiedCount || 0;
    matchedCount += result.matchedCount || 0;
  }

  console.log(
    `Imported ${normalizedPlaces.length} destinations: ${insertedCount} inserted, ${updatedCount} updated, ${matchedCount} matched.`
  );

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
