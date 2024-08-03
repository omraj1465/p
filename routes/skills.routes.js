import express from "express";

import { addSkill, getSkills } from "../controllers/skills.controller.js";

const router = express.Router();

router.post("/", addSkill);
router.get("/:search", getSkills);

export default router;
