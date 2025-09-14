import { Router } from "express";
import {
  adminLogin,
  getUsers,
  removeUser,
  updateUser,
  userLogin,
  userRegister,
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
} from "../controllers/userController.mjs";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";
import { avatarUpload } from "../middleware/avatarUpload.mjs";

const router = Router();

const routeValue = "/api/user/";

// Public routes
router.post(`${routeValue}register`, userRegister);
router.post(`${routeValue}login`, userLogin);
router.post(`${routeValue}admin`, adminLogin);
router.post(`${routeValue}google`, googleLogin);
router.post(`${routeValue}google/code`, googleLoginWithCode);

// Password reset public routes
router.post(`${routeValue}password/otp/send`, sendPasswordResetOtp);
router.post(`${routeValue}password/otp/verify`, verifyPasswordResetOtp);
router.post(`${routeValue}password/reset`, resetPasswordWithToken);
// Direct reset without OTP
router.post(`${routeValue}password/reset-direct`, resetPasswordDirect);

// User-protected routes
router.get(`${routeValue}profile`, userAuth, getUserProfile);
router.put(`${routeValue}profile`, userAuth, updateUserProfile);
router.post(`${routeValue}cart/add`, userAuth, addToCart);
router.put(`${routeValue}cart/update`, userAuth, updateCart);
router.get(`${routeValue}cart`, userAuth, getUserCart);
router.delete(`${routeValue}cart/clear`, userAuth, clearCart);

// Profile management routes
router.get(`${routeValue}stats`, userAuth, getUserStats);
router.put(`${routeValue}profile/info`, userAuth, updateProfileInfo);
router.put(`${routeValue}profile/email`, userAuth, updateUserEmail);
router.put(`${routeValue}password/change`, userAuth, changePassword);
router.get(`${routeValue}preferences`, userAuth, getUserPreferences);
router.put(`${routeValue}preferences`, userAuth, updateUserPreferences);

// Avatar upload route (user)
router.post(
  `${routeValue}profile/avatar`,
  userAuth,
  avatarUpload.single("avatar"),
  updateUserAvatar
);

// User address management routes
router.get(`${routeValue}addresses`, userAuth, getUserAddresses);
router.post(`${routeValue}addresses`, userAuth, addAddress);
router.put(`${routeValue}addresses/:addressId`, userAuth, updateAddress);
router.delete(`${routeValue}addresses/:addressId`, userAuth, deleteAddress);
router.put(
  `${routeValue}addresses/:addressId/default`,
  userAuth,
  setDefaultAddress
);

// Avatar upload route (admin only)
router.post(
  `${routeValue}upload-avatar`,
  adminAuth,
  avatarUpload.single("avatar"),
  uploadUserAvatar
);

// Address management routes (admin only)
router.get(`${routeValue}:userId/addresses`, adminAuth, getUserAddresses);
router.post(`${routeValue}:userId/addresses`, adminAuth, addAddress);
router.put(
  `${routeValue}:userId/addresses/:addressId`,
  adminAuth,
  updateAddress
);
router.delete(
  `${routeValue}:userId/addresses/:addressId`,
  adminAuth,
  deleteAddress
);
router.put(
  `${routeValue}:userId/addresses/:addressId/default`,
  adminAuth,
  setDefaultAddress
);

// Admin-protected routes
router.get(`${routeValue}users`, adminAuth, getUsers);
router.post(`${routeValue}remove`, adminAuth, removeUser);
router.put(`${routeValue}update/:id`, adminAuth, updateUser);
router.post(`${routeValue}create-admin`, adminAuth, createAdmin);

export default router;
