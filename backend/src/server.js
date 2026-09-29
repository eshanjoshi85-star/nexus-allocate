const express = require("express");
const cors = require("cors");

require("dotenv").config();

const pool = require("./config/db");
const resourceRoutes = require("./routes/resourceRoutes");
const requestRoutes = require("./routes/requestRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/resources", resourceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "NEXUS Allocate API is running",
            database: "connected",
            serverTime: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`NEXUS Allocate API running on http://localhost:${PORT}`);
});