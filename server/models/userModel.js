import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    userCart: {
      type: Object,
      default: {},
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    addresses: [
      {
        label: { type: String, required: true }, // e.g., 'Home', 'Work', 'Billing'
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      },
    ],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    avatar: { type: String, default: "" },
    resetOtp: { type: String, default: "" },
    resetOtpExpires: { type: Date },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ["public", "private"],
          default: "public",
        },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
      },
      language: { type: String, default: "vi" },
      currency: { type: String, default: "VND" },
    },
  },
  {
    minimize: false,
    timestamps: true,
  }
);

// Index for better query performance
userSchema.index({ role: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
