import mongoose from "mongoose";

const tempOrderSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        selectedLabel: { type: String, default: "" },
      },
    ],
    amount: { type: Number, required: true },
    address: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipcode: { type: String },
      country: { type: String },
      phone: { type: String, required: true },
    },
    shippingMethod: { type: Object },
    shippingFee: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    // Expire documents after 1 hour to clean up abandoned transactions
    createdAt: { type: Date, default: Date.now, expires: 3600 },
  },
  { timestamps: true }
);

const tempOrderModel = mongoose.model("TempOrder", tempOrderSchema);

export default tempOrderModel;

