import fs from "fs";
import { pipeline } from "stream/promises";

const query = process.argv.slice(2).join(" ");

if (!query) {
  console.log('Please enter a name. Example: node download.mjs "Taj Mahal"');
  process.exit();
}

const fileName = query.replace(/\s+/g, "_") + ".jpg";
const url = `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}`;

console.log(`Downloading image for: ${query} ...`);

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  if (!fs.existsSync("./images")) fs.mkdirSync("./images", { recursive: true });

  const filePath = `./images/${fileName}`;
  const writeStream = fs.createWriteStream(filePath);

  await pipeline(res.body, writeStream);

  // show filesize
  const size = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`? Downloaded: ${filePath} (${size} KB)`);
} catch (err) {
  console.error("Error:", err.message);
}