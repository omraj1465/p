import express from "express";

import {
  createSpotlight,
  createUpvote,
  getSpotlightDetails,
  launchProjectOnSpotlight,
  removeUpvote,
} from "../controllers/spotlight.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createSpotlight);
router.post("/launch", auth, launchProjectOnSpotlight);
router.post("/upvote", auth, createUpvote);
router.post("/removeupvote", auth, removeUpvote);

router.get("/", getSpotlightDetails);

export default router;
