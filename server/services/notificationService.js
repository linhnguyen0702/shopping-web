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
    const orderId = order._id.toString();
    const productsArray =
      order.items?.map((item) => ({
        name: item.name || "Sản phẩm không rõ",
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: item.image || item.images?.[0] || "",
      })) || [];
    const customerName = `${order.address?.firstName || ""} ${
      order.address?.lastName || ""
    }`.trim();
    const paymentMethodLabels = {
      cod: "Thanh toán khi nhận hàng",
      bank_transfer: "Chuyển khoản ngân hàng",
      qr_code: "QR Code",
      vnpay: "VNPay",
    };
    const orderData = {
      orderId,
      "Mã đơn hàng": orderId,
      "Khách hàng": customerName || "N/A",
      Email: order.address?.email || "N/A",
      "Số điện thoại": order.address?.phone || "N/A",
      "Địa chỉ giao hàng": [
        order.address?.street,
        order.address?.city,
        order.address?.state,
        order.address?.zipcode,
        order.address?.country,
      ]
        .filter(Boolean)
        .join(", "),
      "Tổng tiền": `${Number(order.amount || 0).toLocaleString("vi-VN")} VNĐ`,
      "Phí vận chuyển": Number(order.shippingFee || 0),
      "Phương thức vận chuyển":
        order.shippingMethod?.serviceName ||
        order.shippingMethod?.provider ||
        "N/A",
      "Phương thức thanh toán":
        paymentMethodLabels[order.paymentMethod] ||
        order.paymentMethod ||
        "N/A",
      "Trạng thái đơn hàng": order.status || "pending",
      "Trạng thái thanh toán": order.paymentStatus || "pending",
      "Số sản phẩm": productsArray.length,
      "Sản phẩm": JSON.stringify(productsArray),
    };

    const notificationData = {
      type: "order",
      title: "Đơn hàng mới",
      message: `Đơn hàng #${orderId.slice(-8).toUpperCase()} đã được lưu${
        customerName ? ` cho khách hàng ${customerName}` : ""
      }.`,
      data: orderData,
      metadata: orderData,
      priority: "high",
      isGlobal: true,
    };

    // 1. Gửi thông báo cho Admin (Global)
    await createAndSendNotification(notificationData);

    // 2. Gửi thông báo riêng cho Khách hàng (Targeted)
    if (order.userId) {
      const userNotificationData = {
        type: "order", // Reuse 'order' type but backend filters allow targeted ones
        title: "Đặt hàng thành công",
        message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã được ghi nhận.`,
        data: {
          ...orderData,
        },
        recipients: [{ userId: order.userId, isRead: false }],
        priority: "high",
        isGlobal: false,
      };
      await createAndSendNotification(userNotificationData);
    }
    
    return true;
  } catch (error) {
    console.error("Lỗi tạo thông báo đơn hàng mới:", error);
    throw error;
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
    // 1. Thông báo cho Admin (Global)
    const result = await createAndSendNotification(notificationData);

    // 2. Thông báo riêng cho User
    const userNotificationData = {
      type: "login",
      title: "Đăng nhập thành công",
      message: `Hệ thống ghi nhận phiên đăng nhập mới vào ${new Date().toLocaleString('vi-VN')}.`,
      metadata: {
        time: new Date().toISOString(),
      },
      recipients: [{ userId: user._id, isRead: false }],
      priority: "low",
      isGlobal: false,
    };
    await createAndSendNotification(userNotificationData);

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

// Notification cập nhật trạng thái đơn hàng
export const notifyOrderStatusUpdate = async (order, oldStatus = null) => {
  try {
    const statusMap = {
      pending: "Đang chờ xử lý",
      confirmed: "Đã xác nhận",
      shipped: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      "partially-shipped": "Giao hàng một phần",
    };

    const paymentStatusMap = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán thất bại",
    };

    const statusText = statusMap[order.status] || order.status;
    
    // Tạo thông điệp
    const message = `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã được cập nhật trạng thái: ${statusText}`;

    // Notification cho Khách hàng
    if (order.userId) {
      const userNotificationData = {
        type: "order",
        title: "Cập nhật đơn hàng",
        message: message,
        data: {
          orderId: order._id,
          status: statusText,
          paymentStatus: paymentStatusMap[order.paymentStatus] || order.paymentStatus,
          "Mã đơn hàng": order._id.toString(),
          "Khách hàng": `${order.address?.firstName || ""} ${
            order.address?.lastName || ""
          }`.trim(),
          Email: order.address?.email || "N/A",
          "Số điện thoại": order.address?.phone || "N/A",
          "Tổng tiền": `${Number(order.amount || 0).toLocaleString("vi-VN")} VNĐ`,
          "Địa chỉ giao hàng":
            [
              order.address?.street,
              order.address?.city,
              order.address?.state,
              order.address?.zipcode,
              order.address?.country,
            ]
              .filter(Boolean)
              .join(", ") || "N/A",
          "Phí vận chuyển": Number(order.shippingFee || 0),
          "Phương thức vận chuyển":
            order.shippingMethod?.serviceName ||
            order.shippingMethod?.provider ||
            "N/A",
          "Trạng thái đơn hàng": statusText,
          "Số sản phẩm": order.items?.length || 0,
          "Sản phẩm": JSON.stringify(
            order.items?.map((item) => ({
              name: item.name || "Sản phẩm không rõ",
              quantity: item.quantity || 1,
              price: item.price || 0,
              image: item.image || "",
            })) || []
          ),
        },
        recipients: [{ userId: order.userId, isRead: false }],
        priority: "medium",
        isGlobal: false,
      };
      await createAndSendNotification(userNotificationData);
    }
  } catch (error) {
    console.error("Lỗi tạo thông báo cập nhật đơn hàng:", error);
  }
};
