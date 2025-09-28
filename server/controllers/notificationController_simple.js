import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";

// Lấy danh sách thông báo đơn giản
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    console.log("🔍 getNotifications được gọi cho user:", userId);

    // Lấy tất cả notifications (global hoặc targeted cho user này)
    let query = {
      $or: [
        { isGlobal: true }, // Global notifications
        { "recipients.userId": userId }, // Targeted notifications
      ],
    };

    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log("📋 Tìm thấy", notifications.length, "notifications");

    // Process isRead status cho từng notification
    const processedNotifications = notifications.map((notification) => {
      let isRead = false;

      if (notification.isGlobal) {
        // Global notification - check if user đã đọc
        const userRecipient = notification.recipients.find(
          (r) => r.userId && r.userId.toString() === userId.toString()
        );
        isRead = userRecipient ? userRecipient.isRead : false;
      } else {
        // Targeted notification
        const userRecipient = notification.recipients.find(
          (r) => r.userId && r.userId.toString() === userId.toString()
        );
        isRead = userRecipient ? userRecipient.isRead : false;
      }

      return {
        ...notification,
        isRead,
      };
    });

    // Filter unread nếu cần
    const finalNotifications =
      unreadOnly === "true"
        ? processedNotifications.filter((n) => !n.isRead)
        : processedNotifications;

    // Count unread
    const unreadCount = processedNotifications.filter((n) => !n.isRead).length;

    console.log(
      "✅ Trả về",
      finalNotifications.length,
      "notifications, unread:",
      unreadCount
    );

    res.json({
      success: true,
      notifications: finalNotifications,
      unreadCount,
      total: finalNotifications.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông báo",
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    console.log("📖 markAsRead:", notificationId, "cho user:", userId);

    const notification = await notificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // Check if user có quyền đọc notification này
    const canRead =
      notification.isGlobal ||
      notification.recipients.some(
        (r) => r.userId.toString() === userId.toString()
      );

    if (!canRead) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập thông báo này",
      });
    }

    // Update read status
    if (notification.isGlobal) {
      // Thêm user vào recipients nếu chưa có
      const existingRecipient = notification.recipients.find(
        (r) => r.userId.toString() === userId.toString()
      );

      if (existingRecipient) {
        existingRecipient.isRead = true;
        existingRecipient.readAt = new Date();
      } else {
        notification.recipients.push({
          userId: userId,
          isRead: true,
          readAt: new Date(),
        });
      }
    } else {
      // Update existing recipient
      const recipient = notification.recipients.find(
        (r) => r.userId.toString() === userId.toString()
      );

      if (recipient) {
        recipient.isRead = true;
        recipient.readAt = new Date();
      }
    }

    await notification.save();

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo đã đọc",
    });
  } catch (error) {
    console.error("❌ Lỗi mark as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("📖📖 markAllAsRead cho user:", userId);

    // Lấy tất cả notifications của user
    const notifications = await notificationModel.find({
      $or: [{ isGlobal: true }, { "recipients.userId": userId }],
    });

    // Update từng notification
    for (const notification of notifications) {
      if (notification.isGlobal) {
        const existingRecipient = notification.recipients.find(
          (r) => r.userId.toString() === userId.toString()
        );

        if (existingRecipient) {
          existingRecipient.isRead = true;
          existingRecipient.readAt = new Date();
        } else {
          notification.recipients.push({
            userId: userId,
            isRead: true,
            readAt: new Date(),
          });
        }
      } else {
        const recipient = notification.recipients.find(
          (r) => r.userId.toString() === userId.toString()
        );

        if (recipient) {
          recipient.isRead = true;
          recipient.readAt = new Date();
        }
      }

      await notification.save();
    }

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo đã đọc",
      count: notifications.length,
    });
  } catch (error) {
    console.error("❌ Lỗi mark all as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Create notification (helper function)
export const createNotification = async (notificationData) => {
  try {
    console.log("📝 createNotification được gọi với:", notificationData.title);

    const {
      type,
      title,
      message,
      data = {},
      metadata = {},
      recipients = [],
      priority = "medium",
      isGlobal = false,
      createdBy = null,
    } = notificationData;

    // Validate recipients nếu không phải global
    let validRecipients = [];
    if (!isGlobal && recipients.length > 0) {
      const users = await userModel.find({
        _id: { $in: recipients },
        role: "admin",
      });
      validRecipients = users.map((user) => ({
        userId: user._id,
        isRead: false,
      }));
    }

    const notification = new notificationModel({
      type,
      title,
      message,
      data: Object.keys(data).length > 0 ? data : metadata,
      metadata: Object.keys(metadata).length > 0 ? metadata : data,
      recipients: validRecipients,
      priority,
      isGlobal,
      createdBy,
    });

    await notification.save();
    console.log(`📢 Đã tạo thông báo: ${title} (ID: ${notification._id})`);

    return notification;
  } catch (error) {
    console.error("❌ Lỗi tạo notification:", error);
    throw error;
  }
};

// Test endpoint để tạo notification
export const createTestNotification = async (req, res) => {
  try {
    const testNotification = {
      type: "login",
      title: "Test Admin đăng nhập",
      message: "Test Admin đã đăng nhập vào hệ thống để test notification",
      metadata: {
        name: "Test Admin",
        email: "test@admin.com",
        role: "admin",
        userType: "admin",
        loginTime: new Date().toISOString(),
      },
      priority: "medium",
      isGlobal: true,
    };

    const notification = await createNotification(testNotification);

    res.json({
      success: true,
      message: "Test notification đã được tạo",
      notificationId: notification._id,
      data: notification,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo test notification:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo test notification",
      error: error.message,
    });
  }
};
