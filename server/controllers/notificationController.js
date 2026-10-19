import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

const parseNotificationData = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error("Lỗi phân tích dữ liệu thông báo:", error);
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
};

const paymentMethodLabels = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản ngân hàng",
  qr_code: "QR Code",
  vnpay: "VNPay",
};

// Lấy danh sách thông báo đơn giản
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50, type, unreadOnly = false } = req.query;

    console.log("🔍 getNotifications được gọi cho user:", userId);

    // Build base query
    let query;

    // Nếu là admin, xem hết global (trừ login logs) và của mình
    if (req.user.role === "admin") {
      query = {
        $or: [
          { 
            isGlobal: true,
            type: { $ne: "login" } // Ẩn thông báo đăng nhập hệ thống khỏi menu giúp gọn gàng
          },
          { "recipients.userId": userId },
        ],
      };
    } else {
      // Nếu là user thường, chỉ xem của mình HOẶC global dạng system/warning (thông báo chung)
      // Ẩn các global dạng order/login/user (đây là log cho admin)
      query = {
        $or: [
          { "recipients.userId": userId },
          { 
            isGlobal: true, 
            type: { $in: ["system", "warning"] } 
          },
        ],
      };
    }

    // Add type filter
    if (type && type !== "all") {
      query.type = type;
    }

    console.log("📋 Query:", JSON.stringify(query, null, 2));

    // Lấy notifications
    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    console.log("📋 Tìm thấy", notifications.length, "notifications");

    const orderIds = notifications
      .filter((notification) => notification.type === "order")
      .map((notification) => {
        const data = parseNotificationData(notification.data);
        const metadata = parseNotificationData(notification.metadata);
        return (
          data.orderId ||
          data["Mã đơn hàng"] ||
          metadata.orderId ||
          metadata["Mã đơn hàng"]
        );
      })
      .filter(
        (orderId) =>
          orderId &&
          /^[a-f\d]{24}$/i.test(
            typeof orderId === "string" ? orderId : orderId.toString()
          )
      );

    const orders = orderIds.length
      ? await orderModel
          .find({ _id: { $in: orderIds } })
          .populate("userId", "name email")
          .lean()
      : [];
    const ordersById = new Map(
      orders.map((order) => [order._id.toString(), order])
    );

    const notificationsWithOrderDetails = notifications.map((notification) => {
      if (notification.type !== "order") return notification;

      const data = parseNotificationData(notification.data);
      const metadata = parseNotificationData(notification.metadata);
      const orderId =
        data.orderId ||
        data["Mã đơn hàng"] ||
        metadata.orderId ||
        metadata["Mã đơn hàng"];
      const order = orderId
        ? ordersById.get(orderId.toString())
        : undefined;

      if (!order) {
        return {
          ...notification,
          data: { ...data, ...metadata },
        };
      }

      const address = order.address || {};
      const customerName =
        `${address.firstName || ""} ${address.lastName || ""}`.trim() ||
        order.userId?.name ||
        data["Khách hàng"] ||
        "N/A";
      const customerEmail =
        address.email || order.userId?.email || data.Email || "N/A";
      const products =
        order.items?.map((item) => ({
          name: item.name || "Sản phẩm không rõ",
          quantity: item.quantity || 1,
          price: item.price || 0,
          image: item.image || "",
        })) || [];

      return {
        ...notification,
        data: {
          ...data,
          ...metadata,
          orderId: order._id.toString(),
          "Mã đơn hàng": order._id.toString(),
          "Khách hàng": customerName,
          Email: customerEmail,
          "Số điện thoại": address.phone || data["Số điện thoại"] || "N/A",
          "Địa chỉ giao hàng":
            [
              address.street,
              address.city,
              address.state,
              address.zipcode,
              address.country,
            ]
              .filter(Boolean)
              .join(", ") ||
            data["Địa chỉ giao hàng"] ||
            "N/A",
          "Tổng tiền": `${Number(order.amount || 0).toLocaleString("vi-VN")} VNĐ`,
          "Phí vận chuyển": Number(order.shippingFee || 0),
          "Phương thức vận chuyển":
            order.shippingMethod?.serviceName ||
            order.shippingMethod?.provider ||
            "N/A",
          "Phương thức thanh toán":
            paymentMethodLabels[order.paymentMethod] ||
            order.paymentMethod ||
            data["Phương thức thanh toán"] ||
            "N/A",
          "Trạng thái đơn hàng": order.status || data.status || "pending",
          "Trạng thái thanh toán": order.paymentStatus || "",
          "Số sản phẩm": products.length,
          "Sản phẩm": JSON.stringify(products),
        },
      };
    });

    // Process isRead status cho từng notification
    const processedNotifications = notificationsWithOrderDetails.map((notification) => {
      let isRead = false;
      let readAt = null;

      // Tìm recipient của user hiện tại
      const userRecipient = notification.recipients.find(
        (r) => r.userId && r.userId.toString() === userId.toString()
      );

      if (userRecipient) {
        isRead = userRecipient.isRead || false;
        readAt = userRecipient.readAt || null;
      }

      return {
        ...notification,
        isRead,
        readAt,
      };
    });

    // Filter unread nếu cần
    const finalNotifications =
      unreadOnly === "true"
        ? processedNotifications.filter((n) => !n.isRead)
        : processedNotifications;

    // Count unread
    const unreadCount = processedNotifications.filter((n) => !n.isRead).length;

    // Get total count
    const total = await notificationModel.countDocuments(query);

    console.log(
      "✅ Trả về",
      finalNotifications.length,
      "notifications, unread:",
      unreadCount,
      "total:",
      total
    );

    res.json({
      success: true,
      notifications: finalNotifications,
      unreadCount,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
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

    // Build query based on user role (same as getNotifications)
    let query;
    if (req.user.role === "admin") {
      query = {
        $or: [
          { isGlobal: true, type: { $ne: "login" } },
          { "recipients.userId": userId }
        ],
      };
    } else {
      query = {
        $or: [
          { "recipients.userId": userId },
          { isGlobal: true, type: { $in: ["system", "warning"] } },
        ],
      };
    }

    // Lấy tất cả notifications phù hợp
    const notifications = await notificationModel.find(query);

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

// Delete specific notifications
export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    console.log(
      "🗑️ deleteNotifications:",
      notificationIds,
      "cho user:",
      userId
    );

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách ID thông báo không hợp lệ",
      });
    }

    // Xóa các notifications
    const result = await notificationModel.deleteMany({
      _id: { $in: notificationIds },
      $or: [{ isGlobal: true }, { "recipients.userId": userId }],
    });

    console.log("🗑️ Đã xóa", result.deletedCount, "notifications");

    res.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} thông báo`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Lỗi xóa notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa thông báo",
      error: error.message,
    });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🗑️🗑️ deleteAllNotifications cho user:", userId);

    // Xóa tất cả notifications của user
    const result = await notificationModel.deleteMany({
      $or: [{ isGlobal: true }, { "recipients.userId": userId }],
    });

    console.log("🗑️ Đã xóa tất cả", result.deletedCount, "notifications");

    res.json({
      success: true,
      message: `Đã xóa tất cả ${result.deletedCount} thông báo`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Lỗi xóa tất cả notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa tất cả thông báo",
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
    // Validate recipients nếu không phải global
    let validRecipients = [];
    if (!isGlobal && recipients.length > 0) {
      // Extract IDs properly (recipients is array of {userId, isRead})
      const recipientIds = recipients.map(r => r.userId);
      
      // Verify users exist (do NOT filter by role: "admin" here, allow all users)
      const users = await userModel.find({
        _id: { $in: recipientIds }
      });

      validRecipients = users.map((user) => ({
        userId: user._id,
        isRead: false,
      }));
    } else if (!isGlobal && recipients.length === 0) {
      // Allow passing explicit recipients objects if provided directly
       validRecipients = recipients;
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
