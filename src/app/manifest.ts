import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wild Stallion Academy",
    short_name: "WSA",
    description: "Homeschool and outdoor education planning for families.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#26160f",
    theme_color: "#26160f",
    icons: [
      {
        src: "/wsa/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/wsa/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/wsa/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
