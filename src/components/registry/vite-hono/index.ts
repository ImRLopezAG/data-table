const app = new Hono();

import client from "./client";
import api from "./server";
import { Hono } from "hono";

app.route("/api", api);
app.route("/", client);

export default app;
