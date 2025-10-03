import orderModel from "./models/orderModel.js";
import productModel from "./models/productModel.js";
import dbConnect from "./config/mongodb.js";
import "dotenv/config";

const checkOrderImages = async () => {
  try {
    await dbConnect();

    // Lấy tất cả đơn hàng
    const orders = await orderModel
      .find({})
      .populate("items.productId", "name images");

    console.log(`Found ${orders.length} orders`);

    orders.forEach((order, orderIndex) => {
      console.log(`\n--- Order ${orderIndex + 1} (ID: ${order._id}) ---`);
      order.items.forEach((item, itemIndex) => {
        console.log(`Item ${itemIndex + 1}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Image in order: ${item.image}`);
        if (item.productId) {
          console.log(
            `  Product images: ${JSON.stringify(item.productId.images)}`
          );
        }
        console.log(`  Product ID: ${item.productId?._id || "No productId"}`);
      });
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
};

checkOrderImages();
