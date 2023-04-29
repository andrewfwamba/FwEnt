import express from "express";
import controller from "../controllers/User";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";
import multer from "multer";
import { isAuthenticated } from "../middleware/auth";
const router = express.Router();

const storage = multer.diskStorage({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("invalid image type!", false);
  }
};

const uploads = multer({ storage, fileFilter });

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

router.post(
  "/upload-profile",
  isAuthenticated,
  uploads.single("profile"),
  controller.uploadProfile
);
router.get("/profile", isAuthenticated, controller.profile);

export = router;
