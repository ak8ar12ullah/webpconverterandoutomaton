import { downloadImage } from "./downloadImage.js";
import db from "./db.js";
import puppeteer from "puppeteer";
import path from "path";

const urlFutakeCoId = "https://futake.co.id";

export async function newTabFutake(browser, product, id) {
  const newTab = await browser.newPage();

  // buka halaman
  await newTab.goto(urlFutakeCoId, {
    waitUntil: "networkidle2",
  });

  // Klik tombol pencarian (ikon search)
  await newTab.click('a[aria-label="Pencarian"]');

  // Tunggu input search muncul
  await newTab.waitForSelector("#woocommerce-product-search-field-1", {
    visible: true,
  });

  // Isi kata pencarian
  await newTab.type("#woocommerce-product-search-field-1", product, {
    delay: 30,
  });

  // Tekan Enter supaya form search jalan
  await newTab.keyboard.press("Enter");

  // Tunggu halaman berpindah (navigasi selesai)
  await newTab.waitForNavigation({ waitUntil: "networkidle0" });

  // Ambil nama product
  const namaProduct = await newTab.$eval("h1.product-title", (el) =>
    el.textContent.trim()
  );

  // Ambil semua src gambar di gallery
  const imageUrls = await newTab.$$eval(
    ".woocommerce-product-gallery__wrapper a img",
    (imgs) => imgs.map((img) => img.getAttribute("data-src") || img.src)
  );

  console.log(`📌 Ditemukan ${imageUrls.length} gambar`);

  for (const imageUrl of imageUrls) {
    try {
      // Ambil nama asli dari URL
      const originalName = path.basename(new URL(imageUrl).pathname);

      // Download gambar
      await downloadImage(imageUrl, originalName);
      console.log("✅ Download:", originalName);
      try {
        // tanpa resize, tanpa ubah kualitas (default quality=80)
        const webpPath = await convertToWebP(
          "./savedImages/manhole-cirebon-sanitasi-2017.png",
          "./webpImages/"
        );
        console.log("✅ Konversi tanpa resize:", webpPath);
        console.log(`gagal di id ${id} dan nama product ${product}`);
      } catch (err) {
        console.error("❌ Gagal konversi:", err);
      }
      // Update DB
      db.query(
        "UPDATE product SET gambar = ? WHERE namaProduct = ?",
        [originalName, namaProduct],
        (err) => {
          if (err) console.error("❌ Gagal update DB:", err);
          else console.log("📝 Update DB:", namaProduct, "->", originalName);
        }
      );
    } catch (err) {
      console.error("❌ Gagal download:", imageUrl, err.message);
    }
  }

  await newTab.close();
}
