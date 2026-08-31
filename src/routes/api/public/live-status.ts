import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/live-status")({
  server: {
    handlers: {
      GET: async () => {
        // In a real scenario, this would check YouTube API for live status
        // For now, we return a mock response that the frontend will use
        // The user can update this URL via a future admin setting
        return new Response(
          JSON.stringify({
            isLive: false,
            liveUrl: "https://www.youtube.com/@BatistaAtos/streams",
            title: "Culto de Celebração",
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
