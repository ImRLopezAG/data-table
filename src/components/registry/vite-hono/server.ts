import { Hono } from "hono";
const api = new Hono();

api.get("/hello", (c) => {
  const name = c.req.query("name") || "World";
  return c.text(`Hello ${name}!`);
});

export default api;
