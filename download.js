const https = require("https");
const fs = require("fs");

const query = process.argv.slice(2).join(" ");

if (!query) {
  console.log('Please enter a name. Example: node download.js "Taj Mahal"');
  process.exit();
}

const fileName = query.replace(/\s+/g, "_") + ".jpg";
const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;

console.log(`Downloading image for: ${query} ...`);

https.get(url, (res) => {
  const filePath = `./images/${fileName}`;
  const writeStream = fs.createWriteStream(filePath);

  res.pipe(writeStream);

  writeStream.on("finish", () => {
    writeStream.close();
    console.log(`✔ Downloaded: ${filePath}`);
  });

  writeStream.on("error", (err) => {
    console.error("Write error:", err);
  });
}).on("error", (err) => {
  console.error("Request error:", err);
});
