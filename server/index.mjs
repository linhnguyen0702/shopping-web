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

// ====== CLEAN ORIGINS ======
const allowedOrigins = [
  process.env.ADMIN_URL?.replace(/\/$/, ""),
  process.env.CLIENT_URL?.replace(/\/$/, ""),

  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://10.0.2.2:8081",
  "http://10.0.2.2:8000",
  "https://shopping-web-peach.vercel.app",
].filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

// ====== CORS (FINAL VERSION) ======
app.use(cors({
  origin: function (origin, callback) {
    console.log("Origin request:", origin);

    if (!origin) return callback(null, true); // mobile / postman / curl

    const cleanOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    console.log("Blocked origin:", cleanOrigin);
    return callback(new Error("CORS blocked"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Fix Render OPTIONS redirect
app.options("*", cors());

// ====== BODY PARSER ======
app.use(express.json());

// ====== DB & CLOUD ======
await dbConnect();
connectCloudinary();

// ====== ROUTES ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cartRoute from "./routes/cartRoute.js";
import notificationRoute from "./routes/notificationRoute.mjs";
import shippingRoute from "./routes/shippingRoute.mjs";

app.use("/cart", cartRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/shipping", shippingRoute);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
  if (["cartRoute.js", "notificationRoute.mjs", "shippingRoute.mjs"].includes(file)) return;
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("Bạn không nên ở đây");
});

// ====== START SERVER ======
try {
  const server = app.listen(port, () => {
    console.log(`Server chạy trên cổng ${port}`);
  });
  server.on("error", (err) => {
    console.error("Lỗi server:", err?.message || err);
    process.exit(1);
  });
} catch (err) {
  console.error("Không thể khởi động server:", err?.message || err);
  process.exit(1);
}
