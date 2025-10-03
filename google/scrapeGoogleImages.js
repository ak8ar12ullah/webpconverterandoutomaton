/**
 * Scrape Google Images: klik tiap thumbnail, ambil src asli
 * @param {import('puppeteer').Page} page
 * @param {number} limit - jumlah gambar maksimal
 * @param {number} delay - jeda antar klik (ms)
 * @returns {Promise<string[]>} array URL gambar asli
 */
async function scrapeGoogleImages(page, limit = 20, delay = 500) {
  const imageUrls = new Set();

  // tunggu semua thumbnails muncul
  await page.waitForSelector("img", { visible: true });

  // ambil semua thumbnail
  const thumbnails = await page.$$("img");

  for (let i = 0; i < thumbnails.length && imageUrls.size < limit; i++) {
    console.log("thumbnails ke" + i);
    try {
      const thumb = thumbnails[i];

      // scroll ke thumbnail biar visible
      await thumb.scrollIntoViewIfNeeded();

      // klik thumbnail
      await thumb.click({ delay: 100 });

      // tunggu preview muncul (cari img dengan src berbeda dari thumbnail kecil)
      await page.waitForTimeout(300); // jeda kecil sebelum ambil src

      // ambil semua src yang valid
      const urls = await page.$$eval("img", (imgs) =>
        imgs
          .map((img) => img.src)
          .filter(
            (src) =>
              src.startsWith("http") &&
              !src.includes("gstatic") &&
              !src.includes("encrypted-tbn")
          )
      );

      urls.forEach((url) => imageUrls.add(url));

      // jeda setengah detik sebelum klik berikutnya
      await page.waitForTimeout(delay);
    } catch (err) {
      console.warn("Gagal klik thumbnail ke-", i, err.message);
      continue;
    }
  }

  return Array.from(imageUrls);
}

export { scrapeGoogleImages };
