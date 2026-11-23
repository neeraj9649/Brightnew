import type { MetadataRoute } from "next";

// Shown when the site is added to a phone's home screen. Uses the Bright Wings logo (public/BrightLogo.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bright Wings Travel & Tourism",
    short_name: "Bright Wings",
    description: "Dubai tours, holidays, flights, hotels and visas with Bright Wings Travel & Tourism.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f7921e",
    icons: [
      {
        src: "/BrightLogo.png",
        sizes: "631x516",
        type: "image/png",
      },
    ],
  };
}
