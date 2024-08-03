import prisma from "../prisma/prisma.js";

export async function sendNotificationsToTaggedUsers(
  usernames,
  taggedByUserId,
  relatedEntity
) {
  for (const username of usernames) {
    try {
      const taggedUser = await prisma.user.findUnique({ where: { username } });
      if (taggedUser) {
        const notificationData = {
          userId: taggedUser.id,
          content: `You've been tagged in a ${
            relatedEntity.type === "COMMENT" ? "comment" : "post"
          }`,
          type: `${relatedEntity.notificationType}`,
          relatedUserId: taggedByUserId,
        };
        if (relatedEntity.type === "POST") {
          notificationData.postId = relatedEntity.id;
        } else if (relatedEntity.type === "COMMENT") {
          notificationData.commentId = relatedEntity.id;
        }
        await prisma.notification.create({
          data: notificationData,
        });
      }
    } catch (error) {
      console.error(`Error sending notification to user ${username}:`, error);
    }
  }
}

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId => ", userId);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      include: {
        relatedUser: {
          select: {
            firstname: true,
            lastname: true,
            profileImageUrl: true,
            username: true,
          },
        },
        post: true,
        comment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Send the notifications in the response
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications => ", error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "An error occurred while fetching notifications." });
  }
};
