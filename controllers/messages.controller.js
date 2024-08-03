import { io } from "../app.js";
import prisma from "../prisma/prisma.js";

export const sendMessage = async (req, res) => {
  const { content, senderId } = req.body;
  console.log("req.body => ", req.body);
  const userId = req.user.id;

  try {
    // Check if a conversation already exists between the two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: senderId,
            user2Id: userId,
          },
          {
            user1Id: userId,
            user2Id: senderId,
          },
        ],
      },
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: senderId,
          user2Id: userId,
        },
      });
    }

    // Create and send the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId: conversation.id,
      },
    });

    // Emit a socket event with the new message

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Receive a message (mark as read)
export const receiveMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
    res.status(200).json(message);
  } catch (error) {
    console.log("error => ", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all messages for a conversation
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            firstname: true,
            lastname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find conversations where the user is either user1 or user2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: true,
        user2: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Only take the most recent message
          include: {
            sender: true,
          },
        },
      },
    });

    // Extract the other user's details from each conversation and the last message
    const userConversations = conversations.map((conversation) => {
      const otherUser =
        conversation.user1Id === userId
          ? conversation.user2
          : conversation.user1;

      const lastMessage = conversation.messages[0];

      return {
        id: otherUser.id,
        conversationId: conversation.id,
        firstname: otherUser.firstname,
        lastname: otherUser.lastname,
        profileImageUrl: otherUser.profileImageUrl,
        bio: otherUser.bio,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              firstname: lastMessage.sender.firstname,
              senderId: lastMessage.sender.id,
              senderUsername: lastMessage.sender.username,
            }
          : null,
      };
    });

    res.status(200).json(userConversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
