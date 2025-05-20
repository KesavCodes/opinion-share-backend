import { Request, Response } from "express";
import prisma from "../lib/clients";

export const getMyProfileData = async (
  req: Request,
  res: Response
): Promise<any> => {
  if (!req.userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found." });
  const { password, ...profileWithoutSensitiveData } = user;
  return res.json({
    message: "Profile retrieved successfully",
    data: profileWithoutSensitiveData,
  });
};

export const updateMyProfileData = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.userId)
      return res.status(401).json({
        message: "Not Authenticated.",
      });
    const { name, email, avatar } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name || user.name,
        email: email || user.email,
        avatar: avatar || user.avatar,
      },
    });
    if (!updatedUser)
      return res.status(500).json({ error: "Failed to update user." });
    const { password, ...userWithoutSensitiveData } = updatedUser;
    return res.json({
      message: "User updated successfully.",
      data: userWithoutSensitiveData,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user profile." });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const { password, ...userWithoutSensitiveData } = user;
    return res.json({
      message: "User retrieved successfully.",
      data: userWithoutSensitiveData,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user profile." });
  }
};

//Need to test in POSTMAN
export const getUserFriends = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { username } = req.params;
  try {
    const userFriends = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          {
            sender: {
              username,
            },
          },
          {
            receiver: {
              username,
            },
          },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
    if (!userFriends)
      return res.status(404).json({ error: "User friends not found." });
    return res.json({
      message: "User retrieved successfully.",
      data: userFriends,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user profile." });
  }
};
