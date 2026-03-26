import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false, // Cho phép chat ẩn danh
    },
    sessionId: {
      type: String,
      required: true, // ID phiên chat của người dùng
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "bot"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        intent: {
          type: String,
          enum: [
            "search",
            "price_inquiry",
            "recommendation",
            "latest",
            "bestseller",
            "greeting",
            "help",
          ],
          default: "search",
        },
        products: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "product",
            },
            name: String,
            price: Number,
            image: String,
            category: String,
            brand: String,
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      lastKeywords: [String], // Từ khóa cuối cùng tìm kiếm
      lastCategory: String,
      priceRange: {
        min: Number,
        max: Number,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Tự động xóa sau 24 giờ
    },
  },
  {
    timestamps: true,
  },
);

// Index cho tìm kiếm nhanh
chatHistorySchema.index({ sessionId: 1 });
chatHistorySchema.index({ userId: 1 });
chatHistorySchema.index({ createdAt: -1 });

const chatHistoryModel =
  mongoose.models.chatHistory ||
  mongoose.model("chatHistory", chatHistorySchema);

export default chatHistoryModel;
