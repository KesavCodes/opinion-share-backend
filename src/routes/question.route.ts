import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { addQuestion, getQuestions } from "../controllers/question.controller";

const router = express.Router();

router.get("/", verifyToken, getQuestions);
router.post("/", verifyToken, addQuestion);

export default router;
