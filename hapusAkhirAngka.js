import path from "path";

export function hapusAngkaAkhir(kalimat) {
  return kalimat.replace(/-(\d+)$/, (match, angka) => {
    return parseInt(angka, 10) < 1900 ? "" : match;
  });
}

export function hapusAngkaAkhirExt(filename) {
  // Pisahkan nama file dan ekstensi
  const ext = path.extname(filename); // contoh: ".png"
  const name = path.basename(filename, ext); // contoh: "manhole-kebumen-2016"

  // Hapus angka di akhir nama (kalau <1900)
  const newName = name.replace(/-(\d+)$/, (match, angka) => {
    return parseInt(angka, 10) < 1900 ? "" : match;
  });

  // Gabungkan kembali dengan ekstensi
  return newName + ext;
}

export function hapusResolusiWp(filename) {
  const ext = path.extname(filename); // contoh: ".webp"
  const name = path.basename(filename, ext); // contoh: "grill-cover-malang-nilaya-300x300"

  // Hapus pola -123x123 di akhir
  const cleanName = name.replace(/-\d+x\d+$/, "");

  return cleanName + ext;
}
