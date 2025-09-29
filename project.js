import puppeteer from "puppeteer";
import db from "./db.js";
import { newTabFutake } from "./newTabFutake.js";

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // tampilkan browser
    // slowMo: 200, // kasih delay antar aksi biar kelihatan (ms)
    // defaultViewport: null, // biar fullscreen, opsional
  });
  const page = await browser.newPage();

  // buka halaman target
  await page.goto("https://futakedrain.com/produk/manhole-cover-besi-cor/", {
    waitUntil: "networkidle2",
  });

  let hasMore = true;
  let loadKe = 0;

  while (hasMore) {
    loadKe += 1;
    // ambil artikel yang tidak ada img dan ada h2
    const articles = await page.$$eval("article[data-id]", (nodes) =>
      nodes
        .filter((article) => {
          const hasImg = article.querySelector("img");
          const h2 = article.querySelector("h2");
          return h2 && !hasImg;
        })
        .map((article) => {
          const h2 = article.querySelector("h2");
          const a = h2.querySelector("a");
          return {
            dataId: article.getAttribute("data-id"),
            title: h2.innerText.trim(),
            url: a ? a.href : null,
          };
        })
    );

    // simpan ke database
    for (const item of articles) {
      db.query(
        "SELECT 1 FROM product WHERE UrlFutakeDrain = ?",
        [item.url],
        (err, results) => {
          if (err) return console.error(err);
          if (results.length === 0) {
            db.query(
              "SELECT 1 FROM product WHERE namaProduct = ?",
              [item.title],
              (err, results) => {
                if (err) return console.error(err);
                if (results.length === 0) {
                  db.query(
                    "INSERT INTO product (No, namaProduct, idTag, UrlFutakeDrain) VALUES (?,?,1,?)",
                    [item.dataId, item.title, item.url],
                    async (err, result) => {
                      if (err) console.error(err);
                      else console.log("✅ Simpan:", item.title);
                      await newTabFutake(browser, item.title, result.insertId);
                    }
                  );
                } else {
                  db.query(
                    "INSERT INTO product (idKarenaSama, idTag, UrlFutakeDrain) VALUES (,1,?)",
                    [results[0].No, item.url],
                    (err) => {
                      if (err) console.error(err);
                      else console.log("✅ Simpan:", item.title);
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
      timeout: 5000,
    });

    // tunggu tombol kembali normal (Load More muncul lagi)
    await page.waitForSelector(
      "button.eael-load-more-button:not(.button--loading)",
      { timeout: 10000 }
    );

    // kasih jeda sebentar biar artikel baru sempat render
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  await browser.close();
  db.end();
})();
