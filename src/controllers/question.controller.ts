import { Request, Response } from "express";
import prisma from "../lib/clients";
import { nanoid } from "nanoid";

export const getQuestions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req;
    const { page } = req.params;

    const skip = page ? (parseInt(page) - 1) * 5 : 0;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }

    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { createdById: userId as string },
          { recipients: { some: { userId: userId as string } } },
        ],
      },
      include: {
        createdBy: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Limit to 5 questions
      skip, // Skip for pagination
    });

    return res.status(200).json({
      message: "Questions fetched successfully",
      data: questions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch the Question." });
  }
};

export const getQuestionsById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }
    const { questionId } = req.params;

    const questionData = await prisma.question.findFirst({
      where: {
        AND: [
          { id: questionId },
          {
            OR: [
              { createdById: userId },
              {
                recipients: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        createdBy: {
          select: {
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
    if (!questionData)
      return res.status(400).json({
        error: "User doesn't have any question with that question ID",
      });
    return res.status(200).json({
      message: "Questions fetched successfully",
      data: questionData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch the Question." });
  }
};

export const getQuestionAnswers = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }
    const { questionId } = req.params;
    const { page } = req.query;
    const questionData = await prisma.question.findFirst({
      where: {
        AND: [
          { id: questionId },
          {
            OR: [
              { createdById: userId },
              {
                recipients: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        ],
      },
    });
    if (!questionData)
      return res.status(400).json({
        error: "User doesn't have any question with that question ID",
      });

    const answerData = [];
    if (Number(page) === 1) {
      const userAnswer = await prisma.answer.findFirst({
        where: {
          questionId,
          userId,
        },
        include: {
          user: {
            select: {
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
      answerData.push(userAnswer);
    }

    const otherParticipantAnswer = await prisma.answer.findMany({
      where: {
        questionId,
        userId: {
          not: userId,
        },
      },
      orderBy: {
        answeredAt: "desc",
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      skip:  page ? (Number(page) - 1) * 5 : 0,
      take: Number(page) === 1 ? 4 : 5,
    });
    answerData.push(otherParticipantAnswer);
    return res.status(200).json({
      message: "Answers fetched successfully",
      data: answerData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch the Answers." });
  }
};

export const addQuestion = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }
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
        return res
          .status(500)
          .json({ error: "Failed to generate unique public link." });
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
          create:
            recipientList?.map((userId: string) => ({
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

export const addAnswer = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }
    const { questionId } = req.params;
    const { answer } = req.body;
    const questionData = await prisma.question.findFirst({
      where: {
        AND: [
          { id: questionId },
          {
            OR: [
              { createdById: userId },
              {
                recipients: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        ],
      },
    });
    if (!questionData)
      return res.status(400).json({
        error: "User doesn't have any question with that question ID",
      });
    if (!answer)
      return res.status(400).json({
        error: "Answer cannot be empty.",
      });
    const postAnswer = await prisma.answer.create({
      data: {
        questionId,
        userId,
        answer,
      },
    });
    return res.status(201).json({
      message: "Question added successfully",
      data: postAnswer,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add the Question." });
  }
};
