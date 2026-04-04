type UploadedMediaLike = {
  mediaType: string;
};

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildUploadNotificationContent(input: {
  uploaderName: string;
  category: string;
  media: UploadedMediaLike[];
}) {
  const imageCount = input.media.filter((item) => item.mediaType === "image").length;
  const videoCount = input.media.filter((item) => item.mediaType === "video").length;

  let uploadLabel = pluralize(input.media.length, "file", "files");

  if (imageCount > 0 && videoCount === 0) {
    uploadLabel = pluralize(imageCount, "image", "images");
  } else if (videoCount > 0 && imageCount === 0) {
    uploadLabel = pluralize(videoCount, "video", "videos");
  }

  return {
    title: "New upload finished",
    message: `${input.uploaderName} uploaded ${uploadLabel} in ${input.category}.`,
  };
}
