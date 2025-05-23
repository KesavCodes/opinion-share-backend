import express from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  actOnFriendRequest,
  getMyFriendRequests,
  getUserFriends,
  removeFriend,
  sendFriendRequest,
} from "../controllers/friend.controller";

const router = express.Router();

router.get("/request/me", verifyToken, getMyFriendRequests);
router.get("/:username/friends", verifyToken, getUserFriends);
router.post("/request/:username", verifyToken, sendFriendRequest);
router.post("/act/:requestId/:action", verifyToken, actOnFriendRequest);
router.post("/remove/:friendId", verifyToken, removeFriend);

export default router;
