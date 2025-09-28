import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["order", "user", "login", "product", "system", "warning"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 200,
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Lưu thêm data liên quan (orderId, userId, etc.)
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Metadata với structure chuẩn
      default: {},
    },
    recipients: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isGlobal: {
      type: Boolean,
      default: false, // true nếu thông báo cho tất cả admin
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Index cho performance
notificationSchema.index({ "recipients.userId": 1, "recipients.isRead": 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });

const notificationModel = mongoose.model("notification", notificationSchema);

export default notificationModel;
