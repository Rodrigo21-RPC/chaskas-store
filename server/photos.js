import sharp from "sharp";
import { HttpError } from "./errors.js";
export async function verifyPhoto(
  file,
  { maxBytes = 5000000, maxPixels = 25000000 } = {},
) {
  const invalid = () =>
    new HttpError(
      415,
      "INVALID_PHOTO",
      "Selecciona una foto JPG, PNG o WebP válida.",
      {
        photo: [
          "La foto no es válida. Usa JPG, PNG o WebP de hasta 5 MB y 25 millones de píxeles.",
        ],
      },
    );
  if (!file?.buffer?.length) throw invalid();
  const bytes = file.buffer;
  if (bytes.length > maxBytes)
    throw new HttpError(
      413,
      "PHOTO_TOO_LARGE",
      "La foto debe pesar como máximo 5 MB.",
      { photo: ["La foto supera los 5 MB."] },
    );
  const format = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? "png"
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "jpeg"
      : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP"
        ? "webp"
        : null;
  if (!format) throw invalid();
  try {
    const image = sharp(bytes, {
      limitInputPixels: maxPixels,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== format ||
      metadata.width * metadata.height > maxPixels
    )
      throw invalid();
    await image.stats();
    return { bytes, mime: `image/${format}` };
  } catch {
    throw invalid();
  }
}
