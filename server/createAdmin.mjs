import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "./models/userModel.js";
import "dotenv/config";

const createInitialAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Người dùng quản trị đã tồn tại:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@orebi.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
    const adminName = process.env.ADMIN_NAME || "Admin User";

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new userModel({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Người dùng quản trị ban đầu đã tạo thành công!");
    console.log("Email:", adminEmail);
    console.log("Mật khẩu:", adminPassword);
    console.log("⚠️  Vui lòng thay đổi mật khẩu mặc định sau khi đăng nhập lần đầu");
  } catch (error) {
    console.error("Lỗi tạo người dùng quản trị:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Ngắt kết nối với MongoDB");
    process.exit(0);
  }
};

createInitialAdmin();
