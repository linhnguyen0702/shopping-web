import "dotenv/config";
import dbConnect from "./config/mongodb.js";
import productModel from "./models/productModel.js";

/**
 * Migration script to add shipping information to existing products
 * Run: node server/migrateShipping.mjs
 */

const migrateShipping = async () => {
  try {
    console.log("🚀 Starting shipping migration...");

    await dbConnect();
    console.log("✅ Connected to database");

    // Get all products
    const products = await productModel.find({});
    console.log(`📦 Found ${products.length} products to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Skip if product already has shipping info
      if (product.shipping && product.shipping.weight) {
        console.log(`⏭️  Skipping ${product.name} - already has shipping info`);
        skippedCount++;
        continue;
      }

      // Determine shipping class based on product category/type
      let shippingClass = "standard";
      let weight = 0.5; // Default 500g
      let dimensions = { length: 20, width: 15, height: 10 };
      let freeShipping = false;

      // Category-based logic (customize based on your categories)
      const category = product.category?.toLowerCase() || "";

      if (category.includes("electronics") || category.includes("điện tử")) {
        shippingClass = "fragile";
        weight = 1.0;
        dimensions = { length: 30, width: 25, height: 15 };
      } else if (
        category.includes("furniture") ||
        category.includes("nội thất")
      ) {
        shippingClass = "bulky";
        weight = 5.0;
        dimensions = { length: 100, width: 50, height: 50 };
      } else if (
        category.includes("fashion") ||
        category.includes("thời trang")
      ) {
        weight = 0.3;
        dimensions = { length: 30, width: 20, height: 5 };
      } else if (
        category.includes("jewelry") ||
        category.includes("trang sức")
      ) {
        shippingClass = "express";
        weight = 0.1;
        dimensions = { length: 10, width: 10, height: 5 };
      }

      // Free shipping for expensive items (>= 500,000 VND)
      if (product.price >= 500000) {
        freeShipping = true;
      }

      // Update product with shipping info
      await productModel.findByIdAndUpdate(product._id, {
        $set: {
          shipping: {
            weight,
            dimensions,
            freeShipping,
            shippingClass,
          },
        },
      });

      console.log(`✅ Updated ${product.name}`);
      console.log(`   - Weight: ${weight}kg`);
      console.log(`   - Class: ${shippingClass}`);
      console.log(`   - Free shipping: ${freeShipping ? "Yes" : "No"}`);
      updatedCount++;
    }

    console.log("\n🎉 Migration completed!");
    console.log(`   - Updated: ${updatedCount} products`);
    console.log(`   - Skipped: ${skippedCount} products`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
migrateShipping();
