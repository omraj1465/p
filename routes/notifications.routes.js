import express from "express";
import { getNotifications } from "../controllers/notification.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// router.post("/", addSkill);
router.get("/", auth, getNotifications);

export default router;
