import express from "express";
import {
  createOrder,
  getBankInfo,
  generatePaymentQR,
  confirmBankTransfer,
  verifyBankTransfer,
  notifyPaymentConfirmation,
  initiateOnlinePayment,
  createVNPayPayment,
  vnpayReturn,
  getVNPayTransactionStatus,
  confirmManualPayment,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Create order (COD only)
router.post("/api/order/create", userAuth, createOrder);

// Initiate online payment (VNPay, QR Code, Bank Transfer)
router.post(`${routeValue}initiate`, userAuth, initiateOnlinePayment);

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

// Confirm manual payment (QR Code / Bank Transfer)
router.post(`${routeValue}confirm-manual-payment`, userAuth, confirmManualPayment);

// Admin: Verify bank transfer
router.post(`${routeValue}verify-transfer`, adminAuth, verifyBankTransfer);

// ============= VNPay Routes =============
// Create VNPay payment URL
router.post(`${routeValue}vnpay/create`, userAuth, createVNPayPayment);

// VNPay return callback (no auth required - called by VNPay)
router.get(`${routeValue}vnpay_return`, vnpayReturn);

// Check VNPay transaction status
router.get(
  `${routeValue}vnpay/status/:orderId`,
  userAuth,
  getVNPayTransactionStatus
);

export default router;
