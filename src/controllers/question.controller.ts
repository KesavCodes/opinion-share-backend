import { Request, Response } from "express";
import prisma from "../lib/clients";

export const addQuestion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    let {
      createdById,
      questionText,
      visibility,
      identity,
      isTimed,
      endTimeStamp,
      isPublic,
    } = req.body;
    const question = await prisma.question.create({
      data: {
        createdById,
        questionText,
        visibility,
        identity,
        isTimed,
        endTimeStamp: endTimeStamp ? new Date(endTimeStamp) : undefined,
        isPublic,
      },
    });
    return res.status(201).send({
      message: "Question added successfully ",
      data: question,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add the Question." });
  }
};
