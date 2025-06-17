import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  addAnswer,
  addQuestion,
  getQuestionAnswers,
  getQuestions,
  getQuestionsById,
} from "../controllers/question.controller";

const router = express.Router();

router.get("/", verifyToken, getQuestions);
router.post("/", verifyToken, addQuestion);
router.get("/:questionId", verifyToken, getQuestionsById);
router.get("/:questionId/answers", verifyToken, getQuestionAnswers);
router.post("/:questionId/answer", verifyToken, addAnswer);

export default router;
