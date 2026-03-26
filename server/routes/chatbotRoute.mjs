import express from "express";
import {
  handleChatbot,
  getChatHistory,
} from "../controllers/chatbotController.mjs";

const router = express.Router();

// Chatbot endpoint - handle message
router.post("/", handleChatbot);

// Get chat history
router.get("/history", getChatHistory);

export default router;
