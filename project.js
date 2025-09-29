import puppeteer from "puppeteer";
import db from "./db.js";
import { newTabFutake } from "./newTabFutake.js";

const webscrap = "https://futakedrain.com/produk/grill-saluran-air/";
const kategori = 2;

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // tampilkan browser
    // slowMo: 200, // kasih delay antar aksi biar kelihatan (ms)
    // defaultViewport: null, // biar fullscreen, opsional
  });
  const page = await browser.newPage();

  // buka halaman target
  await page.goto(webscrap, {
    waitUntil: "networkidle2",
  });

  // Ambil ID yang sudah ada di database
  const [existingIds] = await db.promise().query("SELECT No FROM product");
  const processedIds = new Set(existingIds.map((r) => r.No));

  console.log("✅ Existing IDs:", processedIds);

  page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.resourceType() === "image") {
      req.abort(); // batalkan request gambar
    } else {
      req.continue(); // teruskan request lainnya (JS, CSS, dll)
    }
  });

  let hasMore = true;
  let loadKe = 0;

  while (hasMore) {
    loadKe += 1;
    console.log("mulai");
    // ambil artikel yang tidak ada img dan ada h2
    // const articles = await page.$$eval(
    //   "article[data-id]",
    //   (nodes, processedIdsArray) =>
    //     nodes
    //       .filter((article) => {
    //         const hasImg = article.querySelector("img");
    //         const h2 = article.querySelector("h2");
    //         return h2 && !hasImg && !processedIds.has(dataId);
    //       })
    //       .map((article) => {
    //         const h2 = article.querySelector("h2");
    //         const a = h2.querySelector("a");
    //         const dataId = article.getAttribute("data-id");
    //         processedIds.add(dataId);
    //         return {
    //           dataId,
    //           title: h2.innerText.trim(),
    //           url: a ? a.href : null,
    //         };
    //       }),
    //   Array.from(processedIds)
    // );
    const articles = await page.$$eval(
      "article[data-id]",
      (nodes, processedIdsArray) => {
        const processedSet = new Set(processedIdsArray);
        return nodes
          .filter((article) => {
            const h2 = article.querySelector("h2");
            const img = article.querySelector("img");
            const dataId = Number(article.getAttribute("data-id"));
            return h2 && !img && !processedSet.has(dataId);
          })
          .map((article) => {
            const h2 = article.querySelector("h2");
            const a = h2.querySelector("a");
            return {
              dataId: Number(article.getAttribute("data-id")),
              title: h2.innerText.trim(),
              url: a ? a.href : null,
            };
          });
      },
      Array.from(processedIds)
    );

    // simpan ke database
    for (const item of articles) {
      try {
        db.query(
          "SELECT No FROM product WHERE UrlFutakeDrain = ?",
          [item.url],
          (err, results) => {
            if (err) return console.error(err);
            if (results.length === 0) {
              db.query(
                "SELECT No FROM product WHERE namaProduct = ?",
                [item.title],
                (err, results) => {
                  if (err) return console.error(err);
                  if (results.length === 0) {
                    db.query(
                      "INSERT INTO product (No, namaProduct, idTag, UrlFutakeDrain, tahap1) VALUES (?,?,?,?,?)",
                      [item.dataId, item.title, kategori, item.url, true],
                      async (err, result) => {
                        if (err) console.error(err);
                        else {
                          console.log("✅ Simpan:", item.title);
                          processedIds.add(item.dataId);
                        }
                        await newTabFutake(
                          browser,
                          item.title,
                          result.insertId
                        );
                      }
                    );
                  } else {
                    db.query(
                      "INSERT INTO product (No, namaProduct,idKarenaSama, idTag, UrlFutakeDrain, tahap1) VALUES (?,?,?,?,?,?)",
                      [
                        item.dataId,
                        item.title,
                        results[0].No,
                        kategori,
                        item.url,
                        true,
                      ],
                      (err, result) => {
                        if (err) console.error(err);
                        else {
                          console.log(result);
                          console.log("✅ Simpan:", item.title);
                          processedIds.add(item.dataId);
                        }
                      }
                    );
                    console.log("ternyata duplikasi : ", item.title);
                  }
                }
              );
            } else {
              console.log("⚠ Sudah ada, skip: ", item.title);
            }
          }
        );
      } catch (error) {
        await browser.close();
      }
    }

    // cari tombol load more
    const loadMoreBtn = await page.$("button.eael-load-more-button");
    if (!loadMoreBtn) {
      console.log("⚠ Tidak ada tombol Load More lagi, berhenti.");
      hasMore = false;
      break;
    }

    // klik tombol load more
    console.log("➡ Klik tombol Load More..." + "load ke " + loadKe);
    await loadMoreBtn.click();

    // tunggu tombol masuk ke state loading
    await page.waitForSelector("button.eael-load-more-button.button--loading", {
      timeout: 60000,
    });

    // tunggu tombol kembali normal (Load More muncul lagi)
    await page.waitForSelector(
      "button.eael-load-more-button:not(.button--loading)",
      { timeout: 60000 }
    );

    // kasih jeda sebentar biar artikel baru sempat render
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  await browser.close();
  db.end();
})();
