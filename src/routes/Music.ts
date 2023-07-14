import express from "express";
import controller from "../controllers/Music";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";
import multer from "multer";
import path from "path";
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const source = process.env.BASE_URL || "";
    const uniqueSuffix =
      source + "/" + Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "audio/mpeg") {
      return cb(new Error("Only mp3 files are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/create",
  upload.single("music"),
  ValidateSchema(Schemas.music.create),
  controller.createMusic
);
router.get("/get/:musicId", controller.getMusic);
router.get("/get", controller.getAllMusic);
router.patch(
  "/update/:musicId",
  ValidateSchema(Schemas.music.update),
  controller.updateMusic
);
router.delete("/delete/:musicId", controller.deleteMusic);

router.get("/mp3/:title", controller.stream);
router.get("/mp3/stream/:title", controller.altStream);

export = router;
