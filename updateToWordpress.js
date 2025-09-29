import puppeteer from "puppeteer";
import { setFeaturedImage } from "./setFeaturedImage.js";
import checkImageTahap3 from "./checkImageTahap3.js";
import db from "./db.js";

const databaseQuery =
  "SELECT * FROM product WHERE tahap2 = 1 AND verification = 1 AND tahap3 = 0";
const browser = await puppeteer.launch({
  headless: false, // tampilkan browser
  slowMo: 7, // kasih delay antar aksi biar kelihatan (ms)
  defaultViewport: null, // biar fullscreen, opsional
});

const pageWpUpload = await browser.newPage();

let sampaiSelesai = true;

while (sampaiSelesai) {
  try {
    await main();
  } catch (error) {
    sampaiSelesai = false;
    console.error(error);
  }
}

// ini masih harus dirubah

async function main() {
  // Gunakan promise agar bisa await
  const [results] = await db.promise().query(databaseQuery);
  //   console.log(results);
  console.log(results.length);

  if (results.length === 0) {
    dataMasihAda = false;
    console.log("✅ Semua data sudah selesai");
    return;
  }

  // Proses satu per satu secara urut
  for (const item of results) {
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ MEMPROSES:",
      item.namaProduct,
      " id ",
      item.No
    );

    // memproses upload to wordpress
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ UPLOAD WORDPRESS SECTION"
    );
    await setFeaturedImage(pageWpUpload, item.No, item.gambarWebP);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // check tahap akhir image
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ LAST CHECK IMAGE PROYEK"
    );
    await checkImageTahap3(
      browser,
      item.No,
      item.UrlFutakeDrain,
      item.gambarWebP
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}
