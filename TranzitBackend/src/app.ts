import express from "express";
import cors from "cors";

import driversRouter from "./routes/drivers";
import ridesRouter from "./routes/rides";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/ride", ridesRouter);

app.get("/", (_req, res) => {
    res.send("API running");
});

/* MOUNT ROUTES */
app.use("/drivers", driversRouter);

export default app;
