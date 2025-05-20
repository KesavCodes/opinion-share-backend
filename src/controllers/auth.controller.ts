import { Request, Response } from "express";
import prisma from "../lib/clients";
import { comparePassword, hashPassword } from "../lib/hashHelper";
import { generateToken } from "../lib/token";
import { isValidEmail, isValidUsername } from "../utils/validations";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { username, email, password } = req.body;

  // Checking all the fields exists
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are necessary" });

  if (!isValidEmail(email))
    return res.status(400).json({ message: "Invalid E-mail address" });
  if (!isValidUsername)
    return res.status(400).json({
      message:
        "Invalid username. Use 3–30 characters: letters, numbers, underscores, or hyphens only",
    });
  if (password.length < 8)
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
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
    const avatar = `https://api.dicebear.com/9.x/fun-emoji/png?seed=${username}`;

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Removing password Hash from the user obj
    const { password: RemovePasswordFromUser, ...userWithoutConfidentialInfo } =
      await prisma.user.create({
        data: { email, username, password: hashedPassword, avatar },
      });

    const token = generateToken(userWithoutConfidentialInfo.id);

    return res.status(201).json({
      message: "User created successfully",
      data: {
        token,
        user: userWithoutConfidentialInfo,
      },
    });
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
