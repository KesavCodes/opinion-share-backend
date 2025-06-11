import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getMyProfileData,
  getUserProfile,
  searchUsers,
  updateMyProfileData,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/me", verifyToken, getMyProfileData);
router.put("/me", verifyToken, updateMyProfileData);
router.get('/search', verifyToken, searchUsers)
router.get("/:username", verifyToken, getUserProfile);

export default router;
