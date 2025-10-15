import { v2 as cloudinary } from "cloudinary";
import { deleteCloudinaryImage } from "../config/cloudinary.js";
import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import { notifyNewReview } from "../services/notificationService.js";
import fs from "fs";

// Helper function to clean up temporary files
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Temporary file cleaned up:", filePath);
    }
  } catch (error) {
    console.error("Error cleaning up temporary file:", error);
  }
};

// Add product
const addProduct = async (req, res) => {
  try {
    const {
      _type,
      name,
      price,
      discountedPercentage,
      stock,
      category,
      brand,
      badge,
      isAvailable,
      offer,
      description,
      tags,
    } = req.body;
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    // Check for required fields
    if (!name || !price || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, price, category, and description are mandatory.",
      });
    }

    // Collect only the images that exist
    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        try {
          let result = await cloudinary.uploader.upload(item.path, {
            folder: "orebi/products",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });

          // Clean up temporary file after successful upload
          cleanupTempFile(item.path);

          return result.secure_url;
        } catch (error) {
          // Clean up temporary file even on error
          cleanupTempFile(item.path);
          throw error;
        }
      })
    );

    // Parse tags or split if necessary
    let parsedTags;
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    const numericStock = stock ? Number(stock) : 0;
    const productData = {
      _type: _type ? _type : "",
      name,
      price: Number(price),
      discountedPercentage: discountedPercentage
        ? Number(discountedPercentage)
        : 10,
      stock: numericStock,
      soldQuantity: 0,
      category,
      brand: brand ? brand : "",
      badge: badge === "true" ? true : false,
      // Auto-derive availability from stock so client lists the item
      isAvailable: numericStock > 0,
      offer: offer === "true" ? true : false,
      description,
      tags: tags ? parsedTags : [],
      images: imagesUrl,
    };

    const product = new productModel(productData);
    product.save();

    res.json({
      success: true,
      message: `${name} added and save to DB successfully`,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List products with filtering
const listProducts = async (req, res) => {
  try {
    const {
      _type,
      _id,
      _search,
      brand,
      category,
      offer,
      onSale,
      isAvailable,
      _page = 1,
      _perPage = 25,
    } = req.query;

    // Filter by specific ID
    if (_id) {
      const dbProduct = await productModel.findById(_id);
      if (dbProduct) {
        // Format product for frontend compatibility
        const formattedProduct = {
          ...dbProduct.toObject(),
          image:
            dbProduct.images && dbProduct.images.length > 0
              ? dbProduct.images[0]
              : "",
        };
        return res.json({ success: true, product: formattedProduct });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
    }

    // Build filter object for database query
    let filter = {};

    // Filter by availability (only show available products by default)
    if (isAvailable === "false") {
      filter.isAvailable = false;
    } else if (isAvailable === "all") {
      // Admin có thể xem tất cả sản phẩm bằng cách truyền "all"
      // Không thêm filter isAvailable
    } else {
      // Mặc định chỉ hiển thị sản phẩm available cho client
      filter.isAvailable = true;
    }

    // Filter by type
    if (_type) {
      filter._type = _type;
    }

    // Filter by brand
    if (brand) {
      filter.brand = brand;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by offer
    if (offer === "true") {
      filter.offer = true;
    }

    // Filter by onSale
    if (onSale === "true") {
      filter.onSale = true;
    }

    // Search by name or description
    if (_search) {
      const searchRegex = new RegExp(_search, "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Get database products
    let dbProducts = await productModel.find(filter).sort({ createdAt: -1 });

    // Format database products for frontend compatibility
    let formattedDbProducts = dbProducts.map((product) => ({
      ...product.toObject(),
      image:
        product.images && product.images.length > 0 ? product.images[0] : "",
    }));

    // Apply pagination
    const page = parseInt(_page, 10) || 1;
    const perPage = parseInt(_perPage, 10) || 25;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    const paginatedProducts = formattedDbProducts.slice(startIndex, endIndex);

    // Return response based on whether pagination is requested
    if (_page || _perPage) {
      res.json({
        success: true,
        products: paginatedProducts,
        currentPage: page,
        perPage,
        totalItems: formattedDbProducts.length,
        totalPages: Math.ceil(formattedDbProducts.length / perPage),
      });
    } else {
      res.json({
        success: true,
        products: formattedDbProducts,
        total: formattedDbProducts.length,
      });
    }
  } catch (error) {
    console.log("List products error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove product
const removeProduct = async (req, res) => {
  try {
    // First, find the product to get its images
    const product = await productModel.findById(req.body._id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Delete all product images from Cloudinary
    if (product.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        try {
          const deleteResult = await deleteCloudinaryImage(imageUrl);
          if (deleteResult.success) {
            console.log("Product image deleted from Cloudinary successfully");
          } else {
            console.log(
              "Failed to delete product image:",
              deleteResult.message
            );
          }
        } catch (error) {
          console.log("Error deleting product image from Cloudinary:", error);
          // Continue with deletion even if some images fail
        }
      }
    }

    // Delete the product from database
    await productModel.findByIdAndDelete(req.body._id);
    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Single product
const singleProducts = async (req, res) => {
  try {
    const productId = req.body._id || req.query._id || req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only return available products for non-admin requests
    if (!product.isAvailable && !req.user?.role === "admin") {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log("Single product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update stock after purchase
const updateStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required",
      });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    // Update stock and sold quantity
    product.stock -= quantity;
    product.soldQuantity += quantity;

    // If stock is 0, mark as unavailable
    if (product.stock === 0) {
      product.isAvailable = false;
    }

    await product.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      product: {
        _id: product._id,
        stock: product.stock,
        soldQuantity: product.soldQuantity,
        isAvailable: product.isAvailable,
      },
    });
  } catch (error) {
    console.log("Update stock error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      _type,
      name,
      price,
      discountedPercentage,
      stock,
      category,
      brand,
      badge,
      isAvailable,
      offer,
      description,
      tags,
    } = req.body;

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];

    // Find the existing product
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check for required fields
    if (!name || !price || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, price, category, and description are mandatory.",
      });
    }

    let imagesUrl = existingProduct.images; // Keep existing images by default

    // If new images are uploaded, upload them to cloudinary
    const newImages = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    if (newImages.length > 0) {
      try {
        const uploadPromises = newImages.map(async (item, index) => {
          const result = await cloudinary.uploader.upload(item.path, {
            folder: "orebi/products",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });

          // Clean up temporary file after successful upload
          cleanupTempFile(item.path);

          return { index, url: result.secure_url };
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Update only the new image positions
        uploadResults.forEach(({ index, url }) => {
          if (index < imagesUrl.length) {
            imagesUrl[index] = url;
          } else {
            imagesUrl.push(url);
          }
        });
      } catch (error) {
        console.error("Error uploading images:", error);
        // Clean up temp files on error
        newImages.forEach((item) => cleanupTempFile(item.path));
        return res.status(500).json({
          success: false,
          message: "Error uploading images",
        });
      }
    }

    // Parse tags
    let parsedTags;
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    const updatedStock = stock ? Number(stock) : 0;
    const updateData = {
      _type: _type || "",
      name,
      price: Number(price),
      discountedPercentage: discountedPercentage
        ? Number(discountedPercentage)
        : 10,
      stock: updatedStock,
      category,
      brand: brand || "",
      badge: badge === "true" ? true : false,
      // Keep availability in sync with stock
      isAvailable: updatedStock > 0,
      offer: offer === "true" ? true : false,
      description,
      tags: parsedTags,
      images: imagesUrl,
    };

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: `${name} updated successfully`,
      product: updatedProduct,
    });
  } catch (error) {
    console.log("Update product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Add product review
const addProductReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.id;

    // Handle image uploads if any
    console.log("🔍 DEBUG Review Creation:");
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);

    let reviewImages = [];
    // Support both upload.array("reviewImages") => req.files (array)
    // and upload.fields({ name: "reviewImages" }) => req.files.reviewImages
    let imageFiles = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      console.log("✅ Found review images (array mode):", req.files.length);
      imageFiles = req.files;
    } else if (req.files && req.files.reviewImages) {
      console.log(
        "✅ Found review images (fields mode):",
        req.files.reviewImages.length || 1
      );
      imageFiles = Array.isArray(req.files.reviewImages)
        ? req.files.reviewImages
        : [req.files.reviewImages];
    }

    if (imageFiles.length > 0) {
      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "orebi/reviews",
            resource_type: "image",
            transformation: [
              { width: 800, height: 600, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });
          // Clean up temp file
          cleanupTempFile(file.path);
          return result.secure_url;
        });

        reviewImages = await Promise.all(uploadPromises);
        console.log("✅ Review images uploaded:", reviewImages);
      } catch (uploadError) {
        console.error("Error uploading review images:", uploadError);
        // Clean up temp files on error
        imageFiles.forEach((file) => cleanupTempFile(file.path));
        return res.json({
          success: false,
          message: "Lỗi khi upload ảnh đánh giá",
        });
      }
    } else {
      console.log("❌ No review images found in request");
    }

    // Validate input
    if (!productId || !orderId || !rating || !comment) {
      return res.json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin đánh giá",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.json({
        success: false,
        message: "Đánh giá phải từ 1 đến 5 sao",
      });
    }

    // Verify that the user has purchased this product in this order
    const order = await orderModel
      .findOne({
        _id: orderId,
        userId: userId,
        // Temporarily allow all statuses for debugging
        // status: "delivered", // Only delivered orders can be reviewed
      })
      .populate("items.productId", "_id name");

    // Also try without populate to debug
    const orderNonPopulated = await orderModel.findOne({
      _id: orderId,
      userId: userId,
    });

    console.log("DEBUG: Order status:", order?.status);

    if (!order) {
      return res.json({
        success: false,
        message:
          "Đơn hàng không tồn tại. Bạn chỉ có thể đánh giá sản phẩm từ đơn hàng của mình",
      });
    }

    // Check if order is delivered (for production use)
    if (order.status !== "delivered") {
      console.log("DEBUG: Order not delivered, status:", order.status);
      // For now, we'll allow review for testing, but warn
      console.log(
        "WARNING: Allowing review for non-delivered order for testing"
      );
    }

    // Debug: Log order structure and productId
    console.log("=== DEBUG REVIEW ===");
    console.log("Looking for productId:", productId);
    console.log("Order found:", !!order);
    console.log("Order without populate:", {
      items: orderNonPopulated?.items?.map((item) => ({
        productId: item.productId?.toString(),
        name: item.name,
      })),
    });
    console.log(
      "Order items (populated):",
      JSON.stringify(
        order.items.map((item) => ({
          productId: item.productId,
          productIdType: typeof item.productId,
          productIdString: item.productId?.toString(),
          name: item.name,
          _id: item._id,
        })),
        null,
        2
      )
    );

    // Check if the product exists in the order
    const productInOrder = order.items.find((item) => {
      console.log("=== Checking item ===");
      console.log("- item:", item);
      console.log("- item.productId:", item.productId);
      console.log("- Looking for productId:", productId);

      // Handle both populated and non-populated cases
      let itemProductId;

      if (
        item.productId &&
        typeof item.productId === "object" &&
        item.productId._id
      ) {
        // Populated case: productId is an object with _id
        itemProductId = item.productId._id.toString();
      } else if (item.productId) {
        // Non-populated case: productId is ObjectId
        itemProductId = item.productId.toString();
      } else {
        console.log("- No productId found in item");
        return false;
      }

      const targetId = productId.toString();

      console.log("- Comparing:", itemProductId, "===", targetId);
      console.log("- Match:", itemProductId === targetId);

      return itemProductId === targetId;
    });

    console.log("Product found in order:", !!productInOrder);
    console.log("=== END DEBUG ===");

    if (!productInOrder) {
      return res.json({
        success: false,
        message:
          "Bạn chỉ có thể đánh giá sản phẩm từ đơn hàng đã được giao thành công",
      });
    }

    // Check if user has already reviewed this product for this order
    const existingReview = await reviewModel.findOne({
      productId,
      userId,
      orderId,
    });

    if (existingReview) {
      return res.json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi",
      });
    }

    // Create new review
    console.log("💾 Creating review with images:", reviewImages);
    const newReview = new reviewModel({
      productId,
      userId,
      orderId,
      rating: parseInt(rating),
      comment: comment.trim(),
      images: reviewImages,
    });

    await newReview.save();

    // Notify admin about new review
    try {
      const productName =
        productInOrder.name || productInOrder.productId?.name || "Sản phẩm";

      // Get user info for notification
      const userModel = (await import("../models/userModel.js")).default;
      const user = await userModel.findById(userId).select("name email");

      console.log("=== REVIEW NOTIFICATION ===");
      console.log("Product:", productName);
      console.log("Rating:", newReview.rating);
      console.log("User:", user?.name);
      console.log("=== END NOTIFICATION ===");

      await notifyNewReview(newReview, productName, user);
    } catch (notifyError) {
      console.error("Error sending review notification:", notifyError);
      // Don't fail the review creation if notification fails
    }

    res.json({
      success: true,
      message: "Đánh giá sản phẩm thành công! Cảm ơn bạn đã góp ý.",
      review: newReview,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.json({
      success: false,
      message: "Có lỗi xảy ra khi gửi đánh giá",
    });
  }
};

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log("=== DEBUG: Getting reviews for product:", productId);

    const reviews = await reviewModel
      .find({ productId }) // Removed isApproved: true to show all reviews
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });

    console.log("=== DEBUG: Found reviews:", reviews.length);
    if (reviews.length > 0) {
      console.log("=== DEBUG: Sample review:", reviews[0]);
    }

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.json({
      success: false,
      message: "Không thể tải đánh giá",
    });
  }
};

// Update product review
const updateProductReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Find existing review
    const existingReview = await reviewModel.findOne({
      _id: reviewId,
      userId: userId, // Only allow user to update their own review
    });

    if (!existingReview) {
      return res.json({
        success: false,
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa",
      });
    }

    // Handle new image uploads if any
    console.log("🔍 UPDATE REVIEW - IMAGES DEBUG:");
    console.log("- Existing review images:", existingReview.images);
    console.log("- req.files:", req.files);
    console.log("- req.body.removeImages:", req.body.removeImages);

    let newImages = [...existingReview.images]; // Keep existing images by default
    console.log("- newImages after copy:", newImages);

    // Support both array mode and fields mode for uploads
    if ((Array.isArray(req.files) && req.files.length > 0) || (req.files && req.files.reviewImages)) {
      console.log("✅ Found new files to upload");
      const imageFiles = Array.isArray(req.files)
        ? req.files
        : Array.isArray(req.files.reviewImages)
        ? req.files.reviewImages
        : [req.files.reviewImages];

      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "orebi/reviews",
            resource_type: "image",
            transformation: [
              { width: 800, height: 600, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });
          // Clean up temp file
          cleanupTempFile(file.path);
          return result.secure_url;
        });

        const uploadedImages = await Promise.all(uploadPromises);
        console.log("✅ New images uploaded:", uploadedImages);
        newImages = [...newImages, ...uploadedImages];
        console.log("✅ Combined images:", newImages);

        // Limit to maximum 5 images
        if (newImages.length > 5) {
          newImages = newImages.slice(0, 5);
          console.log("⚠️ Limited to 5 images:", newImages);
        }
      } catch (uploadError) {
        console.error("Error uploading review images:", uploadError);
        // Clean up temp files on error
        imageFiles.forEach((file) => cleanupTempFile(file.path));
        return res.json({
          success: false,
          message: "Lỗi khi upload ảnh đánh giá",
        });
      }
    } else {
      console.log("❌ No new files to upload");
    }

    // Handle image removal if specified
    if (req.body.removeImages) {
      const removeImages = JSON.parse(req.body.removeImages);
      console.log("🗑️ Removing images:", removeImages);
      // Remove specified images from cloudinary and array
      for (const imageUrl of removeImages) {
        try {
          await deleteCloudinaryImage(imageUrl);
          newImages = newImages.filter((img) => img !== imageUrl);
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }
      console.log("🗑️ Images after removal:", newImages);
    }

    console.log("💾 Final images before save:", newImages);

    // Update review
    const updatedReview = await reviewModel
      .findByIdAndUpdate(
        reviewId,
        {
          rating: parseInt(rating) || existingReview.rating,
          comment: comment?.trim() || existingReview.comment,
          images: newImages,
          isApproved: false, // Reset approval status after edit
        },
        { new: true }
      )
      .populate("userId", "name avatar");

    res.json({
      success: true,
      message: "Cập nhật đánh giá thành công!",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đánh giá",
    });
  }
};

// Get user's review count
const getUserReviewCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviewCount = await reviewModel.countDocuments({
      userId,
      isApproved: true,
    });

    res.json({
      success: true,
      reviewCount,
    });
  } catch (error) {
    console.error("Get user review count error:", error);
    res.json({
      success: false,
      message: "Không thể lấy số lượng đánh giá",
      reviewCount: 0,
    });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProducts,
  updateStock,
  updateProduct,
  addProductReview,
  updateProductReview,
  getProductReviews,
  getUserReviewCount,
};
