import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  createOrder,
  createStripeSession,
  createPayPalOrder,
  handleStripeSuccess,
  handlePayPalSuccess,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Create order
router.post("/api/order/create", userAuth, createOrder);

// Stripe payment routes
router.post(
  `${routeValue}stripe/create-payment-intent`,
  userAuth,
  createPaymentIntent
);
router.post(`${routeValue}stripe/confirm-payment`, userAuth, confirmPayment);

// Stripe webhook (no auth required)
router.post(
  `${routeValue}stripe/webhook`,
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// New payment flow routes
router.post(
  `${routeValue}create-stripe-session`,
  userAuth,
  createStripeSession
);
router.post(`${routeValue}create-paypal-order`, userAuth, createPayPalOrder);
router.get(`${routeValue}stripe/success`, handleStripeSuccess);
router.post(`${routeValue}paypal/success`, handlePayPalSuccess);

export default router;
