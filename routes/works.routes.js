import express from "express";

import { auth } from "../middleware/auth.js";
import {
  addWork,
  editWork,
  getUserWorkExperienceByUsername,
  getWorkById,
} from "../controllers/work.controller.js";

const router = express.Router();

router.post("/", auth, addWork);

router.get("/:username", getUserWorkExperienceByUsername);
router.get("/single-work/:workId", getWorkById);

router.patch("/:id", editWork);

export default router;
