import puppeteer from "puppeteer";
import { setFeaturedImage } from "./setFeaturedImage.js";
import checkImageTahap3 from "./checkImageTahap3.js";
import db from "./db.js";

// const databaseQuery = `SELECT p1.No,
// p1.UrlFutakeDrain,
//        p1.namaProduct,
//        p1.idKarenaSama,
//        p2.gambarWebP AS gambarWebP
// FROM product p1
// JOIN product p2 ON p1.idKarenaSama = p2.No
// WHERE p1.idKarenaSama IS NOT NULL and p2.gambarWebP is not null and p2.verification = 1 and p1.tahap3 = 0;`;
const altProductName = false;
const databaseQuery =
  // "select * from product where rootProductNone = 1 and menyerah = 0 and gambarWebP is not null and tahap2 = 1 and tahap3 = 0";
  "select * from product where tahap2 = 1 and gambarWebP is not null =  tahap3 = 0;";
const browser = await puppeteer.launch({
  headless: false, // tampilkan browser
  slowMo: 25, // kasih delay antar aksi biar kelihatan (ms)
  defaultViewport: null, // biar fullscreen, opsional
});

const pageWpUpload = await browser.newPage();

await pageWpUpload.setRequestInterception(true);
await pageWpUpload.on("request", (req) => {
  if (req.resourceType() === "image") {
    req.abort(); // batalkan request gambar
  } else {
    req.continue(); // teruskan request lainnya (JS, CSS, dll)
  }
});

let dataMasihAda = true;

while (dataMasihAda) {
  try {
    await main();
  } catch (error) {
    dataMasihAda = false;
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
  let index = 0;
  // Proses satu per satu secara urut
  for (const item of results) {
    index++;
    console.log("Perulangan ke : " + index);
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
    await setFeaturedImage(
      pageWpUpload,
      item.No,
      item.gambarWebP,
      altProductName ? item.namaProduct : ""
    );
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
