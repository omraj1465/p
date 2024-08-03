import { NotificationType } from "@prisma/client";
import { extractTaggedUsernames } from "../helpers/functions.js";
import prisma from "../prisma/prisma.js";
import { sendNotificationsToTaggedUsers } from "./notification.controller.js";
import { io } from "../app.js";
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id; // Assuming the auth middleware adds user info to req
    const newPost = await prisma.post.create({
      data: {
        content,
        userId,
      },
    });
    const taggedUsernames = extractTaggedUsernames(content);

    // Send notifications to tagged users
    await sendNotificationsToTaggedUsers(taggedUsernames, userId, {
      type: "POST",
      id: newPost.id,
      notificationType: "POST_TAG",
    });

    res.status(201).json({
      status: "success",
      data: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      status: "error",
      error:
        "An error occurred while creating the post. Please try again later.",
    });
  }
};
export const getAllPosts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              firstname: true,
              lastname: true,
              emailVerified: true,
              username: true,
              profileImageUrl: true,
            },
          },
          comments: true,
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.post.count(),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      user: {
        firstname: post.user.firstname,
        lastname: post.user.lastname,
        username: post.user.username,
        profileImageUrl: post.user.profileImageUrl,
      },
    }));

    res.status(200).json({
      status: "success",
      data: formattedPosts,
      totalPosts,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalPosts / pageSize),
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: "error",
      error:
        "An error occurred while fetching the posts. Please try again later.",
    });
  }
};

export const getPostsByUsername = async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: "User not found.",
      });
    }

    // Fetch posts associated with the user
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                lastname: true,
                firstname: true,
                profileImageUrl: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: "error",
      error:
        "An error occurred while fetching the posts. Please try again later.",
    });
  }
};
export const getPostDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: id },
      include: {
        user: {
          include: {
            work: true,
            education: true,
            projects: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                lastname: true,
                firstname: true,
                profileImageUrl: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstname: true,
                lastname: true,
                profileImageUrl: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Reshape the data to exclude sensitive information
    const postDetails = {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        firstname: post.user.firstname,
        lastname: post.user.lastname,
        profileImageUrl: post.user.profileImageUrl,
        bio: post.user.bio,
        work: post.user.work,
        education: post.user.education,
        projects: post.user.projects,
      },
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
      })),
      likes: post.likes.map((like) => ({
        id: like.id,
        user: like.user,
      })),
    };

    res.status(200).json(postDetails);
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const editPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, content } = req.body; // Ensure postId is included in the request body

    const post = await prisma.post.update({
      where: {
        id: postId,
        userId: userId,
      },
      data: {
        content: content,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const post = await prisma.post.delete({
      where: {
        id: postId,
        userId: userId,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;
    const like = await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await prisma.notification.create({
      data: {
        userId: post.userId,
        content: "Someone upvoted your post",
        type: NotificationType.POST_LIKE,
        postId: postId,
        relatedUserId: userId,
      },
    });
    io.to(post.userId).emit("newNotification", {
      type: NotificationType.POST_LIKE,
      content: "Someone upvoted your post",
    });

    res.status(201).json(like);
  } catch (error) {
    res.status(500).json({ error: "Failed to like the post" });
  }
};

// Unlike a post
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;
    await prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    res.status(200).json({ message: "Unliked the post" });
  } catch (error) {
    res.status(500).json({ error: "Failed to unlike the post" });
  }
};
export const addComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const userId = req.user.id;
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        post: true,
      },
    });
    console.log("comment => ", comment);
    const taggedUsernames = extractTaggedUsernames(content);
    console.log("taggedUsernames => ", taggedUsernames);
    // Send notifications to tagged users
    await sendNotificationsToTaggedUsers(taggedUsernames, userId, {
      type: "COMMENT",
      id: comment.id,
      notificationType: "COMMENT_TAG",
    });
    const noti = await prisma.notification.create({
      data: {
        userId: comment.post.userId,
        content: "Someone commented on your post",
        type: NotificationType.POST_COMMENT,
        postId: postId,
        relatedUserId: comment.userId,
      },
    });
    io.to(comment.post.userId).emit("newNotification", {
      type: NotificationType.POST_COMMENT,
      content: "Someone commented on your post",
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
};

export const getUsersUpvotes = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const postsLikedByUser = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        user: {
          select: {
            firstname: true,
            lastname: true,
            emailVerified: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(postsLikedByUser);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
