import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import {
  notifyNewUserRegistration,
  notifyUserLogin,
} from "../services/notificationService.js";
import { cloudinary, deleteCloudinaryImage } from "../config/cloudinary.js";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { promises as dns } from "dns";
import { sendOTP } from "../services/emailService.js";

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

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Route for user login
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    if (!user.isActive) {
      return res.json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = createToken(user);

      // 🔔 Tạo thông báo user login (tất cả accounts, async, không chờ)
      notifyUserLogin(user).catch((error) => {
        console.error("Lỗi tạo thông báo login:", error);
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Đăng nhập thành công",
      });
    } else {
      res.json({ success: false, message: "Thông tin đăng nhập không chính xác" });
    }
  } catch (error) {
    console.log("User Login Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user registration
const userRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      address,
      isActive = true,
    } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Người dùng đã tồn tại" });
    }

    // Validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập địa chỉ email hợp lệ",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      });
    }

    // Only allow admin role creation if the request comes from an admin
    if (role === "admin" && (!req.user || req.user.role !== "admin")) {
      return res.json({
        success: false,
        message: "Chỉ quản trị viên mới có thể tạo tài khoản quản trị",
      });
    }

    // Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: role,
      isActive: isActive,
      address: address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
      },
    });

    const user = await newUser.save();

    const token = createToken(user);

    // 🔔 Tạo thông báo user đăng ký mới (async, không chờ)
    notifyNewUserRegistration(user).catch((error) => {
      console.error("Lỗi tạo thông báo đăng ký:", error);
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    console.log("User Register Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login (now uses role-based authentication)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Tài khoản không tồn tại" });
    }

    if (user.role !== "admin") {
      return res.json({ success: false, message: "Yêu cầu quyền admin" });
    }

    if (!user.isActive) {
      return res.json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = createToken(user);

      // 🔔 Tạo thông báo admin login (async, không chờ)
      console.log(
        "🎯 Admin login thành công, tạo notification cho:",
        user.name,
        user.email
      );
      notifyUserLogin(user).catch((error) => {
        console.error("❌ Lỗi tạo thông báo admin login:", error);
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Chào mừng bạn quay trở lại",
      });
    } else {
      res.json({ success: false, message: "Mật khẩu không chính xác" });
    }
  } catch (error) {
    console.log("Đăng nhập admin thất bại", error);
    res.json({ success: false, message: error.message });
  }
};

// Send OTP for password reset
const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || "").toString().trim().toLowerCase();
    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: "Email không hợp lệ" });
    }

    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ success: false, message: "Email không tồn tại" });
    }

    // Kiểm tra domain email có MX records (khả năng nhận mail) - chỉ bật ở production
    if (process.env.NODE_ENV !== "development") {
      try {
        const domain = normalizedEmail.split("@")[1];
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
          return res.json({
            success: false,
            message: "Email không thể nhận thư (không có MX)",
          });
        }
      } catch (mxErr) {
        return res.json({
          success: false,
          message: "Email không thể nhận thư (MX lỗi)",
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOtp = otpHash;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    // Sử dụng emailService để gửi OTP với template đẹp
    try {
      const emailResult = await sendOTP(normalizedEmail, otp, "reset");

      if (emailResult.success) {
        return res.json({
          success: true,
          message: "Mã OTP đã được gửi đến email của bạn",
        });
      } else {
        return res.json({
          success: false,
          message: "Không thể gửi email OTP",
        });
      }
    } catch (mailErr) {
      console.log("Email send error", mailErr);
      return res.json({
        success: false,
        message: "Gửi email OTP thất bại",
      });
    }
  } catch (error) {
    console.log("Send OTP Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Verify OTP
const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.json({
        success: false,
        message: "Email và OTP là bắt buộc",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }
    if (
      !user.resetOtp ||
      !user.resetOtpExpires ||
      user.resetOtpExpires < new Date()
    ) {
      return res.json({
        success: false,
        message: "OTP đã hết hạn hoặc chưa được yêu cầu",
      });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== user.resetOtp) {
      return res.json({ success: false, message: "Mã OTP không hợp lệ" });
    }

    // Issue a short-lived token to allow password reset
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ success: true, message: "Xác thực OTP thành công", resetToken });
  } catch (error) {
    console.log("Verify OTP Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Reset password with verified token
const resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.json({ success: false, message: "Thiếu dữ liệu" });
    }
    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    if (payload.purpose !== "password_reset") {
      return res.json({ success: false, message: "Mục đích token không hợp lệ" });
    }

    const user = await userModel.findById(payload.id);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // clear OTP fields
    user.resetOtp = "";
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.log("Reset Password Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Reset password directly by email (no OTP)
const resetPasswordDirect = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = (email || "").toString().trim().toLowerCase();
    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: "Email không hợp lệ" });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu tối thiểu 8 ký tự",
      });
    }

    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ success: false, message: "Email không tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // Clear any previous OTP state if present
    user.resetOtp = "";
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.log("Reset Password Direct Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Google login with ID token
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.json({ success: false, message: "Thiếu token Google" });
    }
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.json({ success: false, message: "Token Google không hợp lệ" });
    }
    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.email?.split("@")[0] || "User";
    if (!email) {
      return res.json({
        success: false,
        message: "Tài khoản Google không có email",
      });
    }

    let user = await userModel.findOne({ email });
    if (!user) {
      // create user with random password
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, salt);
      user = await userModel.create({
        name,
        email,
        password: hashed,
        role: "user",
      });
    }
    if (!user.isActive) {
      return res.json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Đăng nhập bằng Google thành công",
    });
  } catch (error) {
    console.log("Google Login Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Google OAuth (Authorization Code) with react-oauth/google
// Expects body: { code: string }
const googleLoginWithCode = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return res.json({
        success: false,
        message: "Thiếu mã xác thực",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "postmessage"; // react-oauth/google default

    if (!clientId || !clientSecret) {
      return res.json({
        success: false,
        message: "Google OAuth chưa được cấu hình",
      });
    }

    const oauthClient = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    // Exchange code for tokens
    let tokensResponse;
    try {
      const { tokens } = await oauthClient.getToken({ code });
      tokensResponse = tokens;
    } catch (err) {
      return res.json({
        success: false,
        message: "Không thể đổi mã lấy token",
      });
    }

    const idToken = tokensResponse.id_token;
    if (!idToken) {
      return res.json({
        success: false,
        message: "Google không trả về id_token",
      });
    }

    // Verify ID token
    let ticket;
    try {
      ticket = await oauthClient.verifyIdToken({ idToken, audience: clientId });
    } catch (err) {
      return res.json({ success: false, message: "id_token Google không hợp lệ" });
    }

    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.email?.split("@")[0] || "User";
    if (!email) {
      return res.json({
        success: false,
        message: "Tài khoản Google không có email",
      });
    }

    let user = await userModel.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, salt);
      user = await userModel.create({
        name,
        email,
        password: hashed,
        role: "user",
      });
    }

    if (!user.isActive) {
      return res.json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Đăng nhập bằng Google thành công",
    });
  } catch (error) {
    console.log("Google Login Code Error", error);
    res.json({ success: false, message: error.message });
  }
};

const removeUser = async (req, res) => {
  try {
    // First, find the user to get their avatar URL
    const user = await userModel.findById(req.body._id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Delete user's avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const deleteResult = await deleteCloudinaryImage(user.avatar);
        if (deleteResult.success) {
          console.log("User avatar deleted from Cloudinary successfully");
        } else {
          console.log(
            "Failed to delete user avatar from Cloudinary:",
            deleteResult.message
          );
        }
      } catch (error) {
        console.log("Error deleting user avatar from Cloudinary:", error);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete the user from database
    await userModel.findByIdAndDelete(req.body._id);
    res.json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    console.log("Removed user Error", error);
    res.json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { _id, name, email, password, role, avatar, addresses, isActive } =
      req.body;

    // Support both URL param :id and body _id
    const targetUserId = req.params?.id || _id;
    if (!targetUserId) {
      return res.json({ success: false, message: "Thiếu ID người dùng" });
    }

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (name) user.name = name;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Vui lòng nhập một địa chỉ email hợp lệ",
        });
      }
      user.email = email;
    }

    if (role) {
      // Only allow admin role updates if the requesting user is admin
      if (role === "admin" && (!req.user || req.user.role !== "admin")) {
        return res.json({
          success: false,
          message: "Chỉ quản trị viên mới có thể gán quyền quản trị",
        });
      }
      user.role = role;
    }

    // Handle avatar update
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // Handle new addresses array
    if (addresses) {
      user.addresses = addresses;
    }

    // Handle isActive field - only admins can change account status
    if (isActive !== undefined && req.user && req.user.role === "admin") {
      user.isActive = isActive;
    }

    if (password) {
      if (password.length < 8) {
        return res.json({
          success: false,
          message: "Mật khẩu phải có ít nhất 8 ký tự",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ success: true, message: "Cập nhật người dùng thành công" });
  } catch (error) {
    console.log("Update user Error", error);
    res.json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (role) {
      filter.role = role;
    }

    const total = await userModel.countDocuments(filter);
    const users = await userModel
      .find(filter)
      .select("-password") // Exclude password from response
      .populate("orders")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Address Management Functions

// Add new address for user
const addAddress = async (req, res) => {
  try {
    const userId = req.user?.id; // Get from auth middleware for user routes
    const paramUserId = req.params?.userId; // Get from params for admin routes
    const targetUserId = userId || paramUserId;

    const { label, street, city, state, zipCode, country, phone, isDefault } =
      req.body;

    // Validate required fields
    if (!label || !street || !city || !state || !zipCode || !country) {
      return res.json({
        success: false,
        message:
          "All address fields are required (label, street, city, state, zipCode, country)",
      });
    }

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // If this is being set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // If this is the first address, make it default
    const newAddress = {
      label,
      street,
      city,
      state,
      zipCode,
      country,
      phone: phone || "",
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      message: "Thêm địa chỉ thành công",
      address: newAddress,
    });
  } catch (error) {
    console.log("Add Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update existing address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id; // Get from auth middleware for user routes
    const paramUserId = req.params?.userId; // Get from params for admin routes
    const targetUserId = userId || paramUserId;
    const { addressId } = req.params;
    const { label, street, city, state, zipCode, country, phone, isDefault } =
      req.body;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Không tìm thấy địa chỉ" });
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // Update the address
    const updatedAddress = {
      ...user.addresses[addressIndex].toObject(),
      label: label || user.addresses[addressIndex].label,
      street: street || user.addresses[addressIndex].street,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
      zipCode: zipCode || user.addresses[addressIndex].zipCode,
      country: country || user.addresses[addressIndex].country,
      phone: phone !== undefined ? phone : user.addresses[addressIndex].phone,
      isDefault:
        isDefault !== undefined
          ? isDefault
          : user.addresses[addressIndex].isDefault,
    };

    user.addresses[addressIndex] = updatedAddress;
    await user.save();

    res.json({
      success: true,
      message: "Cập nhật địa chỉ thành công",
      address: updatedAddress,
    });
  } catch (error) {
    console.log("Update Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?.id; // Get from auth middleware for user routes
    const paramUserId = req.params?.userId; // Get from params for admin routes
    const targetUserId = userId || paramUserId;
    const { addressId } = req.params;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Không tìm thấy địa chỉ" });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are remaining addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Xóa địa chỉ thành công",
    });
  } catch (error) {
    console.log("Delete Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user?.id; // Get from auth middleware for user routes
    const paramUserId = req.params?.userId; // Get from params for admin routes
    const targetUserId = userId || paramUserId;
    const { addressId } = req.params;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Không tìm thấy địa chỉ" });
    }

    // Remove default from all addresses and set the specified one as default
    user.addresses.forEach((addr) => (addr.isDefault = false));
    user.addresses[addressIndex].isDefault = true;

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật địa chỉ mặc định thành công",
    });
  } catch (error) {
    console.log("Set Default Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user?.id; // Get from auth middleware for user routes
    const paramUserId = req.params?.userId; // Get from params for admin routes
    const targetUserId = userId || paramUserId;

    const user = await userModel.findById(targetUserId).select("addresses");
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.log("Get Addresses Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Avatar upload function
const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "Không có tệp được tải lên" });
    }

    // Upload image to Cloudinary in the orebi/users folder
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "orebi/users",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Clean up temporary file
    cleanupTempFile(req.file.path);

    res.json({
      success: true,
      message: "Tải lên ảnh đại diện thành công",
      avatarUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.log("Avatar upload error", error);

    // Clean up temporary file even on error
    if (req.file?.path) {
      cleanupTempFile(req.file.path);
    }

    res.json({ success: false, message: error.message });
  }
};

// Get user account statistics
const getUserStats = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate("orders");

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const stats = {
      totalOrders: user.orders ? user.orders.length : 0,
      cartItems: Object.keys(user.userCart || {}).length,
      wishlistItems: 0, // Placeholder for future wishlist feature
      totalSpent: user.orders
        ? user.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        : 0,
      memberSince: user.createdAt,
      lastLogin: user.lastLogin,
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.log("Get User Stats Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user profile information
const updateProfileInfo = async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode, country } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Update basic profile info
    if (name) user.name = name;

    // Handle phone and address - update the first address or create one
    if (phone || address || city || state || zipCode || country) {
      if (!user.addresses || user.addresses.length === 0) {
        // Create a default address entry
        user.addresses = [
          {
            label: "Primary",
            street: address || "",
            city: city || "",
            state: state || "",
            zipCode: zipCode || "",
            country: country || "",
            phone: phone || "",
            isDefault: true,
          },
        ];
      } else {
        // Update the first (primary) address
        if (phone) user.addresses[0].phone = phone;
        if (address) user.addresses[0].street = address;
        if (city) user.addresses[0].city = city;
        if (state) user.addresses[0].state = state;
        if (zipCode) user.addresses[0].zipCode = zipCode;
        if (country) user.addresses[0].country = country;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone:
          user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
        address:
          user.addresses && user.addresses[0] ? user.addresses[0].street : "",
        city: user.addresses && user.addresses[0] ? user.addresses[0].city : "",
        state:
          user.addresses && user.addresses[0] ? user.addresses[0].state : "",
        zipCode:
          user.addresses && user.addresses[0] ? user.addresses[0].zipCode : "",
        country:
          user.addresses && user.addresses[0] ? user.addresses[0].country : "",
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.log("Update Profile Info Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user email
const updateUserEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    // Validate new email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập một địa chỉ email hợp lệ",
      });
    }

    // Check if email is already taken by another user
    const existingUser = await userModel.findOne({
      email: email,
      _id: { $ne: req.user.id },
    });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Email đã được sử dụng bởi người dùng khác",
      });
    }

    user.email = email;
    await user.save();

    res.json({
      success: true,
      message: "Cập nhật email thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Update Email Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Upload and update user avatar
const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "Không có tệp được tải lên" });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Delete old avatar if exists
    if (user.avatar) {
      try {
        await deleteCloudinaryImage(user.avatar);
      } catch (error) {
        console.log("Error deleting old avatar:", error);
      }
    }

    // Upload new avatar to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "orebi/users",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Clean up temporary file
    cleanupTempFile(req.file.path);

    // Update user avatar
    user.avatar = uploadResult.secure_url;
    await user.save();

    res.json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công",
      avatarUrl: uploadResult.secure_url,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("Avatar update error", error);

    // Clean up temporary file even on error
    if (req.file?.path) {
      cleanupTempFile(req.file.path);
    }

    res.json({ success: false, message: error.message });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.log("Change Password Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user preferences/settings
const getUserPreferences = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("preferences");

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const preferences = user.preferences || {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
      },
      language: "vi",
      currency: "VND",
    };

    res.json({ success: true, preferences });
  } catch (error) {
    console.log("Get User Preferences Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user preferences/settings
const updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    res.json({ success: true, message: "Cập nhật tùy chọn thành công" });
  } catch (error) {
    console.log("Update User Preferences Error", error);
    res.json({ success: false, message: error.message });
  }
};

// ==================== WISHLIST FUNCTIONS ====================

// Get user's wishlist
const getUserWishlist = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate({
      path: "wishlist",
      select:
        "name price images image description category brand ratings discountedPercentage offer",
    });

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      wishlist: user.wishlist || [],
    });
  } catch (error) {
    console.log("Get Wishlist Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.json({ success: false, message: "ID sản phẩm là bắt buộc" });
    }

    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Check if product already exists in wishlist
    if (user.wishlist.includes(productId)) {
      return res.json({
        success: false,
        message: "Sản phẩm đã có trong danh sách yêu thích",
      });
    }

    // Add product to wishlist
    user.wishlist.push(productId);
    await user.save();

    // Return updated wishlist with populated products
    const updatedUser = await userModel.findById(req.user.id).populate({
      path: "wishlist",
      select:
        "name price images image description category brand ratings discountedPercentage offer",
    });

    res.json({
      success: true,
      message: "Thêm sản phẩm vào danh sách yêu thích thành công",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.log("Add to Wishlist Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.json({ success: false, message: "ID sản phẩm là bắt buộc" });
    }

    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId.toString()
    );
    await user.save();

    // Return updated wishlist with populated products
    const updatedUser = await userModel.findById(req.user.id).populate({
      path: "wishlist",
      select:
        "name price images image description category brand ratings discountedPercentage offer",
    });

    res.json({
      success: true,
      message: "Xóa sản phẩm khỏi danh sách yêu thích thành công",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.log("Remove from Wishlist Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: "Xóa danh sách yêu thích thành công",
      wishlist: [],
    });
  } catch (error) {
    console.log("Clear Wishlist Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Import reviewModel here to avoid circular dependency
    const reviewModel = (await import("../models/reviewModel.js")).default;

    const reviews = await reviewModel
      .find({ userId })
      .populate("productId", "name image")
      .populate("orderId", "_id date")
      .sort({ createdAt: -1 });

    console.log("=== USER REVIEWS API DEBUG ===");
    console.log("Found reviews:", reviews.length);
    console.log(
      "Sample review structure:",
      reviews[0]
        ? {
            _id: reviews[0]._id,
            productId: reviews[0].productId,
            orderId: reviews[0].orderId,
            rating: reviews[0].rating,
            comment: reviews[0].comment,
            images: reviews[0].images,
            imageCount: reviews[0].images?.length || 0,
          }
        : "No reviews"
    );

    // Transform reviews to ensure consistent structure for frontend
    const transformedReviews = reviews.map((review) => ({
      _id: review._id,
      productId: review.productId?._id || review.productId, // Extract _id from populated object
      orderId: review.orderId?._id || review.orderId, // Extract _id from populated object
      rating: review.rating,
      comment: review.comment,
      images: review.images || [], // Include images array
      createdAt: review.createdAt,
      isApproved: review.isApproved,
      // Keep populated data for additional info
      product: review.productId
        ? {
            name: review.productId.name,
            image: review.productId.image,
          }
        : null,
      order: review.orderId
        ? {
            date: review.orderId.date,
          }
        : null,
    }));

    console.log("Transformed reviews:", transformedReviews.length);
    console.log(
      "Sample transformed review:",
      transformedReviews[0] || "No reviews"
    );
    console.log("=== END DEBUG ===");

    res.json({
      success: true,
      reviews: transformedReviews,
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.json({
      success: false,
      message: "Không thể tải danh sách đánh giá",
    });
  }
};

export {
  userLogin,
  userRegister,
  adminLogin,
  getUsers,
  removeUser,
  updateUser,
  getUserProfile,
  updateUserProfile,
  addToCart,
  updateCart,
  getUserCart,
  clearCart,
  createAdmin,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserAddresses,
  uploadUserAvatar,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
  resetPasswordDirect,
  googleLogin,
  googleLoginWithCode,
  getUserStats,
  updateProfileInfo,
  updateUserEmail,
  updateUserAvatar,
  changePassword,
  getUserPreferences,
  updateUserPreferences,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  getUserReviews,
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("-password")
      .populate("orders");

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
      address:
        user.addresses && user.addresses[0] ? user.addresses[0].street : "",
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      orders: user.orders,
      addresses: user.addresses,
    };

    res.json({ success: true, user: userProfile });
  } catch (error) {
    console.log("Get Profile Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (name) user.name = name;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Vui lòng nhập một địa chỉ email hợp lệ",
        });
      }

      // Check if email is already taken by another user
      const existingUser = await userModel.findOne({
        email: email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.json({
          success: false,
          message: "Email đã được sử dụng bởi người dùng khác",
        });
      }

      user.email = email;
    }

    // Handle phone and address - update the first address or create one
    if (phone || address) {
      if (!user.addresses || user.addresses.length === 0) {
        // Create a default address entry
        user.addresses = [
          {
            label: "Primary",
            street: address || "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
            phone: phone || "",
            isDefault: true,
          },
        ];
      } else {
        // Update the first (primary) address
        if (phone) user.addresses[0].phone = phone;
        if (address) user.addresses[0].street = address;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone:
          user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
        address:
          user.addresses && user.addresses[0] ? user.addresses[0].street : "",
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Update Profile Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const cartKey = size ? `${productId}_${size}` : productId;

    if (user.userCart[cartKey]) {
      user.userCart[cartKey] += quantity;
    } else {
      user.userCart[cartKey] = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      cart: user.userCart,
    });
  } catch (error) {
    console.log("Add to Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update cart item
const updateCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const cartKey = size ? `${productId}_${size}` : productId;

    if (quantity <= 0) {
      delete user.userCart[cartKey];
    } else {
      user.userCart[cartKey] = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật giỏ hàng thành công",
      cart: user.userCart,
    });
  } catch (error) {
    console.log("Update Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user cart
const getUserCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      cart: user.userCart || {},
    });
  } catch (error) {
    console.log("Get Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Clear user cart
const clearCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    user.userCart = {};
    await user.save();

    res.json({
      success: true,
      message: "Xóa giỏ hàng thành công",
    });
  } catch (error) {
    console.log("Clear Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Create admin user (only accessible by existing admins)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== "admin") {
      return res.json({ success: false, message: "Yêu cầu quyền quản trị" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Người dùng đã tồn tại" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập một địa chỉ email hợp lệ",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    const admin = await newAdmin.save();

    res.json({
      success: true,
      message: "Tạo tài khoản quản trị thành công!",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log("Create Admin Error", error);
    res.json({ success: false, message: error.message });
  }
};
