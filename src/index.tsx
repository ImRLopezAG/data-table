import { serve } from "bun";
import index from "./index.html";
import { fakeCommits } from '@services/commit'

const server = serve({
  port: 3000,
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
    "/api/commits": async (req) => {
      const { searchParams } = new URL(req.url);
      const count = searchParams.get("count") ?? 10;
      return Response.json({
        data: fakeCommits(Number(count))
      });
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
