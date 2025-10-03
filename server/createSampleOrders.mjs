import orderModel from "./models/orderModel.js";
import userModel from "./models/userModel.js";
import productModel from "./models/productModel.js";
import dbConnect from "./config/mongodb.js";
import "dotenv/config";

const createSampleOrders = async () => {
  try {
    console.log("Connecting to database...");
    await dbConnect();

    // Tìm user đầu tiên trong database (hoặc tạo user mẫu)
    let user = await userModel.findOne();
    if (!user) {
      user = new userModel({
        name: "Nguyễn Văn A",
        email: "user@example.com",
        password: "hashedpassword", // In real app, this should be hashed
        role: "user",
        isActive: true,
      });
      await user.save();
      console.log("Created sample user:", user.name);
    }

    // Tìm sản phẩm đầu tiên trong database (hoặc tạo sản phẩm mẫu)
    let product = await productModel.findOne();
    if (!product) {
      product = new productModel({
        name: "Sản phẩm mẫu",
        description: "Mô tả sản phẩm mẫu",
        price: 100000,
        image: ["https://via.placeholder.com/300"],
        category: "sample",
        subCategory: "test",
        sizes: ["M", "L"],
        bestseller: false,
      });
      await product.save();
      console.log("Created sample product:", product.name);
    }

    // Kiểm tra xem đã có đơn hàng nào chưa
    const existingOrders = await orderModel.countDocuments();
    if (existingOrders > 0) {
      console.log(`Database đã có ${existingOrders} đơn hàng.`);
      return;
    }

    console.log("Creating sample orders...");

    // Tạo 3 đơn hàng mẫu với các trạng thái khác nhau
    const sampleOrders = [
      {
        userId: user._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 2,
            image: product.image[0],
          },
        ],
        amount: product.price * 2,
        address: {
          firstName: "Nguyễn",
          lastName: "Văn A",
          email: "user@example.com",
          street: "123 Đường ABC",
          city: "Hồ Chí Minh",
          state: "Hồ Chí Minh",
          zipcode: "70000",
          country: "Việt Nam",
          phone: "0123456789",
        },
        paymentMethod: "cod",
        status: "pending",
        paymentStatus: "pending",
        date: new Date(),
      },
      {
        userId: user._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image[0],
          },
        ],
        amount: product.price,
        address: {
          firstName: "Nguyễn",
          lastName: "Văn A",
          email: "user@example.com",
          street: "456 Đường XYZ",
          city: "Hà Nội",
          state: "Hà Nội",
          zipcode: "10000",
          country: "Việt Nam",
          phone: "0987654321",
        },
        paymentMethod: "online",
        status: "confirmed",
        paymentStatus: "paid",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 ngày trước
      },
      {
        userId: user._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 3,
            image: product.image[0],
          },
        ],
        amount: product.price * 3,
        address: {
          firstName: "Nguyễn",
          lastName: "Văn A",
          email: "user@example.com",
          street: "789 Đường DEF",
          city: "Đà Nẵng",
          state: "Đà Nẵng",
          zipcode: "50000",
          country: "Việt Nam",
          phone: "0369852147",
        },
        paymentMethod: "cod",
        status: "delivered",
        paymentStatus: "paid",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
      },
    ];

    // Lưu các đơn hàng vào database
    for (const orderData of sampleOrders) {
      const order = new orderModel(orderData);
      await order.save();
      console.log(`Created order: ${order._id} - Status: ${order.status}`);
    }

    console.log("✅ Successfully created sample orders!");
    console.log(
      "Bạn có thể chạy admin dashboard để xem và chỉnh sửa đơn hàng."
    );
  } catch (error) {
    console.error("❌ Error creating sample orders:", error);
  } finally {
    process.exit();
  }
};

createSampleOrders();
