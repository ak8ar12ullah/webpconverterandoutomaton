export function hapusAngkaAkhir(kalimat) {
  return kalimat.replace(/-(\d+)$/, (match, angka) => {
    return parseInt(angka, 10) < 1900 ? "" : match;
  });
}

console.log(hapusAngkaAkhir("sejarah-1899")); // "sejarah"
console.log(hapusAngkaAkhir("sejarah-1900")); // "sejarah-1900"
console.log(hapusAngkaAkhir("film-2023")); // "film-2023"
console.log(
  hapusAngkaAkhir(
    "manhole-cover-kpm-buaran-abadi-dak-sanitasi-kabupaten-cirebon-2017-2"
  )
);
