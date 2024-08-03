import prisma from "../prisma/prisma.js";
import { addMessageToQueue } from "../helpers/messageQueue.js";

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected => ", socket.id);

    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User with ID: ${socket.id} joined room: ${room}`);
    });

    socket.on("create_conversation", async (data, callback) => {
      try {
        const { userId, senderId } = data;
        const newConversation = await prisma.conversation.create({
          data: {
            user1Id: senderId,
            user2Id: userId,
          },
        });
        callback({ conversationId: newConversation.id });
      } catch (error) {
        console.log("error => ", error);
      }
    });

    socket.on("send_message", async (data) => {
      const { conversationId, message, senderId } = data;
      const newMessage = {
        conversationId,
        senderId,
        content: message,
        createdAt: new Date(),
        isRead: false,
      };

      try {
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
          select: {
            firstname: true,
            lastname: true,
            username: true,
            profileImageUrl: true,
          },
        });

        if (!sender) {
          console.error(`Sender with id ${senderId} not found`);
          return;
        }

        const messageWithSender = {
          ...newMessage,
          sender: {
            firstname: sender.firstname,
            lastname: sender.lastname,
            username: sender.username,
            profileImageUrl: sender.profileImageUrl,
          },
        };

        addMessageToQueue(newMessage);

        socket.to(conversationId).emit("receive_message", messageWithSender);
        console.log(`Message sent to room ${conversationId}`);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("noti_room", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined`);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

export default socketHandler;
