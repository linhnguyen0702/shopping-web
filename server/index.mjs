import express from "express";
const app = express();
import "dotenv/config";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { readdirSync } from "fs";
import dbConnect from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
  // Add production URLs
  // Add localhost for development
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:8081", // iOS simulator
  "http://10.0.2.2:8081", // Android emulator
  "http://10.0.2.2:8000", // Android emulator direct access
].filter(Boolean); // Remove any undefined values

// CORS configuration using config system
console.log("Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS request from origin:", origin);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all origins for easier testing
      if (
        process.env.NODE_ENV === "development" ||
        process.env.CORS_ALLOW_ALL === "true"
      ) {
        console.log("Development mode: allowing all origins");
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("Origin allowed:", origin);
        callback(null, true);
      } else {
        console.log("Origin blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Connect to services before starting server
await dbConnect();
connectCloudinary();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("You should not be here");
});

try {
  const server = app.listen(port, () => {
    console.log(`Server is running on ${port}`);
  });
  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Set a different PORT or free it.`);
    } else {
      console.error("Server error:", err?.message || err);
    }
    process.exit(1);
  });
} catch (err) {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
}
