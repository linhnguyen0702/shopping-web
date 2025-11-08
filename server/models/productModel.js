import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    _type: { type: String },
    name: { type: String, required: true },
    images: { type: Array, required: true },
    price: { type: Number, required: true },
    discountedPercentage: { type: Number, required: true, default: 10 },
    stock: { type: Number, required: true, default: 0 },
    soldQuantity: { type: Number, default: 0 },
    category: { type: String, required: true },
    brand: { type: String },
    badge: { type: Boolean },
    isAvailable: { type: Boolean },
    offer: { type: Boolean },
    description: { type: String, required: true },
    tags: { type: Array },
    // Thông tin vận chuyển
    shipping: {
      weight: { type: Number, default: 0.5 }, // kg
      dimensions: {
        length: { type: Number, default: 20 }, // cm
        width: { type: Number, default: 15 }, // cm
        height: { type: Number, default: 10 }, // cm
      },
      freeShipping: { type: Boolean, default: false },
      shippingClass: {
        type: String,
        enum: ["standard", "express", "fragile", "bulky"],
        default: "standard",
      },
    },
  },
  {
    timestamps: true,
  }
);

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
