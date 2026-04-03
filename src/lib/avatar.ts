export function getAvatarSrc(userId: string, image: string | null | undefined) {
  if (!image) {
    return null;
  }

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }

  return `/api/users/${userId}/avatar`;
}

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "FM";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "FM";
}
