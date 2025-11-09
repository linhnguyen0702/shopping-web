import express from "express";
import {
  createOrder,
  getBankInfo,
  generatePaymentQR,
  confirmBankTransfer,
  verifyBankTransfer,
  notifyPaymentConfirmation,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Create order
router.post("/api/order/create", userAuth, createOrder);

// Bank transfer routes
router.get(`${routeValue}bank-info/:orderId`, userAuth, getBankInfo);
router.post(`${routeValue}confirm-transfer`, userAuth, confirmBankTransfer);

// QR Code payment
router.get(`${routeValue}qr-code/:orderId`, userAuth, generatePaymentQR);

// Notify admin when customer confirms payment
router.post(
  `${routeValue}notify/:orderId`,
  userAuth,
  notifyPaymentConfirmation
);

// Admin: Verify bank transfer
router.post(`${routeValue}verify-transfer`, adminAuth, verifyBankTransfer);

export default router;
