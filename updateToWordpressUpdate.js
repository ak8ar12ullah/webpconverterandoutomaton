import puppeteer from "puppeteer";
import path from "path";
import { hapusAngkaAkhir } from "./hapusAkhirAngka.js";

const WP_URL = "http://localhost/futake/wp-admin";
const WP_USER = "Futake"; // ganti
const WP_PASS = "@Futake12345"; // ganti
const IMAGE_DIR = path.resolve("./savedImages"); // folder tempat gambar

async function setFeaturedImage(postId, imageFilename) {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  // Login jika belum
  await page.goto(WP_URL, { waitUntil: "networkidle2" });
  const loggedIn = await page.$("#wpadminbar");
  if (!loggedIn) {
    await page.type("#user_login", WP_USER);
    await page.type("#user_pass", WP_PASS);
    await page.click("#wp-submit");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("✅ Logged in WordPress");
  } else {
    console.log("⚠ Already logged in, skip login");
  }

  // Masuk ke edit post
  console.log("Masuk ke edit post");
  const editUrl = `${WP_URL}/post.php?post=${postId}&action=edit`;
  await page.goto(editUrl, { waitUntil: "networkidle2" });

  // Buka panel Featured Image
  console.log("Buka panel Featured Image");
  const featuredSelector = "#set-post-thumbnail";
  await page.waitForSelector(featuredSelector, { visible: true });
  await page.click(featuredSelector);

  // Tunggu modal media upload muncul
  console.log("Tunggu modal media upload muncul");
  await page.waitForSelector(".media-frame", { visible: true });

  // Pilih tab Upload Files
  console.log("Pilih tab Upload Files");
  await page.click("#menu-item-upload");

  // Upload file
  console.log("Upload file");
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(path.join(IMAGE_DIR, imageFilename));

  const nonExt = path.basename(imageFilename, path.extname(imageFilename));
  const fileName = hapusAngkaAkhir(nonExt);

  // Tunggu attachment muncul
  console.log("Tunggu attachment muncul");
  await page.waitForSelector(".attachments .attachment", { visible: true });

  //   // Pilih attachment terbaru (paling akhir)
  //   console.log("Pilih attachment terbaru (paling akhir)");
  //   const attachments = await page.$$(".attachments .attachment");
  //   const lastAttachment = attachments[attachments.length - 1];
  //   await lastAttachment.click();

  // Tunggu ALT text siap
  console.log("Tunggu ALT text siap");
  await page.waitForSelector("#attachment-details-alt-text", { visible: true });
  await page.waitForFunction(
    (selector) => !document.querySelector(selector).disabled,
    {},
    "#attachment-details-alt-text"
  );
  await page.type("#attachment-details-alt-text", fileName, { delay: 70 });

  // Klik tombol Set Featured Image
  console.log(" Klik tombol Set Featured Image");
  await page.click(".media-button-select");

  // // Tunggu tombol Publish aktif
  // console.log("Tunggu tombol Publish aktif");
  // await page.waitForSelector("#publish", { visible: true });
  // await page.waitForFunction(
  //   () => !document.querySelector("#publish").disabled
  // );
  // await page.click("#publish");

  //   await page.waitForSelector("#publish", { visible: true });
  //   await page.waitForFunction(
  //     () => !document.querySelector("#publish").disabled
  //   );

  console.log("tunggu");
  await page.waitForSelector("#publish", { visible: true });
  console.log("tunggu");

  await page.waitForFunction(
    () => !document.querySelector("#publish").disabled
  );
  console.log("tunggu");

  await page.waitForSelector(".media-modal-backdrop", { hidden: true });
  console.log("tunggu");

  await page.evaluate(() => {
    document.querySelector("#publish").click();
  });
  console.log("tunggu");

  console.log("✅ Post updated successfully");

  await page.evaluate(() => {
    document.querySelector("#publish").click();
  });

  console.log(`✅ Featured image set and post published: ${imageFilename}`);

  //   await browser.close();
}

// Contoh pemanggilan
setFeaturedImage(2232, "manhole-kebumen-2016.png");
