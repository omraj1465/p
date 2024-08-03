import prisma from "../prisma/prisma.js";

export const addWork = async (req, res) => {
  try {
    const { title, company_name, start_date, end_date, skills, description } =
      req.body;
    const userId = req.user.id;
    if (!title || !company_name || !start_date) {
      return res.status(400).json({
        status: "error",
        error: "All fields are required.",
      });
    }
    const newWork = await prisma.work.create({
      data: {
        title: title,
        company_name: company_name,
        userId: userId,
        start_date: start_date,
        end_date: end_date,
        skills: skills,
        description: description,
      },
    });
    res.status(201).json({
      status: "success",
      data: newWork,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
export const getUserWorkExperienceByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch user work experience by username
    const userWorkExperience = await prisma.user.findUnique({
      where: { username },
      select: {
        work: {
          select: {
            id: true,
            title: true,
            company_name: true,
            start_date: true,
            end_date: true,
            skills: true,
            description: true,
          },
          orderBy: {
            start_date: "desc",
          },
        },
      },
    });

    if (!userWorkExperience) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: userWorkExperience.work,
    });
  } catch (error) {
    console.error("Error fetching user work experience by username:", error);
    res.status(500).json({
      status: "error",
      message:
        "An error occurred while fetching the user work experience. Please try again later.",
    });
  }
};

export const getWorkById = async (req, res) => {
  try {
    const { workId } = req.params;
    const work = await prisma.work.findUnique({
      where: {
        id: workId,
      },
    });
    if (!work) {
      return res.status(404).json({ message: "Not Found Work" });
    }
    res.status(200).json(work);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message:
        "An error occurred while fetching the user work experience. Please try again later.",
    });
  }
};
export const editWork = async (req, res) => {
  try {
    const { id } = req.params; // Assume the work ID is passed as a route parameter
    const { title, company_name, start_date, end_date, skills, description } =
      req.body;

    // Check if all required fields are present
    if (!title || !company_name || !start_date) {
      return res.status(400).json({
        status: "error",
        error: "Title, company name, and start date are required fields.",
      });
    }

    // Update the work entry in the database
    const updatedWork = await prisma.work.update({
      where: { id: parseInt(id) }, // Ensure the ID is an integer
      data: {
        title: title,
        company_name: company_name,
        start_date: start_date,
        end_date: end_date,
        skills: skills,
        description: description,
      },
    });

    // Respond with the updated work entry
    res.status(200).json({
      updatedWork,
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma's error code for record not found
      return res
        .status(404)
        .json({ status: "error", message: "Work entry not found." });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};
