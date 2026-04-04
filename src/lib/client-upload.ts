"use client";

type ApiPayload = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type OptimizeFilesResult = {
  files: File[];
  optimizedImageCount: number;
  oversizedImagesRemaining: number;
};

const TARGET_IMAGE_UPLOAD_BYTES = 3_500_000;
const MAX_IMAGE_DIMENSION = 2200;
const IMAGE_QUALITY_STEPS = [0.84, 0.78, 0.72, 0.66, 0.6] as const;

function replaceExtension(fileName: string, extension: string) {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex === -1) {
    return `${fileName}${extension}`;
  }

  return `${fileName.slice(0, dotIndex)}${extension}`;
}

function summarizeResponseText(text: string) {
  const withoutTags = text.replace(/<[^>]+>/g, " ");
  const normalized = withoutTags.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, 220);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not prepare this image for upload."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image on the device."));
    };

    image.src = objectUrl;
  });
}

async function optimizeImageFile(file: File) {
  if (!file.type.startsWith("image/") || file.size <= TARGET_IMAGE_UPLOAD_BYTES) {
    return {
      file,
      optimized: false,
    };
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return {
      file,
      optimized: false,
    };
  }

  context.drawImage(image, 0, 0, width, height);

  let smallestBlob: Blob | null = null;

  for (const quality of IMAGE_QUALITY_STEPS) {
    const nextBlob = await canvasToBlob(canvas, "image/webp", quality);

    if (!smallestBlob || nextBlob.size < smallestBlob.size) {
      smallestBlob = nextBlob;
    }

    if (nextBlob.size <= TARGET_IMAGE_UPLOAD_BYTES) {
      break;
    }
  }

  if (!smallestBlob || smallestBlob.size >= file.size) {
    return {
      file,
      optimized: false,
    };
  }

  return {
    file: new File([smallestBlob], replaceExtension(file.name, ".webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    }),
    optimized: true,
  };
}

export async function optimizeFilesForUpload(files: File[]): Promise<OptimizeFilesResult> {
  const results = await Promise.all(files.map((file) => optimizeImageFile(file)));
  const optimizedFiles = results.map((result) => result.file);

  return {
    files: optimizedFiles,
    optimizedImageCount: results.filter((result) => result.optimized).length,
    oversizedImagesRemaining: optimizedFiles.filter((file) => file.type.startsWith("image/") && file.size > TARGET_IMAGE_UPLOAD_BYTES).length,
  };
}

export async function readApiPayload(response: Response): Promise<ApiPayload> {
  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawText) as ApiPayload;
    } catch {
      return { error: "The server returned an unreadable JSON response." };
    }
  }

  try {
    return JSON.parse(rawText) as ApiPayload;
  } catch {
    const message = summarizeResponseText(rawText);
    return message ? { error: message } : {};
  }
}

export function getDefaultRequestError(status: number, fallback: string) {
  if (status === 0) {
    return "The request could not reach the server. Check your connection and try again.";
  }

  if (status === 413) {
    return "This upload is still too large for the hosted server. Try a smaller photo or fewer files at once.";
  }

  if (status >= 500) {
    return "The server hit an error while processing this request. Please try again.";
  }

  return fallback;
}
