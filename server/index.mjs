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
console.log("Các nguồn CORS được cho phép:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Yêu cầu CORS từ nguồn (origin):", origin);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all origins for easier testing
      if (
        process.env.NODE_ENV === "development" ||
        process.env.CORS_ALLOW_ALL === "true"
      ) {
        console.log("Chế độ phát triển: cho phép tất cả các nguồn");
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("Nguồn được cho phép:", origin);
        callback(null, true);
      } else {
        console.log("Nguồn bị chặn:", origin);
        callback(new Error("Không được phép bởi CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Kết nối đến các dịch vụ trước khi khởi động server
await dbConnect();
connectCloudinary();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import specific routes explicitly
import cartRoute from "./routes/cartRoute.js";
import notificationRoute from "./routes/notificationRoute.mjs";

app.use("/cart", cartRoute);
app.use("/api/notifications", notificationRoute);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
  if (file === "cartRoute.js" || file === "notificationRoute.mjs") return; // Skip already imported routes
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("Bạn không nên ở đây");
});

try {
  const server = app.listen(port, () => {
    console.log(`Server đang chạy trên ${port}`);
  });
  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.error(
        `Port ${port} đã được sử dụng. Đặt một PORT khác hoặc giải phóng nó.`
      );
    } else {
      console.error("Lỗi server:", err?.message || err);
    }
    process.exit(1);
  });
} catch (err) {
  console.error("Không thể khởi động server:", err?.message || err);
  process.exit(1);
}
