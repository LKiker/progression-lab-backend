import express from "express";
import cors from "cors";
import pool from "./db";
import weightsRoutes from "./routes/weights.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/weights", weightsRoutes);


// health checks
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/health/db", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", db: "disconnected" });
    }
});

app.get("/", (_req, res) => {
    res.send("Fitness API is running");
});

export default app;
