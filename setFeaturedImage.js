import puppeteer from "puppeteer";
import path from "path";
import {
  hapusAngkaAkhir,
  hapusAngkaAkhirExt,
  hapusResolusiWp,
} from "./hapusAkhirAngka.js";
import { ambilAkiranUrl } from "./ambilAkhiranUrl.js";
import db from "./db.js";
import { membandingkanImage } from "./membandingkanImage.js";

const WP_URL = "https://futakedrain.com/wp-admin";
const WP_USER = "Tim Futake"; // ganti
const WP_PASS = "&s(yKs7S$NZOMuw*@aGvpoUX"; // ganti
const IMAGE_DIR = path.resolve("./webpImages"); // folder tempat gambar

export async function setFeaturedImage(
  page,
  postId,
  imageFilename,
  productName = ""
) {
  try {
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

    //   apakah ada featured images
    const hasFeaturedImage = (await page.$("#set-post-thumbnail img")) !== null;

    if (hasFeaturedImage) {
      console.log("⚠️ Featured image sudah ada, skip upload");
      updateDatabaseTahap3(postId);
    } else {
      // Buka panel Featured Image
      console.log("Buka panel Featured Image");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const featuredSelector = "#set-post-thumbnail";
      await page.waitForSelector(featuredSelector, { visible: true });
      await new Promise((resolve) => setTimeout(resolve, 500));

      await page.click(featuredSelector);

      // Tunggu modal media upload muncul
      console.log("Tunggu modal media upload muncul");
      await page.waitForSelector(".media-frame", { visible: true });
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      // Tunggu upload selesai
      console.log("⏳ Tunggu upload selesai...");
      await page.waitForSelector(".attachments .attachment.uploading", {
        hidden: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Ambil attachment pertama
      console.log("📷 Cek attachment pertama...");
      const firstAttachment = await page.$(
        ".attachments .attachment:first-child"
      );

      // Cek aria-checked
      let isChecked = await page.evaluate(
        (el) => el.getAttribute("aria-checked"),
        firstAttachment
      );

      if (isChecked !== "true") {
        console.log("⚠️ Attachment belum terpilih, klik dulu");
        await firstAttachment.click();
      } else {
        console.log("✅ Attachment sudah terpilih otomatis");
      }

      // Tunggu ALT text siap
      console.log("Tunggu ALT text siap");
      await page.waitForSelector("#attachment-details-alt-text", {
        visible: true,
      });
      await page.waitForFunction(
        (selector) => !document.querySelector(selector).disabled,
        {},
        "#attachment-details-alt-text"
      );
      if (productName) {
        await page.type("#attachment-details-alt-text", productName, {
          delay: 20,
        });
      } else {
        await page.type("#attachment-details-alt-text", fileName, {
          delay: 20,
        });
      }

      // Klik tombol Set Featured Image
      console.log(" Klik tombol Set Featured Image");
      await page.click(".media-button-select");

      // Tunggu modal tertutup
      await page.waitForSelector(".media-modal", { hidden: true });

      // Tunggu thumbnail muncul di postimagediv
      console.log("⏳ Tunggu featured image muncul di editor...");
      await page.waitForSelector("#set-post-thumbnail img", { visible: true });

      console.log("✅ Featured image sudah muncul di editor");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const imageSrc = await page.$eval("#set-post-thumbnail img", (el) =>
        el.getAttribute("src")
      );

      membandingkanImage(imageSrc, imageFilename);

      await page.waitForSelector("#publish", { visible: true });

      await page.waitForFunction(
        () => !document.querySelector("#publish").disabled
      );

      await page.waitForSelector(".media-modal-backdrop", { hidden: true });

      await page.evaluate(() => {
        document.querySelector("#publish").click();
      });

      console.log("✅ Post updated successfully");

      console.log(`✅ Featured image set and post published: ${imageFilename}`);
      await page.waitForNavigation({ waitUntil: "networkidle2" });
      await updateDatabaseTahap3(postId);
    }
  } catch (error) {
    console.log(error);
    console.log("post id " + postId);
  }
}

function updateDatabaseTahap3(idPost) {
  db.query(
    "UPDATE product SET tahap3 = ? WHERE No = ?",
    [true, idPost],
    (err) => {
      if (err) {
        console.error("❌ Gagal update DB:", err);
      } else {
        console.log("📝 Update DB:", idPost, "-> Berhasil");
      }
    }
  );
}

// const browser = await puppeteer.launch({
//   headless: false,
//   slowMo: 50,
//   defaultViewport: null,
// });

// // Contoh pemanggilan
// setFeaturedImage(browser, 6753, "manhole-bogor-badak.webp");
