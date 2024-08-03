import { NotificationType } from "@prisma/client";
import { formatReportData } from "../helpers/functions.js";
import prisma from "../prisma/prisma.js";

export const viewProfile = async (req, res) => {
  const { profileId } = req.params;
  console.log("req.params => ", req.params);
  const userId = req.user.id;
  console.log("profileId => ", profileId);
  try {
    if (profileId === userId) {
      console.log("your profile ");
      return;
    }
    // Get today's date in ISO format for comparison
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    // Check if the user has already viewed the profile today
    const existingView = await prisma.profileView.findFirst({
      where: {
        profileId: profileId,
        viewerId: userId,
        viewedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingView) {
      return res
        .status(200)
        .json({ message: "Profile view already recorded for today" });
    }

    // Create a new profile view record
    await prisma.profileView.create({
      data: {
        profileId: profileId,
        viewerId: userId,
      },
    });
    const noti = await prisma.notification.create({
      data: {
        userId: profileId,
        content: "Someone viewed your profile",
        type: NotificationType.PROFILE_VIEW,
        relatedUserId: userId,
      },
    });
    console.log(noti);

    res.status(200).json({ message: "Profile view recorded successfully" });
  } catch (error) {
    console.error("Error recording profile view:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getViewReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const days = parseInt(req.query.days) || 15; // Default to 15 days if not provided
    console.log("days => ", days);
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);

    const views = await prisma.profileView.findMany({
      where: {
        profileId: userId,
        viewedAt: {
          gte: pastDate,
          lte: today,
        },
      },
      select: {
        viewedAt: true,
      },
    });

    console.log("views => ", views);

    const { report, totalCount } = formatReportData(views, days);
    res.status(200).json({ report, totalCount });
  } catch (error) {
    console.error("Error generating view report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
