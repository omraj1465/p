import prisma from "../prisma/prisma.js";
export const addEducation = async (req, res) => {
  try {
    const { institute_name, degree, study, start_year, end_year } = req.body;
    const userId = req.user.id;
    if (!institute_name || !degree || !study) {
      return res.status(400).json({
        status: "error",
        error: "All fields are required.",
      });
    }
    const newEducation = await prisma.education.create({
      data: {
        institute_name: institute_name,
        degree: degree,
        userId: userId,
        study: study,
        start_year: start_year,
        end_year: end_year,
      },
    });
    res.status(201).json({
      status: "success",
      data: newEducation,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
export const getUserWorkEducationByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch user work experience by username
    const userEducation = await prisma.user.findUnique({
      where: { username },
      select: {
        education: {
          select: {
            institute_name: true,
            degree: true,
            userId: true,
            study: true,
            start_year: true,
            end_year: true,
          },
          orderBy: {
            start_year: "desc",
          },
        },
      },
    });

    if (!userEducation) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: userEducation.education,
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
