import express from "express";
import { getUserProfile, registerUser } from "../controllers/user.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/register", registerUser);
router.get("/:username", verifyToken, getUserProfile);

export default router;