import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import productModel from "./models/productModel.js";
import userModel from "./models/userModel.js";
import orderModel from "./models/orderModel.js";
import reviewModel from "./models/reviewModel.js";

const createTestReview = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get first product
    const product = await productModel.findOne();
    if (!product) {
      console.log("No products found");
      return;
    }
    console.log("Found product:", product.name);

    // Get first user
    const user = await userModel.findOne();
    if (!user) {
      console.log("No users found");
      return;
    }
    console.log("Found user:", user.name);

    // Create a test order first
    const testOrder = new orderModel({
      userId: user._id,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images?.[0] || product.image || "",
        },
      ],
      amount: product.price,
      address: {
        firstName: user.name.split(" ")[0] || user.name,
        lastName: user.name.split(" ").slice(1).join(" ") || "Test",
        email: user.email,
        phone: "0123456789",
        street: "Test Street",
        city: "Test City",
        state: "Test State",
        zipcode: "12345",
        country: "Vietnam",
      },
      status: "delivered",
      payment: true,
      date: new Date(),
    });

    await testOrder.save();
    console.log("Created test order:", testOrder._id);

    // Create test reviews
    const testReviews = [
      {
        productId: product._id,
        userId: user._id,
        orderId: testOrder._id,
        rating: 5,
        comment: "Sản phẩm tuyệt vời! Chất lượng rất tốt và giao hàng nhanh.",
        isApproved: true,
      },
      {
        productId: product._id,
        userId: user._id,
        orderId: testOrder._id,
        rating: 4,
        comment: "Sản phẩm đẹp, đóng gói cẩn thận. Sẽ mua lại lần sau.",
        isApproved: true,
      },
      {
        productId: product._id,
        userId: user._id,
        orderId: testOrder._id,
        rating: 5,
        comment:
          "Rất hài lòng với sản phẩm này. Giá cả hợp lý, chất lượng tốt.",
        isApproved: true,
      },
    ];

    // Check if reviews already exist
    const existingReviews = await reviewModel.find({
      productId: product._id,
      userId: user._id,
    });

    if (existingReviews.length > 0) {
      console.log("Reviews already exist for this product and user");
      console.log("Existing reviews count:", existingReviews.length);
    } else {
      // Create reviews
      for (let i = 0; i < testReviews.length; i++) {
        const review = new reviewModel(testReviews[i]);
        await review.save();
        console.log(`Created review ${i + 1}:`, review._id);
      }
    }

    // Check total reviews for this product
    const allReviews = await reviewModel
      .find({ productId: product._id, isApproved: true })
      .populate("userId", "name email");

    console.log(
      `\nTotal approved reviews for ${product.name}:`,
      allReviews.length
    );
    allReviews.forEach((review, index) => {
      console.log(`Review ${index + 1}:`, {
        rating: review.rating,
        comment: review.comment.substring(0, 50) + "...",
        user: review.userId.name,
      });
    });

    // Calculate average rating
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating = totalRating / allReviews.length;
      console.log(`Average rating: ${avgRating.toFixed(1)}/5`);
    }

    console.log("\nTest reviews created successfully!");
    console.log(`Product ID: ${product._id}`);
    console.log(
      `You can now test the reviews API at: /api/product/${product._id}/reviews`
    );
  } catch (error) {
    console.error("Error creating test review:", error);
  } finally {
    mongoose.connection.close();
  }
};

createTestReview();
