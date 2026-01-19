import express from "express";
import { handleChatbot } from "../controllers/chatbotController.mjs";

const router = express.Router();

// Chatbot endpoint
router.post("/", handleChatbot);

export default router;
