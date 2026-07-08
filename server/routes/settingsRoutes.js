import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/rbac.js";
import { getSettings, updateSettings } from "../controllers/settingsController.js";

const router = Router();

// Everyone logged in can view settings, only Admins can update
router.get("/", auth, getSettings);
router.post("/", auth, authorize("Admin"), updateSettings);

export default router;
