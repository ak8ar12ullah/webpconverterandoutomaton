import puppeteer from "puppeteer";
import { scrapeGoogleImages } from "./scrapeGoogleImages.js";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("//www.google.com/search?q=hello", {
    waitUntil: "networkidle2",
  });

  // contoh search
  // await page.type('input[name="q"]', "manhole cover", { delay: 50 });
  // await page.keyboard.press("Enter");
  // await page.waitForNavigation({ waitUntil: "networkidle2" });

  const images = await scrapeGoogleImages(page, 50, 500);
  console.log("Ditemukan gambar:", images.length);
  console.log(images);

  await browser.close();
})();
