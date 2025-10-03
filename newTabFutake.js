import { downloadImage } from "./downloadImage.js";
import db from "./db.js";
import path from "path";
import { nameWithoutExt } from "./menghilangkanExtensi.js";
import { convertToWebP } from "./convertWebp.js";

const urlFutakeCoId = "https://futake.co.id";

export async function newTabFutake(browser, product, id) {
  console.log("begin download image...");
  const newTab = await browser.newPage();
  try {
    await newTab.goto(urlFutakeCoId, { waitUntil: "networkidle2" });

    await newTab.waitForSelector('a[aria-label="Pencarian"]', {
      visible: true,
    });
    await setTimeout(() => {}, 1300);
    // await new Promise((resolve) => setTimeout(resolve, 1300));
    await newTab.click('a[aria-label="Pencarian"]');

    // Tunggu input search muncul
    await newTab.waitForSelector("#woocommerce-product-search-field-1", {
      visible: true,
    });

    // Isi kata pencarian
    await newTab.type("#woocommerce-product-search-field-1", product, {
      delay: 30,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Tunggu autocomplete muncul (max 5 detik)
    await newTab
      .waitForSelector(".autocomplete-suggestions .autocomplete-suggestion", {
        visible: true,
        timeout: 35000,
      })
      .catch(() => {
        console.log("⚠ Autocomplete tidak muncul");
        throw new Error();
      });

    // Ambil elemen pertama
    // Ambil elemen pertama
    const firstSuggestion = await newTab.$(
      ".autocomplete-suggestions .autocomplete-suggestion[data-index='0']"
    );

    if (firstSuggestion) {
      // Ambil teks dalam suggestion
      const suggestionText = await newTab.evaluate(
        (el) => el.innerText.trim(),
        firstSuggestion
      );

      if (suggestionText.includes("Tidak ada produk yang ditemukan")) {
        console.log("❌ Produk tidak ditemukan di WooCommerce:", product);
        dbProductNone(product);
        throw new Error("Produk tidak ditemukan");
      } else {
        await firstSuggestion.click();
        console.log(
          "✅ Klik produk pertama dari autocomplete:",
          suggestionText
        );
      }
    } else {
      console.log("⚠ Suggestion pertama tidak ditemukan");
      throw new Error("Suggestion pertama tidak ditemukan");
    }

    await newTab.waitForNavigation({ waitUntil: "networkidle0" });

    const namaProduct = await newTab.$eval("h1.product-title", (el) =>
      el.textContent.trim()
    );
    console.log("mulai scraping " + namaProduct);

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
          db.query(
            "UPDATE product SET gambarWebP = ?, converSuccess=?  WHERE namaProduct = ?",
            [`${originalNameNonExt}.webp`, true, product],
            (err) => {
              if (err) {
                console.error("❌ Gagal update DB:", err);
                console.log(`gagal di id ${id} dan nama product ${product}`);
              } else {
                console.log("📝 Update DB:", namaProduct, "->", originalName);
              }
            }
          );
        } catch (err) {
          console.error("❌ Gagal konversi:", err);
          console.log(`gagal di id ${id} dan nama product ${product}`);
        }
        // Update DB
        db.query(
          `UPDATE product set
       UrlFutakeCoId = ?, 
       namaFutakeCoId = ?, 
       tahap2 = ? 
   WHERE namaProduct = ?`,
          [originalName, urlNow, namaProduct, 1, product], // 1 = true untuk tinyint
          (err) => {
            if (err) {
              console.error("❌ Gagal update DB:", err);
            } else {
              console.log("📝 Update DB:", namaProduct, "->", originalName);
            }
          }
        );
      } catch (err) {
        console.log(`gagal di id ${id} dan nama product ${product}`);

        console.error("❌ Gagal download:", imageUrl, err.message);
        console.error(err);
        throw new Error();
      }
    }
    await newTab.close();
  } catch (e) {
    console.error(e);
  } finally {
    if (!newTab.isClosed()) await newTab.close();
  }
}

function dbProductNone(product) {
  db.query(
    "UPDATE product SET rootProductNone = ?  WHERE namaProduct = ?",
    [true, product],
    (err) => {
      if (err) {
        console.error("❌ Gagal update DB:", err);
        console.log(`gagal di id ${id} dan nama product ${product}`);
      } else {
        console.log("📝 Update DB:", product, "-> root product none");
      }
    }
  );
}
