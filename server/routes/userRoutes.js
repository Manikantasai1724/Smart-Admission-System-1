import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/rbac.js";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = Router();

// Only Admins can access user management routes
router.use(auth, authorize("Admin"));

router.route("/").get(getUsers).post(createUser);
router.route("/:id").put(updateUser).delete(deleteUser);

export default router;
