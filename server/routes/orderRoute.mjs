import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,
  notifyOrderViewed,
} from "../controllers/orderController.mjs";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = Router();

const routeValue = "/api/order/";

// User routes (require authentication)
router.post(`${routeValue}create`, userAuth, createOrder);
router.get(`${routeValue}my-orders`, userAuth, getUserOrders);
router.get(`${routeValue}user/:orderId`, userAuth, getUserOrderById);
router.post(`${routeValue}notify/:orderId`, userAuth, notifyOrderViewed);

// Admin routes
router.get(`${routeValue}admin/user/:userId`, adminAuth, getUserOrders);
router.get(`${routeValue}list`, adminAuth, getAllOrders);
router.get(`${routeValue}stats`, adminAuth, getOrderStats);
router.post(`${routeValue}update-status`, adminAuth, updateOrderStatus);
router.post(`${routeValue}delete`, adminAuth, deleteOrder);

export default router;
