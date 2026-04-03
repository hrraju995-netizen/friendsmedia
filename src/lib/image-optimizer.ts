import sharp from "sharp";

type OptimizeImageUploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

type OptimizeImageUploadResult = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  originalSize: number;
  outputSize: number;
  optimized: boolean;
};

const webpConvertibleMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function replaceFileExtension(fileName: string, extension: string) {
  const extIndex = fileName.lastIndexOf(".");

  if (extIndex < 0) {
    return `${fileName}${extension}`;
  }

  return `${fileName.slice(0, extIndex)}${extension}`;
}

export async function optimizeImageForUpload(input: OptimizeImageUploadInput): Promise<OptimizeImageUploadResult> {
  if (!webpConvertibleMimeTypes.has(input.mimeType)) {
    return {
      buffer: input.buffer,
      fileName: input.fileName,
      mimeType: input.mimeType,
      originalSize: input.buffer.length,
      outputSize: input.buffer.length,
      optimized: false,
    };
  }

  const pipeline = sharp(input.buffer, { failOn: "error" }).rotate();
  const optimizedBuffer = await pipeline
    .webp({
      quality: input.mimeType === "image/png" ? 92 : 86,
      nearLossless: input.mimeType === "image/png",
      smartSubsample: input.mimeType !== "image/png",
      effort: 4,
    })
    .toBuffer();

  if (optimizedBuffer.length >= input.buffer.length) {
    return {
      buffer: input.buffer,
      fileName: input.fileName,
      mimeType: input.mimeType,
      originalSize: input.buffer.length,
      outputSize: input.buffer.length,
      optimized: false,
    };
  }

  return {
    buffer: optimizedBuffer,
    fileName: replaceFileExtension(input.fileName, ".webp"),
    mimeType: "image/webp",
    originalSize: input.buffer.length,
    outputSize: optimizedBuffer.length,
    optimized: true,
  };
}
