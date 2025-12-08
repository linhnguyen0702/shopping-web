import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createTestNotification,
  deleteNotifications,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { sendTestEmail } from "../services/emailService.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Routes cho notification (User & Admin)
router.get("/", userAuth, getNotifications);
router.put("/read-all", userAuth, markAllAsRead);
router.put("/:notificationId/read", userAuth, markAsRead);
router.delete("/", userAuth, deleteNotifications); 

// Delete routes (Admin specific or alternative)
router.delete("/delete-all", userAuth, deleteAllNotifications);

// Route test email (chỉ admin)
router.post("/test-email", adminAuth, sendTestEmail);

// Route test notification đơn giản (chỉ admin)
router.post("/test-simple", adminAuth, createTestNotification);

// Route test notification (chỉ admin)
router.post("/test-login-notification", adminAuth, async (req, res) => {
  try {
    const { notifyUserLogin } = await import(
      "../services/notificationService.js"
    );

    // Test với user hiện tại
    const result = await notifyUserLogin(req.user);

    res.json({
      success: true,
      message: "Test notification đã được tạo",
      notificationId: result?._id,
    });
  } catch (error) {
    console.error("Lỗi test notification:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo test notification",
    });
  }
});

// Route test notification không cần auth (chỉ để debug)
router.post("/test-debug", async (req, res) => {
  try {
    const { notifyUserLogin } = await import(
      "../services/notificationService.js"
    );
    const User = (await import("../models/userModel.js")).default;

    // Tìm một admin bất kỳ để test
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      return res.json({ success: false, message: "Không tìm thấy admin" });
    }

    console.log("🧪 Testing với admin:", adminUser.email);
    const result = await notifyUserLogin(adminUser);

    res.json({
      success: true,
      message: "Test notification đã được tạo",
      adminEmail: adminUser.email,
      notificationId: result?._id,
    });
  } catch (error) {
    console.error("Lỗi test debug:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
