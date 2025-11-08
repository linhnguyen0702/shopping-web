import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["verify", "reset", "payment"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Tự động xóa sau 10 phút
  },
});

// Index để tăng tốc độ truy vấn
otpSchema.index({ userId: 1, used: 1, expiresAt: 1 });
otpSchema.index({ email: 1, used: 1, expiresAt: 1 });

export default mongoose.model("OTP", otpSchema);
