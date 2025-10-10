import { createNotification } from "../controllers/notificationController.js";
import { sendNotificationEmail } from "../services/emailService.js";

// Tạo và gửi thông báo
export const createAndSendNotification = async (notificationData) => {
  try {
    console.log(
      "📤 createAndSendNotification được gọi với:",
      notificationData.title
    );

    // Tạo thông báo trong database
    const notification = await createNotification(notificationData);
    console.log("💾 Notification đã lưu vào DB với ID:", notification._id);

    // Gửi email (async, không chờ kết quả)
    sendNotificationEmail(notification).catch((error) => {
      console.error(
        "❌ Lỗi gửi email cho notification:",
        notification._id,
        error
      );
    });

    return notification;
  } catch (error) {
    console.error("❌ Lỗi tạo và gửi thông báo:", error);
    throw error;
  }
};

// Notification cho đơn hàng mới
export const notifyNewOrder = async (order) => {
  try {
    const notificationData = {
      type: "order",
      title: "Đơn hàng mới nhận",
      message: `Có đơn hàng mới #${order._id} từ khách hàng ${
        order.address?.firstName || "N/A"
      } ${order.address?.lastName || ""}`,
      data: {
        "Mã đơn hàng": order._id,
        "Khách hàng": `${order.address?.firstName || ""} ${
          order.address?.lastName || ""
        }`.trim(),
        Email: order.address?.email || "N/A",
        "Số điện thoại": order.address?.phone || "N/A",
        "Tổng tiền": `${order.amount?.toLocaleString() || 0} VNĐ`,
        "Phương thức thanh toán": order.paymentMethod || "N/A",
        "Số sản phẩm": order.items?.length || 0,
      },
      priority: "high",
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo đơn hàng mới:", error);
  }
};

// Notification cho user đăng ký
export const notifyNewUserRegistration = async (user) => {
  try {
    const isAdmin = user.role === "admin";
    const userType = isAdmin ? "Admin" : "Khách hàng";
    const priority = isAdmin ? "high" : "medium";

    const notificationData = {
      type: "user",
      title: `${userType} đăng ký mới`,
      message: `Có ${userType.toLowerCase()} mới đăng ký: ${user.name} (${
        user.email
      })`,
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role || "user",
        userType: userType.toLowerCase(),
        registrationTime: new Date().toISOString(),
        userId: user._id,
      },
      priority: priority,
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo user đăng ký:", error);
  }
};

// Notification cho user login (tất cả accounts)
export const notifyUserLogin = async (user) => {
  try {
    console.log(
      "🔔 notifyUserLogin được gọi cho user:",
      user.name,
      "role:",
      user.role
    );

    const isAdmin = user.role === "admin";
    const userType = isAdmin ? "Admin" : "Khách hàng";
    const priority = isAdmin ? "medium" : "low";

    const notificationData = {
      type: "login",
      title: `${userType} đăng nhập`,
      message: `${userType} ${user.name} đã đăng nhập vào hệ thống`,
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role || "user",
        userType: userType.toLowerCase(),
        loginTime: new Date().toISOString(),
        userId: user._id,
        ip: "127.0.0.1", // Có thể lấy từ request
        userAgent: "Browser info", // Có thể lấy từ request
      },
      priority: priority,
      isGlobal: true,
    };

    console.log("📝 Tạo notification với data:", notificationData.title);
    const result = await createAndSendNotification(notificationData);
    console.log("✅ Notification đã tạo thành công:", result?._id);

    return result;
  } catch (error) {
    console.error("❌ Lỗi tạo thông báo user login:", error);
  }
};

// Notification cho sản phẩm hết hàng
export const notifyLowStock = async (product, currentStock = 0) => {
  try {
    const notificationData = {
      type: "warning",
      title: "Cảnh báo hết hàng",
      message: `Sản phẩm "${product.name}" sắp hết hàng (còn ${currentStock} sản phẩm)`,
      data: {
        "Sản phẩm": product.name,
        SKU: product.sku || "N/A",
        "Số lượng còn lại": currentStock,
        Giá: `${product.price?.toLocaleString() || 0} VNĐ`,
        "Danh mục": product.category || "N/A",
        ID: product._id,
      },
      priority: "high",
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo hết hàng:", error);
  }
};

// Notification cho hệ thống
export const notifySystemEvent = async (
  title,
  message,
  data = {},
  priority = "medium"
) => {
  try {
    const notificationData = {
      type: "system",
      title,
      message,
      data,
      priority,
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo hệ thống:", error);
  }
};

// Notification cho liên hệ mới
export const notifyNewContact = async (contactData) => {
  try {
    const notificationData = {
      type: "contact",
      title: `${contactData.subject || "Liên hệ"} mới`,
      message: `Có tin nhắn ${(
        contactData.subject || "liên hệ"
      ).toLowerCase()} mới từ ${contactData.name} (${contactData.email})`,
      metadata: {
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        phone: contactData.phone || "Không có",
        message: contactData.message,
        contactTime: new Date().toISOString(),
        type: "contact",
      },
      priority: "medium",
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo liên hệ:", error);
  }
};

// Notification cho đăng ký newsletter
export const notifyNewsletter = async (email) => {
  try {
    const notificationData = {
      type: "user",
      title: "Đăng ký newsletter mới",
      message: `Có đăng ký newsletter mới từ ${email}`,
      metadata: {
        email: email,
        subscriptionTime: new Date().toISOString(),
        type: "newsletter",
      },
      priority: "low",
      isGlobal: true,
    };

    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo newsletter:", error);
  }
};

// Notification cho đánh giá sản phẩm mới
export const notifyNewReview = async (review, productName, user = null) => {
  try {
    const userName = user?.name || "Khách hàng";
    const userEmail = user?.email || "N/A";

    const notificationData = {
      type: "review",
      title: "Đánh giá sản phẩm mới",
      message: `${userName} đã đánh giá ${review.rating} sao cho sản phẩm "${productName}"`,
      data: {
        "Khách hàng": userName,
        Email: userEmail,
        "Sản phẩm": productName,
        "Đánh giá": `${review.rating}/5 sao`,
        "Nhận xét": review.comment,
        "Mã đánh giá": review._id,
        "Thời gian": new Date(review.createdAt).toLocaleString("vi-VN"),
      },
      priority: "medium",
      isGlobal: true,
    };

    console.log(
      "📧 Sending review notification to admin:",
      notificationData.title
    );
    return await createAndSendNotification(notificationData);
  } catch (error) {
    console.error("Lỗi tạo thông báo đánh giá:", error);
  }
};
