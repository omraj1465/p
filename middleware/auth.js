// auth.js
import { verifyToken } from "../helpers/jwtHelper.js";
import prisma from "../prisma/prisma.js";

export const auth = async (req, res, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    console.log("decoded => ", decoded);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded?._id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid access Token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ status: false, error: error });
  }
};
