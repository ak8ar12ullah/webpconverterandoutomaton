import path from "path";

export function nameWithoutExt(filename) {
  return path.basename(filename, path.extname(filename));
}
