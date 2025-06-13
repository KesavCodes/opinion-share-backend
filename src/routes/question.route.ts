import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { addQuestion, getQuestions, getQuestionsById } from "../controllers/question.controller";

const router = express.Router();

router.get("/", verifyToken, getQuestions);
router.post("/", verifyToken, addQuestion);
router.get("/:questionId", verifyToken, getQuestionsById);

export default router;
