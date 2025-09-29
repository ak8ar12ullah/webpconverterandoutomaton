import fs from "fs-extra"; // pakai fs-extra biar ada ensureDirSync
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// bikin ulang __dirname untuk ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// folder simpan gambar
const IMAGE_DIR = path.join(__dirname, "savedImages");
fs.ensureDirSync(IMAGE_DIR);

export async function downloadImage(url, filename) {
  const filePath = path.join(IMAGE_DIR, filename);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filename));
    writer.on("error", reject);
  });
}
