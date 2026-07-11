import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import importRoutes from "./routes/import.js";

dotenv.config();

const app = express();
app.use(cors( {origin: process.env.FRONTEND_URL || "http://localhost:3000",
}));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/import", importRoutes);

// centralized error handler (catches multer errors etc.)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));