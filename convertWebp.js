// imageUtils.js
import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * Convert image ke WebP, simpan di folder output, skip kalau sudah WebP
 * @param {string} inputPath - path file gambar asli
 * @param {string} outputDir - folder tujuan WebP
 * @param {number} quality - kualitas 0-100 (default 80)
 * @param {number} width - resize lebar gambar (opsional)
 * @returns {Promise<string>} - path file WebP hasil konversi
 */
export async function convertToWebP(
  inputPath,
  outputDir,
  quality = 80,
  width = null
) {
  try {
    if (!fs.existsSync(inputPath)) throw new Error("File tidak ditemukan");

    // pastikan folder output ada
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const outputPath = path.join(outputDir, baseName + ".webp");

    if (ext === ".webp") {
      // jika sudah WebP, copy ke folder tujuan jika belum ada
      if (inputPath !== outputPath) {
        fs.copyFileSync(inputPath, outputPath);
      }
      return outputPath;
    }

    // konversi ke WebP
    let pipeline = sharp(inputPath);
    if (width) pipeline = pipeline.resize(width);

    await pipeline.webp({ quality }).toFile(outputPath);

    return outputPath;
  } catch (err) {
    throw err;
  }
}
