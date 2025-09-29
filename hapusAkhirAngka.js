export function hapusAngkaAkhir(kalimat) {
  return kalimat.replace(/-(\d+)$/, (match, angka) => {
    return parseInt(angka, 10) < 1900 ? "" : match;
  });
}
