import prisma from "../prisma/prisma.js";

const BATCH_INTERVAL = 5000; // 5 seconds
let messageQueue = [];

// Function to insert messages in batch
const insertMessagesBatch = async () => {
  if (messageQueue.length > 0) {
    try {
      await prisma.message.createMany({
        data: messageQueue,
      });
      console.log(
        `Inserted ${
          messageQueue.length
        } messages to the database with content => ${JSON.stringify(
          messageQueue,
          null,
          2
        )}`
      );
      messageQueue = []; // Clear the queue after insert
    } catch (error) {
      console.error("Error inserting messages batch:", error);
    }
  }
};

// Periodically insert messages batch
setInterval(insertMessagesBatch, BATCH_INTERVAL);

// Function to add a message to the queue
export const addMessageToQueue = (message) => {
  messageQueue.push(message);
};
