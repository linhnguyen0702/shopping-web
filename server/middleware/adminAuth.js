import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.headers.token;

    if (!token) {
      return res.json({ success: false, message: "Not Authorized, try again" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully, user ID:", decoded.id);

    // Find user by ID from token
    const user = await userModel.findById(decoded.id);
    console.log(
      "User found:",
      user ? `${user.name} (${user.role})` : "No user"
    );

    if (!user) {
      console.log("User not found in database");
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role !== "admin") {
      console.log("User is not admin, role:", user.role);
      return res.json({ success: false, message: "Admin access required" });
    }

    if (!user.isActive) {
      console.log("User account is not active");
      return res.json({ success: false, message: "Account is deactivated" });
    }

    console.log("Admin authentication successful");
    // Add user info to request object
    req.user = user;
    
    // Update last active timestamp
    await userModel.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
    
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Invalid token" });
  }
};

export default adminAuth;
