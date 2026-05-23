import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Task Management",
    short_name: "TaskFlow",
    description: "A beautiful and efficient task management and planner application.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#8b5cf6",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

