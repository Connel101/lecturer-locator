// Check the file signature rather than trusting the browser's content type.
export function isValidTimetableImage(bytes: unknown, contentType: string): bytes is Buffer {
  if (!Buffer.isBuffer(bytes) || bytes.length < 12 || bytes.length > 4 * 1024 * 1024) return false;
  switch (contentType) {
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/webp":
      return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    default:
      return false;
  }
}
