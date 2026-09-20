import express from "express";
import { API_BASE_PATH } from "@make-my-marriage/shared";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { healthRouter } from "./modules/health/health.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(API_BASE_PATH, healthRouter);
app.use(notFound);
app.use(errorHandler);
