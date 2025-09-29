import { membandingkanImage } from "./membandingkanImage.js";
import db from "./db.js";

export default async function checkImageTahap3(
  browser,
  No,
  webgoto,
  imageFileName
) {
  const page = await browser.newPage();

  try {
    await page.goto(webgoto, {
      waitUntil: "networkidle2",
    });

    // Cek dan ambil src gambar kalau ada
    const imageSrc = await page.$eval(".xpro-featured-image", (el) => {
      const img = el.querySelector("img");
      return img ? img.getAttribute("src") : null;
    });

    if (imageSrc) {
      console.log("✅ Ada image:", imageSrc);
      membandingkanImage(imageSrc, imageFileName);
      // Tandai sudah selesai
      console.log(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ UPLOAD LAST DATABASE ITEM"
      );
      await db
        .promise()
        .query("UPDATE product set lastCheck=? WHERE No=?", [true, No]);
      console.log("✅ Selesai");
    } else {
      console.log("❌ Tidak ada image di dalam div .xpro-featured-image");
      new Error("image tidak ada");
    }
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    await page.close();
  } catch (e) {
    throw new Error(e);
  } finally {
    if (!page.isClosed()) await page.close();
  }
}
