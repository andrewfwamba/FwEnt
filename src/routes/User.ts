import express from "express";
import controller from "../controllers/User";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";
const router = express.Router();

router.post(
  "/create",
  ValidateSchema(Schemas.user.create),
  controller.createUser
);
router.post(
  "/signin",
  ValidateSchema(Schemas.user.signin),
  controller.loginUser
);

export = router;
