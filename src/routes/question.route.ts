import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { addQuestion } from "../controllers/question.controller";

const router = express.Router();

router.post("/", verifyToken, addQuestion);

export default router;
