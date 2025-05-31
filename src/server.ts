import { fakeCommits } from "@/services/commit";
import { Hono } from "hono";
// import { McpIntegration } from './mcp';
// export { McpIntegration };
const api = new Hono<{ Bindings: CloudflareBindings }>();
const commits = fakeCommits(500);

api.get("/commits", (c) => {
	const count = c.req.query("count");

	return c.json({
		data: count ? commits.slice(0, Number(count)) : commits,
	});
});

api.get("/commits/:id", (c) => {
	const id = c.req.param("id");
	const commit = commits.find((commit) => commit.hash === id);
	if (!commit) {
		return c.notFound();
	}
	return c.json(commit);
});

api.post("/commits", async (c) => {
	const body = await c.req.json();
	const commit = {
		id: crypto.randomUUID(),
		...body,
	};
	commits.push(commit);
	return c.json(commit, 201);
});

api.put("/commits/:id", async (c) => {
	const id = c.req.param("id");
	const index = commits.findIndex((commit) => commit.hash === id);
	if (index === -1) {
		return c.notFound();
	}
	const body = await c.req.json();
	const commit = {
		...commits[index],
		...body,
	};
	commits[index] = commit;
	return c.json(commit);
});

api.delete("/commits/:id", (c) => {
	const id = c.req.param("id");
	const index = commits.findIndex((commit) => commit.hash === id);
	if (index === -1) {
		return c.notFound();
	}
	commits.splice(index, 1);
	return c.json({ message: "Commit deleted" });
});


api.get("/r/:name", async ({ req, env }) => {
	const name = req.param("name");

	if (!name) {
		return new Response("Name is required", { status: 400 });
	}

	const url = new URL(req.url);
	const assetPath = import.meta.env.PROD ? `assets/${name}.json` : `dist/client/assets/${name}.json`;
	url.pathname = assetPath;
	const assetRequest = new Request(url);
	const asset = await env.ASSETS.fetch(assetRequest);

	if (!asset.ok) {
		return new Response("Component not found", { status: 404 });
	}
	const response = await asset.text();
	console.log("Response from asset:", response);
	try {
		const json = JSON.parse(response);
		return new Response(JSON.stringify(json), {
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error parsing JSON:", error);
	}
	return new Response(response, {
		headers: {
			"Content-Type": "application/json",
		},
	});
});


// api.mount("/mcp", McpIntegration.serve('/api/mcp').fetch, {
// 	replaceRequest(originalRequest) {
// 		return new Request(originalRequest)
// 	},
// });

export default api;
