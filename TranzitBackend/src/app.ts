import express from "express";
import cors from "cors";

import driversRouter from "./routes/drivers";
import ridesRouter from "./routes/rides";

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/drivers", driversRouter);
app.use("/ride", ridesRouter);

export default app;
