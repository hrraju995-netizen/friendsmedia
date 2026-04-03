import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Friends Media",
    short_name: "Friends Media",
    description: "A private shared gallery for friends and family.",
    start_url: "/gallery",
    display: "standalone",
    background_color: "#f5eedf",
    theme_color: "#214D42",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["photo", "social", "lifestyle"],
    lang: "en",
  };
}
