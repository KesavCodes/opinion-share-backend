import { Request, Response } from "express";
import prisma from "../lib/clients";
import { comparePassword, hashPassword } from "../lib/hashHelper";
import { generateToken } from "../lib/token";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { username, email, password } = req.body;

  // Checking all the fields exists
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are necessary" });

  try {
    // Checking if the username and email is available
    const IsUserNameExist = await prisma.user.findUnique({
      where: { username },
    });
    if (IsUserNameExist)
      return res.status(400).json({ message: "Username already exists." });
    const IsEmailExist = await prisma.user.findUnique({
      where: { email },
    });
    if (IsEmailExist)
      return res.status(400).json({ message: "Email already exists." });

    // Random avatar generator
    const avatar = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${username}`;

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Removing password Hash from the user obj
    const { password: RemovePasswordFromUser, ...user } =
      await prisma.user.create({
        data: { email, username, password: hashedPassword, avatar },
      });

    return res
      .status(201)
      .json({ message: "User created successfully", data: user });
  } catch (error) {
    return res.status(500).json({ error: "User registration failed." });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { idText, password } = req.body;

  if (!idText || !password)
    return res.status(400).json({ message: "All fields are necessary" });
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: idText }, { username: idText }] },
  });

  if (!user) return res.status(400).json({ message: "Invalid credentials." });

  const { password: hashedPassword, ...userWithoutConfidentialInfo } = user;
  const IsPasswordCorrect = comparePassword(password, hashedPassword);
  if (!IsPasswordCorrect)
    return res.status(400).json({ message: "Invalid credentials." });
  const token = generateToken(user.id);
  return res.status(200).json({
    message: "User LoggedIn Successfully",
    data: {
      token,
      user: userWithoutConfidentialInfo,
    },
  });
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve user profile." });
  }
};
