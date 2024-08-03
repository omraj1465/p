import prisma from "../prisma/prisma.js";

export const createSpotlight = async (req, res) => {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Calculate the current week number of the year
    const startOfYear = new Date(startDate.getFullYear(), 0, 1);
    const currentWeekNumber = Math.ceil(
      ((startDate - startOfYear) / 86400000 + 1) / 7
    );

    await prisma.spotlightWeek.create({
      data: {
        startDate,
        endDate,
        weekNumber: currentWeekNumber, // Current week number
      },
    });
  } catch (error) {}
};

export const launchProjectOnSpotlight = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;
    // Check if the project exists and belongs to the user
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or does not belong to the user" });
    }

    // Check if the project has already been launched
    if (project.spotlightLaunchedAt) {
      return res
        .status(400)
        .json({ error: "Project has already been launched on spotlight" });
    }

    const currentWeek = await prisma.spotlightWeek.findFirst({
      orderBy: {
        startDate: "desc",
      },
    });

    if (!currentWeek) {
      return res.status(400).json({ error: "No active spotlight week found" });
    }

    // Launch the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        spotlightLaunchedAt: new Date(),
        SpotlightWeek: { connect: { id: currentWeek.id } },
      },
    });

    res.status(200).json({
      message: "Project successfully launched on spotlight",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error launching project on spotlight:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSpotlightDetails = async (req, res) => {
  try {
    const { weekNumber } = req.query; // Assume weekNumber is passed as a query parameter
    if (!weekNumber) {
      return res.status(400).json({ error: "Week number is required" });
    }
    const spotlightWeek = await prisma.spotlightWeek.findFirst({
      where: { weekNumber: parseInt(weekNumber) },
      include: {
        projects: {
          include: {
            allupvotes: true,
          },
        },
      },
    });
    if (!spotlightWeek) {
      return res
        .status(404)
        .json({ error: "SpotlightWeek not found for the given week number" });
    }
    spotlightWeek.projects.sort(
      (a, b) => b.allupvotes.length - a.allupvotes.length
    );
    res.status(200).json(spotlightWeek);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const createUpvote = async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user.id;
  try {
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (existingUpvote) {
      return res
        .status(400)
        .json({ message: "User has already upvoted this project." });
    }

    // Create a new upvote
    const upvote = await prisma.upvote.create({
      data: {
        userId,
        projectId,
      },
    });

    // Optionally, you can also increment the upvote count on the project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        upvotes: { increment: 1 },
      },
    });

    res.status(201).json(upvote);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while creating the upvote.", error });
  }
};
export const removeUpvote = async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user.id;

  try {
    // Check if the upvote exists
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!existingUpvote) {
      return res.status(400).json({ message: "Upvote does not exist." });
    }

    // Delete the upvote
    await prisma.upvote.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    // Optionally, you can also decrement the upvote count on the project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        upvotes: { decrement: 1 },
      },
    });

    res.status(200).json({ message: "Upvote removed successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while removing the upvote.", error });
  }
};
