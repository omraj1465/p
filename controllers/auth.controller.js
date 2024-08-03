import prisma from "../prisma/prisma.js";
import nodemailer from "nodemailer";
import { createToken } from "../helpers/jwtHelper.js";
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All Fields Required" });
    }
    const exist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (exist) {
      return res.status(400).json({ message: "Already Registred" });
    }
    const user = await prisma.user.create({
      data: {
        email,
        password,
      },
    });
    const token = createToken(user.id);
    res.status(201).json({
      status: "success",
      message: "User Created",
      data: { ...user, token },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid email or password" });
    }

    const match = user.password === password;
    if (!match) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid email or password" });
    }

    const token = createToken(user.id);
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: { ...user, token },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export const getAccessTokenGithub = async (req, res) => {
  try {
    const { code } = req.query;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    });

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { access_token, refresh_token, expires_in } = data;
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log(userData);
    const id = userData?.id?.toString();
    const userId = req.user.id;
    console.log("userId => ", userId);
    console.log("expires_in => ", expires_in);
    const expiresAt = (await Math.floor(Date.now() / 1000)) + expires_in;
    console.log("Expires At => ", expiresAt);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        gitUsername: userData.login,
        githubId: id,
        githubToken: access_token,
        githubRefreshToken: refresh_token,
        githubTokenExpiresAt: expiresAt,
      },
    });
    console.log(user);
    console.log("accessToken send.. => ");
    res.status(200).json({ access_token: user.githubToken });
  } catch (error) {
    console.error("Error in getAccessTokenGithub:", error);
    res.status(500).json({ error: error });
  }
};

export const deleteGithub = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        githubId: null,
        gitUsername: null,
        githubToken: null,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("git user => ", user);
    res.status(200).json({ message: "Deleted success" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const chnagePasssword = async (req, res) => {
  const { password } = req.body;
  try {
    const userId = req.user.id;
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: password,
      },
    });
    res.status(200).json({ message: "Password Chnaged" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email service, e.g., 'Gmail', 'Yahoo', 'Outlook', etc.
  auth: {
    user: process.env.NODEMAILER_MAIL, // Your email address
    pass: process.env.NODEMAILER_PASSWORD, // Your email password
  },
});
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
export const sendVerificationEmail = async (req, res) => {
  const email = req.user.email;
  const otp = generateOtp();
  const htmlContent = `Hello ${req.user.firstname} \n Verification Code : ${otp} \n Best Regards \n PeerHub Team `;
  const mailOptions = {
    from: process.env.NODEMAILER_MAIL,
    to: email,
    subject: "Peerhub Email Verification",
    text: htmlContent,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending email", error });
    } else {
      await prisma.otp.upsert({
        where: { email: email },
        update: { otp: otp },
        create: {
          email: email,
          otp: otp,
        },
      });
      return res.status(200).json({ message: "Email sent successfully", info });
    }
  });
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;
    const fetchOtp = await prisma.otp.findUnique({
      where: {
        email: req.user.email,
      },
    });
    const match = fetchOtp.otp === otp;
    if (!match) {
      return res.status(400).json({ message: "OTP does not match" });
    }
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerified: true,
      },
    });
    const token = createToken(user.id);
    res.status(201).json({
      status: "success",
      message: "User Created",
      data: { ...user, token },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
