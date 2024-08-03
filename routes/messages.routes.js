import express from "express";
import {
  getMessages,
  getUserConversations,
  receiveMessage,
  sendMessage,
} from "../controllers/messages.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/send", auth, sendMessage);
router.get("/get-conversations", auth, getUserConversations);
router.get("/conversation/:conversationId", getMessages);
router.patch("/receive/:messageId", receiveMessage);

export default router;
