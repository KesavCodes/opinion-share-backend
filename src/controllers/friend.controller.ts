import { Request, Response } from "express";
import prisma from "../lib/clients";

export const getUserFriends = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req;
  const { search } = req.query;
  if (!userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.id !== userId) {
      const isAlreadyFriend = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { senderId: userId, receiver: { username } },
            { receiverId: userId, sender: { username } },
          ],
        },
      });
      if (!isAlreadyFriend)
        return res.status(401).json({ error: "Not friends with the user." });
    }
    const userFriends = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          {
            sender: {
              username,
            },
            receiver: {
              OR: [
                {
                  username: {
                    startsWith: search ? String(search) : undefined,
                    mode: "insensitive",
                  },
                },
                {
                  name: {
                    startsWith: search ? String(search) : undefined,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            receiver: {
              username,
            },
            sender: {
              OR: [
                {
                  username: {
                    startsWith: search ? String(search) : undefined,
                    mode: "insensitive",
                  },
                },
                {
                  name: {
                    startsWith: search ? String(search) : undefined,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
    if (!userFriends)
      return res.status(404).json({ error: "User friends not found." });
    const friendsArr = userFriends.map((item) =>
      item.sender.username === username ? item.receiver : item.sender
    );
    return res.json({
      message: "User retrieved successfully.",
      data: friendsArr,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user profile." });
  }
};

export const getMyFriendRequests = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req;
  if (!userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const friendRequests = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            receiverId: userId,
            status: "pending",
          },
          {
            senderId: userId,
            status: "pending",
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
    return res.json({
      message: "Friend requests retrieved successfully.",
      data: friendRequests,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to retrieve friend requests." });
  }
};

export const sendFriendRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req;
  if (!userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const friend = await prisma.user.findUnique({ where: { username } });
    if (!friend) return res.status(404).json({ error: "Friend not found." });
    if (friend.id === userId)
      return res
        .status(400)
        .json({ error: "You cannot send a friend request to yourself." });
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friend.id },
          { senderId: friend.id, receiverId: userId },
        ],
      },
    });
    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({ error: "You are already friends." });
      } else if (existingFriendship.status === "pending") {
        return res.status(400).json({ error: "Friend request already sent." });
      } else if (existingFriendship.status === "rejected") {
        return res.status(400).json({ error: "Friend request was rejected." });
      }
    }
    const friendship = await prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: friend.id,
        status: "pending",
      },
    });
    return res.json({
      message: "Friend request sent successfully.",
      data: friendship,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send friend request." });
  }
};

export const actOnFriendRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req;
  if (!userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  const { action, requestId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });
    if (!friendship)
      return res.status(404).json({ error: "Friend request not found." });
    if (action === "accept") {
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });
      return res.json({
        message: "Friend request accepted successfully.",
      });
    } else if (action === "reject") {
      await prisma.friendship.delete({ where: { id: requestId } });
      return res.json({
        message: "Friend request rejected successfully.",
      });
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to update friend request." });
  }
};

export const removeFriend = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req;
  if (!userId)
    return res.status(401).json({
      message: "Not Authenticated.",
    });
  const { friendId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });
    if (!friendship)
      return res.status(404).json({ error: "Friendship not found." });
    await prisma.friendship.delete({ where: { id: friendship.id } });
    return res.json({
      message: "Friend removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove friend." });
  }
};
