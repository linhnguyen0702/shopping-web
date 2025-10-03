import orderModel from "./models/orderModel.js";
import productModel from "./models/productModel.js";
import dbConnect from "./config/mongodb.js";
import "dotenv/config";

const fixOrderImages = async () => {
  try {
    await dbConnect();

    // Tìm tất cả đơn hàng có placeholder image
    const ordersWithPlaceholder = await orderModel
      .find({
        "items.image": "https://via.placeholder.com/300",
      })
      .populate("items.productId", "images");

    console.log(
      `Found ${ordersWithPlaceholder.length} orders with placeholder images`
    );

    for (const order of ordersWithPlaceholder) {
      let updated = false;

      // Cập nhật từng item trong đơn hàng
      for (const item of order.items) {
        if (
          item.image === "https://via.placeholder.com/300" &&
          item.productId &&
          item.productId.images &&
          item.productId.images.length > 0
        ) {
          const oldImage = item.image;
          item.image = item.productId.images[0]; // Lấy hình ảnh đầu tiên từ product
          console.log(`Updating ${item.name}:`);
          console.log(`  From: ${oldImage}`);
          console.log(`  To: ${item.image}`);
          updated = true;
        }
      }

      if (updated) {
        await order.save();
        console.log(`✅ Updated order ${order._id}`);
      }
    }

    console.log("\n🎉 All placeholder images have been fixed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit();
  }
};

fixOrderImages();
