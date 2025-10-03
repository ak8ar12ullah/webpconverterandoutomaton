import { downloadImage } from "./downloadImage.js";
import db from "./db.js";
import path from "path";
import { nameWithoutExt } from "./menghilangkanExtensi.js";
import { convertToWebP } from "./convertWebp.js";

export default async function scrapingFutakeCoId(newTab, product, id, url) {
  await newTab.goto(url, { waitUntil: "networkidle2" });

  try {
    // await newTab.waitForSelector("h1.product-title", { timeout: 2000 });
    const namaProduct = await newTab.$eval("h1.product-title", (el) =>
      el.textContent.trim()
    );

    console.log("mulai scraping " + namaProduct);

    // // Ambil semua src gambar di gallery
    // const imageUrls = await newTab.$$eval(
    //   ".woocommerce-product-gallery__wrapper a img",
    //   (imgs) => imgs.map((img) => img.getAttribute("data-src") || img.src)
    // );

    // Ambil src gambar pertama di gallery
    const imageUrl = await newTab.$eval(
      ".woocommerce-product-gallery__wrapper a img",
      (img) => img.getAttribute("data-src") || img.src
    );

    console.log(`📌 Ditemukan ${imageUrl.length} gambar`);

    // for (const imageUrl of imageUrls) {
    try {
      // Ambil nama asli dari URL
      const originalName = path.basename(new URL(imageUrl).pathname);
      const originalNameNonExt = nameWithoutExt(originalName);
      const urlNow = await newTab.url();

      // Download gambar
      await downloadImage(imageUrl, originalName);
      console.log("✅ Download:", originalName);
      try {
        const inputPath = path.join("./savedImages", originalName);

        // tanpa resize, tanpa ubah kualitas (default quality=80)
        const webpPath = await convertToWebP(inputPath, "./webpImages/");
        console.log("✅ Konversi tanpa resize:", webpPath);

        try {
          await db
            .promise()
            .query(
              "UPDATE product SET gambarWebP = ?, converSuccess=?  WHERE No = ?",
              [`${originalNameNonExt}.webp`, true, id]
            );
          console.log("📝 Update DB:", product, "->", originalName);
        } catch (err) {
          console.error("❌ Gagal update DB:", err);
          console.log(`gagal di id ${id} dan nama product ${product}`);
        }
        try {
          await db.promise().query(
            `UPDATE product SET
                UrlFutakeCoId = ?, 
                namaFutakeCoId = ?, 
                tahap2 = ? 
            WHERE No = ?`,
            [urlNow, namaProduct, 1, id]
          );
          console.log("📝 Update DB:", product, "->", originalName);
        } catch (err) {
          console.error("❌ Gagal update DB:", err);
        }
      } catch (err) {
        console.error("❌ Gagal konversi:", err);
        console.log(`gagal di id ${id} dan nama product ${product}`);
      }
    } catch (err) {
      console.log(`gagal di id ${id} dan nama product ${product}`);

      console.error("❌ Gagal download:", imageUrl, err.message);
      console.error(err);
      // throw new Error();
    }
    // }
    // await newTab.close();
  } catch (e) {
    console.error(e);
  } finally {
    // if (!newTab.isClosed()) await newTab.close();
  }
}
