import nodemailer from "nodemailer";
import notificationModel from "../models/notificationModel.js";

// Cấu hình email transporter
const createTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Đặt trong .env
      pass: process.env.SMTP_PASS, // App password của Gmail
    },
  };

  return nodemailer.createTransporter(emailConfig);
};

// Template HTML cho email thông báo
const getEmailTemplate = (notification, type) => {
  const { title, message, data, createdAt } = notification;

  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      order: "#10B981", // green
      warning: "#F59E0B", // amber
      user: "#3B82F6", // blue
      product: "#8B5CF6", // purple
      system: "#6B7280", // gray
    };
    return colors[type] || "#6B7280";
  };

  const getTypeIcon = (type) => {
    const icons = {
      order: "🛒",
      warning: "⚠️",
      user: "👤",
      product: "📦",
      system: "⚙️",
    };
    return icons[type] || "📢";
  };

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo từ Admin Panel</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${getTypeColor(
            type
          )}, ${getTypeColor(type)}dd);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .notification-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid ${getTypeColor(type)};
          margin: 20px 0;
        }
        .notification-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .notification-message {
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }
        .metadata {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .data-section {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
          border: 1px solid #e5e7eb;
        }
        .data-item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .data-key {
          font-weight: 500;
          color: #374151;
        }
        .data-value {
          color: #6b7280;
        }
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .admin-link {
          display: inline-block;
          background: ${getTypeColor(type)};
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${getTypeIcon(type)} Thông báo Admin Panel</h1>
        </div>
        
        <div class="content">
          <div class="notification-card">
            <h2 class="notification-title">
              ${getTypeIcon(type)} ${title}
            </h2>
            <p class="notification-message">${message}</p>
            
            ${
              Object.keys(data).length > 0
                ? `
              <div class="data-section">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;">Chi tiết:</h3>
                ${Object.entries(data)
                  .map(
                    ([key, value]) => `
                  <div class="data-item">
                    <span class="data-key">${key}:</span>
                    <span class="data-value">${value}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
            
            <div class="metadata">
              <strong>Thời gian:</strong> ${formatDate(createdAt)}<br>
              <strong>Loại:</strong> ${type.toUpperCase()}
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${
              process.env.ADMIN_URL || "http://localhost:5174"
            }" class="admin-link">
              Vào Admin Panel
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Admin Panel.<br>
          Vui lòng không tr�� lời email này.</p>
          <p>&copy; 2025 Shopping Admin Panel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Gửi email thông báo
export const sendNotificationEmail = async (notification) => {
  try {
    // Kiểm tra config email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️ Không tìm thấy cấu hình SMTP, bỏ qua gửi email");
      return false;
    }

    const transporter = createTransporter();
    const adminEmail = "linhyang0702@gmail.com";

    const mailOptions = {
      from: {
        name: "Admin Panel Notification",
        address: process.env.SMTP_USER,
      },
      to: adminEmail,
      subject: `🔔 ${notification.title}`,
      html: getEmailTemplate(notification, notification.type),
      priority: notification.priority === "urgent" ? "high" : "normal",
    };

    const result = await transporter.sendMail(mailOptions);

    // Cập nhật trạng thái đã gửi email
    await notificationModel.findByIdAndUpdate(notification._id, {
      emailSent: true,
      emailSentAt: new Date(),
    });

    console.log(`📧 Đã gửi email thông báo: ${notification.title}`);
    console.log(`📧 Message ID: ${result.messageId}`);

    return true;
  } catch (error) {
    console.error("❌ Lỗi gửi email thông báo:", error);
    return false;
  }
};

// Test gửi email
export const sendTestEmail = async (req, res) => {
  try {
    const testNotification = {
      _id: "test",
      type: "system",
      title: "Test Email Notification",
      message: "Đây là email test để kiểm tra hệ thống thông báo hoạt động.",
      data: {
        "Test Key": "Test Value",
        Server: "Development",
      },
      createdAt: new Date(),
    };

    const success = await sendNotificationEmail(testNotification);

    res.json({
      success,
      message: success
        ? "Email test đã được gửi thành công"
        : "Lỗi gửi email test",
    });
  } catch (error) {
    console.error("Lỗi test email:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi test email",
    });
  }
};
