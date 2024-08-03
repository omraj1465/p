import prisma from "../prisma/prisma.js";
export const addSkill = async (req, res) => {
  try {
    const { name, logo } = req.body;
    if (!name || !logo) {
      return res.status(500).json({
        status: "error",
        error: "All Required",
      });
    }
    const newSkill = await prisma.skill.create({
      data: {
        name,
        logo,
      },
    });
    res.status(200).json({
      status: "success",
      data: newSkill,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
    });
  }
};

export const getSkills = async (req, res) => {
  const { search } = req.params;

  try {
    const skills = await prisma.skills.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    });
    res.status(200).json({
      status: "success",
      data: skills,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};
