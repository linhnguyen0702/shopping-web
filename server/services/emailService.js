import { createTransport } from "nodemailer";
import notificationModel from "../models/notificationModel.js";

// Cấu hình email transporter
const createTransporter = () => {
  const port = process.env.SMTP_PORT || 587;
  const secure = port == 465; // true for 465, false for other ports

  const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER, // Đặt trong .env
      pass: process.env.SMTP_PASS, // App password của Gmail
    },
    logger: true, // Log thông tin chi tiết
    debug: true, // Log cả traffic SMTP
    connectionTimeout: 10000, // 10 giây
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  console.log(
    `📧 Email Config: Host=${emailConfig.host}, Port=${emailConfig.port}, Secure=${emailConfig.secure}, User=${emailConfig.auth.user}`
  );

  return createTransport(emailConfig);
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

/**
 * Gửi OTP qua email
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP
 * @param {string} purpose - Mục đích (verify, reset, payment)
 */
export const sendOTP = async (email, otp, purpose = "verify") => {
  try {
    const transporter = createTransporter();

    const purposeText = {
      verify: "xác thực tài khoản",
      reset: "đặt lại mật khẩu",
      payment: "xác nhận thanh toán",
    };

    const mailOptions = {
      from: `"Orebi Shopping" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Mã OTP ${purposeText[purpose] || "xác thực"}`,
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã OTP</title>
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
              margin: 40px auto;
              background-color: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #3B82F6, #2563EB);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
              border: 2px dashed #3B82F6;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 48px;
              font-weight: bold;
              color: #1F2937;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 10px 0;
            }
            .otp-label {
              color: #6B7280;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .warning {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              text-align: left;
            }
            .warning-title {
              color: #92400E;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .warning-text {
              color: #78350F;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background: #F9FAFB;
              padding: 20px;
              text-align: center;
              color: #6B7280;
              font-size: 14px;
            }
            .info-item {
              margin: 15px 0;
              color: #4B5563;
            }
            .icon {
              font-size: 24px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🔐</div>
              <h1>Mã Xác Thực OTP</h1>
            </div>
            
            <div class="content">
              <p class="info-item">
                Bạn đã yêu cầu mã OTP để <strong>${
                  purposeText[purpose] || "xác thực"
                }</strong>
              </p>
              
              <div class="otp-box">
                <div class="otp-label">MÃ OTP CỦA BẠN:</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <div class="warning-title">⏰ Lưu ý quan trọng:</div>
                <p class="warning-text">
                  • Mã OTP này sẽ <strong>hết hạn sau 5 phút</strong><br>
                  • Không chia sẻ mã này với bất kỳ ai<br>
                  • Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email
                </p>
              </div>
              
              <p class="info-item" style="color: #6B7280; font-size: 14px;">
                Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi qua email hoặc hotline hỗ trợ.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 5px 0;">
                <strong>Orebi Shopping</strong>
              </p>
              <p style="margin: 5px 0;">
                Email: linhyang0702@gmail.com | Hotline: 0368251814
              </p>
              <p style="margin: 15px 0 5px; font-size: 12px; color: #9CA3AF;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`📧 Đã gửi OTP đến: ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("❌ Lỗi gửi OTP email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Gửi email xác nhận thanh toán chuyển khoản
 * @param {string} email - Email người nhận
 * @param {object} orderInfo - Thông tin đơn hàng
 */
export const sendPaymentConfirmationEmail = async (email, orderInfo) => {
  try {
    const transporter = createTransporter();
    const { orderId, amount, bankInfo, transactionCode } = orderInfo;

    const mailOptions = {
      from: `"Orebi Shopping" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Xác nhận thanh toán đơn hàng #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận thanh toán</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">✅ Xác Nhận Thanh Toán</h1>
            </div>
            
            <div style="padding: 30px;">
              <p>Cảm ơn bạn đã gửi thông tin thanh toán!</p>
              
              <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1F2937;">Thông tin đơn hàng:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Mã đơn hàng:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Số tiền:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #DC2626;">${amount?.toLocaleString(
                      "vi-VN"
                    )} đ</td>
                  </tr>
                  ${
                    transactionCode
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Mã giao dịch:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${transactionCode}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>
              
              <div style="background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1E40AF;">
                  <strong>📌 Trạng thái:</strong> Đang chờ xác nhận từ admin<br>
                  <small style="color: #6B7280;">Thời gian xác nhận: 5-15 phút trong giờ làm việc</small>
                </p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px;">
                Chúng tôi sẽ gửi email thông báo khi đơn hàng được xác nhận và bắt đầu giao hàng.
              </p>
            </div>
            
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 14px;">
              <p style="margin: 5px 0;"><strong>Orebi Shopping</strong></p>
              <p style="margin: 5px 0;">Email: support@orebishopping.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`📧 Đã gửi email xác nhận thanh toán đến: ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("❌ Lỗi gửi email xác nhận thanh toán:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
