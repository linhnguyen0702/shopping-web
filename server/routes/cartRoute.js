import express from "express";
import {
  getCart,
  updateCart,
  clearCart,
} from "../controllers/cartController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.get("/", userAuth, getCart);
router.put("/", userAuth, updateCart);
router.delete("/", userAuth, clearCart);

export default router;
