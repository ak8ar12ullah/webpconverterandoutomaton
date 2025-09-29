import { hapusAngkaAkhirExt, hapusResolusiWp } from "./hapusAkhirAngka.js";
import { ambilAkiranUrl } from "./ambilAkhiranUrl.js";

function bersihkanText(input) {
  return hapusAngkaAkhirExt(
    hapusResolusiWp(hapusAngkaAkhirExt(ambilAkiranUrl(input)))
  );
}

export function membandingkanImage(urlImage, imageFilename) {
  const imageWp = bersihkanText(urlImage);
  const imageFileNameBsersih = bersihkanText(imageFilename);
  console.log("image file name " + imageFileNameBsersih);
  console.log("imageWp " + imageWp);
  if (imageWp !== imageFileNameBsersih) throw new Error("image berbeda");
  else console.log("############## - IMAGE SAMA - ##############");
}
