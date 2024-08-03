import express from "express";

import { auth } from "../middleware/auth.js";
import {
  addComment,
  createPost,
  deletePost,
  editPost,
  getAllPosts,
  getPostDetails,
  getPostsByUsername,
  getUsersUpvotes,
  likePost,
  unlikePost,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.post("/", auth, createPost);
router.post("/upvote", auth, likePost);
router.post("/removeupvote", auth, unlikePost);
router.post("/comment", auth, addComment);

router.get("/", getAllPosts);
router.get("/liked-posts", auth, getUsersUpvotes);
router.get("/:id", getPostDetails);
router.get("/:username/posts", getPostsByUsername);

router.patch("/", auth, editPost);
router.delete("/:postId", auth, deletePost);
// router.get("/:username", getUserByUsername);
// router.patch("/", auth, primaryDetails);

export default router;
