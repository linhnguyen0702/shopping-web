import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import reviewModel from "./models/reviewModel.js";
import userModel from "./models/userModel.js";
import productModel from "./models/productModel.js";

const approveAllReviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all reviews to approved
    const result = await reviewModel.updateMany(
      { isApproved: false },
      { isApproved: true }
    );

    console.log(`Updated ${result.modifiedCount} reviews to approved status`);

    // Check all reviews
    const allReviews = await reviewModel
      .find()
      .populate("userId", "name")
      .populate("productId", "name");

    console.log(`\nTotal reviews in database: ${allReviews.length}`);
    allReviews.forEach((review, index) => {
      console.log(`Review ${index + 1}:`, {
        id: review._id,
        product: review.productId?.name,
        user: review.userId?.name,
        rating: review.rating,
        approved: review.isApproved,
        comment: review.comment.substring(0, 50) + "...",
      });
    });

    console.log("\nAll reviews approved successfully!");
  } catch (error) {
    console.error("Error approving reviews:", error);
  } finally {
    mongoose.connection.close();
  }
};

approveAllReviews();
