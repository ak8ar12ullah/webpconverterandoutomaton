import readline from "readline";
import puppeteer from "puppeteer";
import scrapingFutakeCoId from "./scarpingFutakeCoId.js";
import db from "./db.js";

import { downloadImage } from "./downloadImage.js";
import path from "path";
import { nameWithoutExt } from "./menghilangkanExtensi.js";
import { convertToWebP } from "./convertWebp.js";

// const browser = await puppeteer.launch({
//   headless: false, // tampilkan browser
//   slowMo: 7, // kasih delay antar aksi biar kelihatan (ms)
// });
// const page = await browser.newPage();

const query = // "select * from product where rootProductNone = 1 and tahap3 = 0 and menyerah = 0"
  // "select * from product where namaProduct != namaFutakeCoId and menyerah = 0 and gambarWebP is null";
  "select * from product where tahap2 = 0 and gambarWebP is null";

// Buat interface untuk input dari CMD
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let selesai = false;

while (!selesai) {
  try {
    console.log("main");
    await main();
  } catch (error) {
    selesai = true;
    rl.close();
    console.error(error);
  }
}

async function main() {
  const [results] = await db.promise().query(query);

  if (results.length === 0) {
    console.log("data tidak ditemukan");
    selesai = true;
    rl.close();
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const datas = results[i];

    const urlGoogle = productToGoogleLink(datas.namaProduct);
    const urlFutake = productToFutakeLink(datas.namaProduct);
    console.log(
      `#################################################################################################

    TOLONG CARIKAN IMAGE PRODUCT DISINI
    ------------------------------------------------------------------- \n
    ${urlFutake}
    \n
    ------------------------------------------------------------------- \n
    ${urlGoogle}
    \n
    `
    );

    let urlfutakenone = true;
    let urlgambarnone = true;

    if (datas.gambarWebP) {
      console.log("data sudah ada");
      urlfutakenone = false;
      urlgambarnone = false;
    }

    // if (urlfutakenone) {
    //   // Tanya url futake
    //   const urlfutake = await questionAsync("Masukkan url futake: ");
    //   if (urlfutake) {
    //     urlfutakenone = false;
    //     urlgambarnone = false;
    //     console.log("URL futake diterima:", urlfutake);
    //     console.log("mulai scraping futake.co.id");
    //     await scrapingFutakeCoId(page, datas.namaProduct, datas.No, urlfutake);
    //   }
    // }

    // Tanya url gambar jika masih none
    if (urlgambarnone) {
      const urlgambar = await questionAsync("Masukkan url gambar: ");
      if (urlgambar) {
        urlgambarnone = false;
        console.log("URL gambar diterima:", urlgambar);

        const originalName = path.basename(new URL(urlgambar).pathname);
        const originalNameNonExt = nameWithoutExt(originalName);

        // Download gambar
        await downloadImage(urlgambar, originalName);
        console.log("✅ Download:", originalName);

        try {
          const inputPath = path.join("./savedImages", originalName);

          // tanpa resize, tanpa ubah kualitas (default quality=80)
          const webpPath = await convertToWebP(inputPath, "./webpImages/");
          console.log("✅ Konversi tanpa resize:", webpPath);
          await queryAsync(
            "UPDATE product SET gambarWebP = ?, converSuccess=?,tahap2 = ?, UrlGambar=?   WHERE No = ?",
            [`${originalNameNonExt}.webp`, true, 1, urlgambar, datas.No],
            datas,
            originalName
          );
        } catch (err) {
          console.error("❌ Gagal konversi:", err);
          console.log(
            `gagal di id ${datas.No} dan nama product ${datas.namaProduct}`
          );
        }
      }
    }

    if (urlgambarnone && urlfutakenone) {
      console.log("menyerah");
      await db
        .promise()
        .query("update product set menyerah = 1 where No = ?", [datas.No]);
    }

    console.log(
      `#################################################################################################`
    );
  }
}

async function queryAsync(sql, params, datas, originalName) {
  try {
    await db.promise().query(sql, params);
    console.log("📝 Update DB:", datas.namaProduct, "->", originalName);
  } catch (err) {
    console.error("❌ Gagal update DB:", err);
    console.log(
      `gagal di id ${datas.No} dan nama product ${datas.namaProduct}`
    );
  }
}

function productToGoogleLink(productName) {
  // Encode agar spasi dan karakter khusus aman di URL
  const encodedName = encodeURIComponent(productName);
  // Buat URL Google Search
  return `https://www.google.com/search?tbm=isch&q=${encodedName}`;
}

function productToFutakeLink(productName) {
  // Encode agar spasi dan karakter khusus aman di URL
  const encodedName = encodeURIComponent(productName);
  // Buat URL Google Search
  return `https://futake.co.id/?s=${encodedName}&post_type=product`;
}

// buat versi question yang return Promise
function questionAsync(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}
