import { Request, Response } from "express";
import prisma from "../lib/clients";
import { nanoid } from "nanoid";

export const addQuestion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      createdById,
      questionText,
      visibility,
      identity,
      isTimed,
      endTimeStamp,
      isPublic,
      recipientList,
    } = req.body;

    // Generate a unique public link if question is public
    let publicLink: string | null = null;

    if (isPublic) {
      let isUnique = false;
      let tries = 0;

      while (!isUnique && tries < 5) {
        const tempLink = nanoid(10); // 10-char unique string
        const existing = await prisma.question.findFirst({
          where: { publicLink: tempLink },
        });

        if (!existing) {
          publicLink = tempLink;
          isUnique = true;
        }

        tries++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: "Failed to generate unique public link." });
      }
    }

    const question = await prisma.question.create({
      data: {
        createdById,
        questionText,
        visibility,
        identity,
        isTimed,
        endTimeStamp: endTimeStamp ? new Date(endTimeStamp) : undefined,
        isPublic,
        publicLink,
        recipients: {
          create: recipientList?.map((userId: string) => ({
            user: {
              connect: { id: userId },
            },
          })) || [],
        },
      },
      include: {
        recipients: true,
      },
    });

    return res.status(201).json({
      message: "Question added successfully",
      data: question,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add the Question." });
  }
};
