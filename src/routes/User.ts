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
}; // handles profile image uploads

const uploads = multer({ storage, fileFilter });

router.post(
  "/create",
  ValidateSchema(Schemas.user.create),
  controller.createUser
); // for user sign up
router.post(
  "/signin",
  ValidateSchema(Schemas.user.signin),
  controller.loginUser
); // logs in the user

router.post(
  "/upload-profile",
  isAuthenticated,
  uploads.single("profile"),
  controller.uploadProfile
); //lets user upload profile picture
router.get("/profile", isAuthenticated, controller.profile);// gets user info to the client

export = router;
