import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/demo",
    name: "Abfall APP Pilot",
    short_name: "Abfall APP",
    description: "Interne, synthetische Vorführung der kommunalen Abfall APP.",
    start_url: "/demo",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#006d6a",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
