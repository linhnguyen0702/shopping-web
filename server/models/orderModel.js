import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      image: {
        type: String,
      },
      selectedLabel: {
        type: String,
        default: "",
      },
      shippingFee: {
        type: Number,
        default: 0,
      },
      isDelivered: {
        type: Boolean,
        default: false,
      },
    },
  ],
  amount: {
    type: Number,
    required: true,
  },
  shippingMethod: {
    provider: {
      type: String,
      enum: ["ghn", "ghtk", "viettel-post", "j&t", "grab-express"],
      default: "ghn",
    },
    serviceName: {
      type: String,
      default: "Standard",
    },
    totalFee: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: {
      type: String,
      default: "3-5 ngày",
    },
  },
  address: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: [
      "draft",
      "pending",
      "confirmed",
      "partially-shipped",
      "shipped",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "bank_transfer", "qr_code", "vnpay"],
    default: "cod",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  bankTransferInfo: {
    transactionCode: String,
    submittedAt: Date,
    verified: Boolean,
    verifiedAt: Date,
    rejectedAt: Date,
  },
  vnpayInfo: {
    transactionNo: String,
    bankCode: String,
    paidAt: Date,
    failedAt: Date,
    responseCode: String,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  deliveries: [
    {
      status: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"],
        default: "pending",
      },
      trackingCode: { type: String },
      createdAt: { type: Date, default: Date.now },
      items: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
          name: { type: String },
          quantity: { type: Number },
          image: { type: String },
        },
      ],
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
