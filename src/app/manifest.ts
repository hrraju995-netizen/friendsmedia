import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Friends Media",
    short_name: "Friends Media",
    description: "A private shared gallery for friends and family.",
    id: "/",
    start_url: "/gallery",
    display: "standalone",
    background_color: "#f5eedf",
    theme_color: "#214D42",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["photo", "social", "lifestyle"],
    lang: "en",
  };
}
