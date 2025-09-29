import path from "path";

export function nameWithoutExt() {
  return path.basename(filename, path.extname(filename));
}
