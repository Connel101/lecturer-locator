const MAX_SVG_BYTES = 4 * 1024 * 1024;

export function isValidSvgUpload(bytes: unknown): bytes is Buffer {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_SVG_BYTES) {
    return false;
  }

  const source = bytes.toString("utf8");
  // SVG editors commonly put an XML declaration and comments before the root.
  const startsWithSvg = /^(?:\uFEFF|\s|<\?xml[^>]*\?>|<!--[\s\S]*?-->)*<svg[\s>]/i.test(source);
  const unsafeMarkup = /<!DOCTYPE|<!ENTITY|<script[\s>]|\bon\w+\s*=/i.test(source);
  return startsWithSvg && !unsafeMarkup && /<\/svg\s*>\s*$/i.test(source);
}
