import { Hono } from "hono";
import { logger } from 'hono/logger';
import client from "./client";
import api, { CommitServer } from "./server";

const app = new Hono();

app.use("*", logger());
app.route("/api", api);
app.route("/", client);

export { CommitServer } 
export default app;
