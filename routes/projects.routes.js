import express from "express";

import { auth } from "../middleware/auth.js";
import {
  addProject,
  deleteProject,
  getProjectById,
  getProjects,
  getUpvotes,
  removeImage,
  updateProject,
} from "../controllers/projects.controller.js";

const router = express.Router();

router.post("/", auth, addProject);
router.post("/remove-image", removeImage);

router.get("/", auth, getProjects);
router.get("/get-upvoted-projects", auth, getUpvotes);
router.get("/:id", getProjectById);

router.patch("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);
// router.patch("/", auth, );

export default router;
