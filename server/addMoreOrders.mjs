import orderModel from "./models/orderModel.js";
import userModel from "./models/userModel.js";
import productModel from "./models/productModel.js";
import dbConnect from "./config/mongodb.js";
import "dotenv/config";

const addMoreSampleOrders = async () => {
  try {
    await dbConnect();

    // Tìm user và product hiện có
    const user = await userModel.findOne();
    const product = await productModel.findOne();

    if (!user || !product) {
      console.log(
        "No user or product found. Please run createSampleOrders.mjs first."
      );
      return;
    }

    const currentOrderCount = await orderModel.countDocuments();
    console.log(`Current orders in database: ${currentOrderCount}`);

    // Tạo thêm 2 đơn hàng nữa
    const additionalOrders = [
      {
        userId: user._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image?.[0] || "https://via.placeholder.com/300",
          },
        ],
        amount: product.price,
        address: {
          firstName: "Trần",
          lastName: "Thị B",
          email: "tran.b@example.com",
          street: "159 Lê Lợi",
          city: "Hồ Chí Minh",
          state: "Hồ Chí Minh",
          zipcode: "70000",
          country: "Việt Nam",
          phone: "0912345678",
        },
        paymentMethod: "cod",
        status: "shipped",
        paymentStatus: "paid",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
      },
      {
        userId: user._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 4,
            image: product.image?.[0] || "https://via.placeholder.com/300",
          },
        ],
        amount: product.price * 4,
        address: {
          firstName: "Lê",
          lastName: "Văn C",
          email: "le.c@example.com",
          street: "321 Nguyễn Huệ",
          city: "Cần Thơ",
          state: "Cần Thơ",
          zipcode: "90000",
          country: "Việt Nam",
          phone: "0845123456",
        },
        paymentMethod: "cod",
        status: "cancelled",
        paymentStatus: "failed",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
      },
    ];

    for (const orderData of additionalOrders) {
      const order = new orderModel(orderData);
      await order.save();
      console.log(
        `✅ Created order: ${order._id} - Status: ${order.status} - Payment: ${order.paymentStatus}`
      );
    }

    const finalOrderCount = await orderModel.countDocuments();
    console.log(`\n🎉 Total orders in database: ${finalOrderCount}`);
    console.log("Admin dashboard now has sample data to test with!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit();
  }
};

addMoreSampleOrders();
