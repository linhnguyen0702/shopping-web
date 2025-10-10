import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5; // Maximum 5 images per review
        },
        message: "Tối đa 5 ảnh cho mỗi đánh giá",
      },
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin cần phê duyệt
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo một user chỉ có thể review một sản phẩm một lần cho mỗi đơn hàng
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });

const reviewModel =
  mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;
