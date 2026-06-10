import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserStats,
} from "../controllers/user.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(protect);

router.get("/profile", getProfile);

router.put(
  "/profile",
  upload.single("avatar"),
  updateProfile
);

router.put("/change-password", changePassword);

router.get("/stats", getUserStats);

export default router;