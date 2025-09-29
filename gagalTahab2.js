import puppeteer from "puppeteer";
import { newTabFutake } from "./newTabFutake.js";
import db from "./db.js";

let dataMasihAda = true;

const browser = await puppeteer.launch({
  headless: false,
});

while (dataMasihAda) {
  try {
    await main();
  } catch (error) {
    dataMasihAda = false;
    console.error(error);
  }
}

async function main() {
  // Gunakan promise agar bisa await
  const [results] = await db
    .promise()
    .query("SELECT No, namaProduct FROM product WHERE tahap2=0");
  console.log(results);
  console.log(results.length);

  if (results.length === 0) {
    dataMasihAda = false;
    console.log("✅ Semua data sudah selesai");
    return;
  }

  // Proses satu per satu secara urut
  for (const item of results) {
    console.log("Memproses:", item.namaProduct, " id ", item.No);

    // Panggil Puppeteer
    await newTabFutake(browser, item.namaProduct, item.No);

    // Tandai sudah selesai
    await db
      .promise()
      .query("UPDATE product SET tahap2=1 WHERE No=?", [item.No]);
    console.log("✅ Selesai:", item.namaProduct);
  }
}
