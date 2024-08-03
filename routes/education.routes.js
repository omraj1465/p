import express from "express";

import { auth } from "../middleware/auth.js";
import {
  addEducation,
  getUserWorkEducationByUsername,
} from "../controllers/education.controller.js";

const router = express.Router();

router.post("/", auth, addEducation);
router.get("/:username", getUserWorkEducationByUsername);
// router.get("/:id", getProjectById);
// router.patch("/:id", auth, updateProject);
// router.delete("/:id", auth, deleteProject);
// router.patch("/", auth, );

export default router;
