import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ReviewModel = mongoose.model("Review", reviewSchema);

async function testReviewImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find existing review to update
    const existingReview = await ReviewModel.findOne().sort({ createdAt: -1 });

    if (!existingReview) {
      console.log("❌ No reviews found");
      return;
    }

    console.log("📄 Found review:", {
      id: existingReview._id,
      productId: existingReview.productId,
      rating: existingReview.rating,
      comment: existingReview.comment.substring(0, 50) + "...",
      currentImages: existingReview.images,
    });

    // Add test images
    const testImages = [
      "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Test+Image+1",
      "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Test+Image+2",
    ];

    // Update review with images
    existingReview.images = testImages;
    existingReview.updatedAt = new Date();

    await existingReview.save();

    console.log("✅ Review updated with test images");
    console.log("🖼️ Images added:", testImages);

    // Verify the update
    const updatedReview = await ReviewModel.findById(existingReview._id);
    console.log("✅ Verification - Review images:", updatedReview.images);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testReviewImages();
