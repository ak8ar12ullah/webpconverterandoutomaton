import puppeteer from "puppeteer";
import path from "path";
import { hapusAngkaAkhir } from "./hapusAkhirAngka.js";

const WP_URL = "http://localhost/futake/wp-admin";
const WP_USER = "Futake"; // ganti
const WP_PASS = "@Futake12345"; // ganti
const IMAGE_DIR = path.resolve("./savedImages"); // folder tempat gambar

async function setFeaturedImage(postId, imageFilename) {
  const browser = await puppeteer.launch({
    headless: false, // tampilkan browser
    // slowMo: 40, // kasih delay antar aksi biar kelihatan (ms)
    defaultViewport: null, // biar fullscreen, opsional
  });
  const page = await browser.newPage();

  // Masuk wp-admin
  await page.goto(WP_URL, { waitUntil: "networkidle2" });

  // Cek apakah sudah login
  const loggedIn = await page.$("#wpadminbar");
  if (!loggedIn) {
    // Login
    await page.type("#user_login", WP_USER);
    await page.type("#user_pass", WP_PASS);
    await page.click("#wp-submit");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("✅ Logged in WordPress");
  } else {
    console.log("⚠ Already logged in, skip login");
  }

  // Masuk ke edit post
  const editUrl = `${WP_URL}/post.php?post=${postId}&action=edit`;
  await page.goto(editUrl, { waitUntil: "networkidle2" });

  // Buka panel Featured Image
  const featuredSelector = "#set-post-thumbnail"; // tombol "Set featured image"
  await page.waitForSelector(featuredSelector, { visible: true });
  await page.click(featuredSelector);

  //   // Tunggu modal media upload muncul
  await page.waitForSelector(".media-frame", { visible: true });

  // Pilih tab "Upload Files"
  //   await page.click(".media-menu-item:has-text('Upload Files')");
  await page.click("#menu-item-upload");

  // Upload file
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(path.join(IMAGE_DIR, imageFilename));

  const nonExt = path.basename(imageFilename, path.extname(imageFilename));
  const fileName = hapusAngkaAkhir(nonExt);

  await page.waitForSelector("#attachment-details-alt-text", { visible: true });

  //   await page.waitForFunction(
  //     (selector) => {
  //       const el = document.querySelector(selector);
  //       return el && !el.disabled;
  //     },
  //     {},
  //     "#attachment-details-alt-text"
  //   );
  await page.waitForSelector(".attachments .attachment", { visible: true });

  console.log(fileName);
  setTimeout(() => {}, 2000); // hanya delay, tidak ada aksi

  //   await page.$eval(
  //     "#attachment-details-alt-text",
  //     (el, value) => {
  //       el.value = value;
  //       el.dispatchEvent(new Event("input", { bubbles: true }));
  //       el.dispatchEvent(new Event("change", { bubbles: true }));
  //     },
  //     fileName
  //   );

  //   // Tunggu upload selesai
  await page.waitForSelector(".attachments .attachment", { visible: true });

  await page.waitForFunction(
    (name) => !!document.querySelector(`li.attachment[aria-label="${name}"]`),
    {},
    nonExt
  );

  //   // Cek apakah sudah dicentang
  //   const isChecked = await attachment.evaluate(
  //     (el) => el.getAttribute("aria-checked") === "true"
  //   );

  //   if (!isChecked) {
  //     // klik tombol check jika belum dicentang
  //     const btn = await attachment.$("button.check");
  //     if (btn) await btn.click();
  //     console.log("✅ Item dicentang:", imageFilename);
  //   } else {
  //     console.log("⚠ Item sudah dicentang, skip klik:", imageFilename);
  //   }

  //   penting

  //   const attachment = await page.$(`li.attachment[aria-label="${nonExt}"]`);
  //   if (!attachment) {
  //     console.error("⚠ Attachment tidak ditemukan:", nonExt);
  //     // throw Error(imageFilename);
  //     return;
  //   }

  await page.type("#attachment-details-alt-text", fileName, {
    delay: 50,
  });

  //   setTimeout(() => {}, 2000); // hanya delay, tidak ada aksi

  // Klik tombol "Set featured image"
  await page.click(".media-button-select");
  //   setTimeout(() => {}, 2000); // hanya delay, tidak ada aksi

  await page.evaluate(() => document.querySelector("#publish").click());

  //   // Tunggu spinner muncul (class 'is-active') — opsional, jika spinner muncul dengan delay
  //   await page
  //     .waitForSelector(".spinner.is-active", { visible: true, timeout: 5000 })
  //     .catch(() => {
  //       console.log("⚠ Spinner tidak muncul, lanjut...");
  //     });

  //   // Tunggu spinner hilang (tanda proses selesai)
  //   await page.waitForFunction(() => {
  //     const spinner = document.querySelector(".spinner");
  //     return spinner && !spinner.classList.contains("is-active");
  //   });
  //   console.log("✅ Update selesai, spinner hilang");

  //   await page.click("#publish");

  console.log(`✅ Featured image set: ${imageFilename}`);

  // Tutup browser
  //   await browser.close();
}

// Contoh pemanggilan
setFeaturedImage(2232, "Frame-223-1-4.png");




tidak bisa memilih image pertama
tidak bisa publish