export function ambilAkiranUrl(url) {
  return url.replace(/\/$/, "").split("/").pop();
}
